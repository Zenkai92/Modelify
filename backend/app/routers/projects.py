from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.schemas import ProjectRequestCreate, ProjectRequestResponse
from app.database import supabase
from typing import Optional, List
import json
from datetime import datetime

router = APIRouter()

@router.post("/projects", response_model=dict)
async def create_project_request(
    title: str = Form(...),
    descriptionClient: str = Form(...),
    typeProject: str = Form(..., alias="typeProject"),
    goal: str = Form(...),
    userId: str = Form(...),
    nbElements: str = Form("unique"),
    dimensionLength: Optional[float] = Form(None),
    dimensionWidth: Optional[float] = Form(None),
    dimensionHeight: Optional[float] = Form(None),
    dimensionNoConstraint: bool = Form(False),
    detailLevel: str = Form("standard"),
    files: List[UploadFile] = File(None)
):
    """
    Créer une nouvelle demande de projet de modélisation 3D
    """
    try:
        # Création de l'objet projet (sans ID, Supabase l'auto-génère)
        project_data = {
            "title": title,
            "descriptionClient": descriptionClient,
            "typeProject": typeProject,
            "goal": goal,
            "userId": userId,
            "nbElements": nbElements,
            "dimensionLength": dimensionLength,
            "dimensionWidth": dimensionWidth,
            "dimensionHeight": dimensionHeight,
            "dimensionNoConstraint": dimensionNoConstraint,
            "detailLevel": detailLevel,
            "status": "en attente",
            "createdAt": datetime.utcnow().date().isoformat()  # .date() pour obtenir seulement YYYY-MM-DD
        }
        
        # Sauvegarde en Supabase
        result = supabase.table('Projects').insert(project_data).execute()
        
        if result.data:
            projectId = result.data[0]['id']
            
            # Gestion des fichiers uploadés
            if files:
                for file in files:
                    try:
                        file_content = await file.read()
                        file_ext = file.filename.split('.')[-1]
                        # Nom de fichier unique : ID_PROJET/TIMESTAMP_NOM
                        file_path = f"{projectId}/{datetime.utcnow().timestamp()}_{file.filename}"
                        
                        # Upload vers Supabase Storage
                        supabase.storage.from_('project-images').upload(
                            file_path,
                            file_content,
                            {"content-type": file.content_type}
                        )
                        
                        # Récupération de l'URL publique
                        public_url = supabase.storage.from_('project-images').get_public_url(file_path)
                        
                        # Enregistrement dans la table ProjectsImages
                        supabase.table('ProjectsImages').insert({
                            "projectId": projectId,
                            "fileUrl": public_url,
                            "file_type": "image"
                        }).execute()
                        
                    except Exception as upload_error:
                        print(f"Erreur upload fichier {file.filename}: {str(upload_error)}")
                        # On continue pour les autres fichiers même si un échoue
            
            return {
                "message": "Demande de projet créée avec succès",
                "projectId": projectId,
                "status": "success"
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du projet: {str(e)}")

@router.get("/projects")
async def get_all_projects():
    """
    Récupérer toutes les demandes de projets
    """
    result = supabase.table('Projects').select('*').execute()
    return {"projects": result.data, "total": len(result.data)}

@router.get("/projects/{projectId}")
async def get_project(projectId: int):
    """
    Récupérer une demande de projet spécifique
    """
    result = supabase.table('Projects').select('*').eq('id', projectId).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return result.data[0]

@router.put("/projects/{projectId}/status")
async def update_project_status(projectId: int, status: str):
    """
    Mettre à jour le statut d'un projet
    """
    valid_statuses = ["en attente", "en cours", "terminé"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    update_data = {
        "status": status,
        "updatedAt": datetime.utcnow().date().isoformat() 
    }
    
    result = supabase.table('Projects').update(update_data).eq('id', projectId).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    return {"message": "Statut mis à jour", "project": result.data[0]}