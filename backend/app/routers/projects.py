from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.schemas import ProjectRequestCreate, ProjectRequestResponse
from app.database import supabase
from typing import Optional
import json
from datetime import datetime

router = APIRouter()

@router.post("/projects", response_model=dict)
async def create_project_request(
    title: str = Form(...),
    descriptionClient: str = Form(...),
    typeProject: str = Form(..., alias="typeProject"),
    goal: str = Form(...),
    files: Optional[UploadFile] = File(None)
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
            "status": "en attente",
            "createdAt": datetime.utcnow().date().isoformat()  # .date() pour obtenir seulement YYYY-MM-DD
        }
        
        # Gestion du fichier uploadé
        if files:
            # Ici vous pourriez sauvegarder le fichier
            project_data["filename"] = files.filename
            project_data["file_size"] = files.size
        
        # Sauvegarde en Supabase
        result = supabase.table('Projects').insert(project_data).execute()
        
        if result.data:
            projectId = result.data[0]['id']
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