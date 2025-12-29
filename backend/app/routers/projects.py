from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from app.database import supabase
from app.dependencies import get_current_user
from typing import Optional, List
from datetime import datetime, timezone
import os
import re
import logging

# Tentative d'import de python-magic pour la validation des fichiers
try:
    import magic
except ImportError:
    magic = None

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = [
    "image/jpeg", "image/png", "image/webp", 
    "application/pdf", 
    "application/x-zip-compressed", "application/zip"
]

@router.post("/projects", response_model=dict)
async def create_project_request(
    title: str = Form(...),
    descriptionClient: str = Form(...),
    use: str = Form(...),
    format: Optional[str] = Form(None),
    nbElements: str = Form("unique"),
    dimensionLength: Optional[float] = Form(None),
    dimensionWidth: Optional[float] = Form(None),
    dimensionHeight: Optional[float] = Form(None),
    dimensionNoConstraint: bool = Form(False),
    detailLevel: str = Form("standard"),
    deadlineType: Optional[str] = Form(None),
    deadlineDate: Optional[str] = Form(None),
    budget: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    current_user = Depends(get_current_user)
):
    """
    Créer une nouvelle demande de projet de modélisation 3D
    """
    try:
        # Création de l'objet projet (sans ID, Supabase l'auto-génère)
        project_data = {
            "title": title,
            "descriptionClient": descriptionClient,
            "use": use,
            "userId": current_user.id, # Utilisation de l'ID de l'utilisateur authentifié
            "format": format,
            "nbElements": nbElements,
            "dimensionLength": dimensionLength,
            "dimensionWidth": dimensionWidth,
            "dimensionHeight": dimensionHeight,
            "dimensionNoConstraint": dimensionNoConstraint,
            "detailLevel": detailLevel,
            "deadlineType": deadlineType,
            "deadlineDate": deadlineDate,
            "budget": budget,
            "status": "en attente",
            "created_at": datetime.now(timezone.utc).date().isoformat()
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
                        
                        # Validation du type de fichier
                        mime_type = file.content_type
                        if magic:
                            mime_type = magic.from_buffer(file_content, mime=True)
                        
                        if mime_type not in ALLOWED_MIME_TYPES:
                            logger.warning(f"Fichier rejeté (type non autorisé): {file.filename} ({mime_type})")
                            continue # On ignore ce fichier mais on continue

                        # Sanitize filename to avoid encoding issues
                        clean_filename = re.sub(r'[^a-zA-Z0-9._-]', '', file.filename)
                        
                        # Nom de fichier unique : ID_PROJET/TIMESTAMP_NOM
                        file_path = f"{projectId}/{datetime.now(timezone.utc).timestamp()}_{clean_filename}"
                        
                        # Upload vers Supabase Storage
                        upload_response = supabase.storage.from_('project-images').upload(
                            file_path,
                            file_content,
                            {"content-type": mime_type}
                        )
                        
                        # Récupération de l'URL publique
                        public_url = supabase.storage.from_('project-images').get_public_url(file_path)
                        
                        # Détermination du type de fichier pour la DB
                        file_type = "image" if mime_type.startswith("image/") else "document"

                        # Enregistrement dans la table ProjectsImages
                        supabase.table('ProjectsImages').insert({
                            "projectId": projectId,
                            "fileUrl": public_url,
                            "file_type": file_type
                        }).execute()
                        
                    except Exception as upload_error:
                        logger.error(f"ERROR processing file {file.filename}: {str(upload_error)}")
                        # On continue pour les autres fichiers même si un échoue
            
            return {
                "message": "Demande de projet créée avec succès",
                "projectId": projectId,
                "status": "success"
            }
        
    except Exception as e:
        logger.error(f"Erreur lors de la création du projet: {str(e)}")
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
async def get_project(projectId: str):
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
async def update_project_status(projectId: str, status: str):
    """
    Mettre à jour le statut d'un projet
    """
    valid_statuses = ["en attente", "en cours", "terminé"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    update_data = {
        "status": status,
        "updatedAt": datetime.now(timezone.utc).date().isoformat() 
    }
    
    result = supabase.table('Projects').update(update_data).eq('id', projectId).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    return {"message": "Statut mis à jour", "project": result.data[0]}