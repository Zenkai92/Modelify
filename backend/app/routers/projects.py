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
    # DEBUG LOGGING TO FILE
    import os
    log_path = "backend_debug.log"
    try:
        with open(log_path, "a") as f:
            f.write(f"\n--- NEW REQUEST {datetime.utcnow()} ---\n")
            f.write(f"Title: {title}\n")
            f.write(f"Files received: {len(files) if files else 'None'}\n")
            if files:
                for file in files:
                    f.write(f"File: {file.filename}, Content-Type: {file.content_type}\n")
    except Exception as e:
        print(f"Failed to write log: {e}")

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
                with open(log_path, "a") as f:
                    f.write(f"Project created with ID: {projectId}. Processing {len(files)} files...\n")

                for file in files:
                    try:
                        file_content = await file.read()
                        # Sanitize filename to avoid encoding issues
                        import re
                        clean_filename = re.sub(r'[^a-zA-Z0-9._-]', '', file.filename)
                        
                        # Nom de fichier unique : ID_PROJET/TIMESTAMP_NOM
                        file_path = f"{projectId}/{datetime.utcnow().timestamp()}_{clean_filename}"
                        
                        with open(log_path, "a") as f:
                            f.write(f"Uploading file to path: {file_path}\n")

                        # Upload vers Supabase Storage
                        upload_response = supabase.storage.from_('project-images').upload(
                            file_path,
                            file_content,
                            {"content-type": file.content_type}
                        )
                        
                        with open(log_path, "a") as f:
                            f.write(f"Upload response: {upload_response}\n")

                        # Récupération de l'URL publique
                        public_url = supabase.storage.from_('project-images').get_public_url(file_path)
                        
                        with open(log_path, "a") as f:
                            f.write(f"Public URL: {public_url}\n")

                        # Détermination du type de fichier
                        content_type = file.content_type
                        file_type = "image" if content_type.startswith("image/") else "document"

                        # Enregistrement dans la table ProjectsImages
                        insert_response = supabase.table('ProjectsImages').insert({
                            "projectId": projectId,
                            "fileUrl": public_url,
                            "file_type": file_type
                        }).execute()
                        
                        with open(log_path, "a") as f:
                            f.write(f"DB Insert response: {insert_response}\n")
                        
                    except Exception as upload_error:
                        with open(log_path, "a") as f:
                            f.write(f"ERROR processing file {file.filename}: {str(upload_error)}\n")
                            import traceback
                            f.write(traceback.format_exc() + "\n")
                        # On continue pour les autres fichiers même si un échoue
            
            return {
                "message": "Demande de projet créée avec succès",
                "projectId": projectId,
                "status": "success"
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du projet: {str(e)}")

@router.get("/projects")
async def get_all_projects(userId: Optional[str] = None):
    """
    Récupérer toutes les demandes de projets, optionnellement filtrées par userId
    """
    query = supabase.table('Projects').select('*')
    if userId:
        query = query.eq('userId', userId)
    
    result = query.execute()
    return {"projects": result.data, "total": len(result.data)}

@router.get("/projects/{projectId}")
async def get_project(projectId: int):
    """
    Récupérer une demande de projet spécifique avec ses images
    """
    # Récupération du projet
    result = supabase.table('Projects').select('*').eq('id', projectId).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    project = result.data[0]
    
    # Récupération des images associées
    images_result = supabase.table('ProjectsImages').select('*').eq('projectId', projectId).execute()
    project['images'] = images_result.data if images_result.data else []
    
    return project

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