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


def sanitize_filename(filename: str) -> str:
    """
    Nettoie le nom de fichier pour éviter les problèmes d'encodage et de sécurité.
    Ne garde que les caractères alphanumériques, points, tirets et underscores.
    """
    return re.sub(r'[^a-zA-Z0-9._-]', '', filename)

def validate_mime_type(content: bytes, declared_type: str) -> str:
    """
    Valide le type MIME du fichier en utilisant python-magic si disponible,
    sinon se fie au type déclaré.
    """
    mime_type = declared_type
    if magic:
        try:
            mime_type = magic.from_buffer(content, mime=True)
        except Exception as e:
            logger.warning(f"Erreur lors de la détection magic du type MIME: {e}")
    return mime_type

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
        project_data = {
            "title": title,
            "descriptionClient": descriptionClient,
            "use": use,
            "userId": current_user.id,
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
        
        result = supabase.table('Projects').insert(project_data).execute()
        
        if result.data:
            projectId = result.data[0]['id']
            
            if files:
                for file in files:
                    try:
                        file_content = await file.read()
                        
                        mime_type = validate_mime_type(file_content, file.content_type)
                        
                        if mime_type not in ALLOWED_MIME_TYPES:
                            logger.warning(f"Fichier rejeté (type non autorisé): {file.filename} ({mime_type})")
                            continue

                        clean_filename = sanitize_filename(file.filename)
                        
                        file_path = f"{projectId}/{datetime.now(timezone.utc).timestamp()}_{clean_filename}"

                        upload_response = supabase.storage.from_('project-images').upload(
                            file_path,
                            file_content,
                            {"content-type": mime_type}
                        )
                        
                        public_url = supabase.storage.from_('project-images').get_public_url(file_path)
                        
                        file_type = "image" if mime_type.startswith("image/") else "document"

                        supabase.table('ProjectsImages').insert({
                            "projectId": projectId,
                            "fileUrl": public_url,
                            "file_type": file_type
                        }).execute()
                        
                    except Exception as upload_error:
                        logger.error(f"ERROR processing file {file.filename}: {str(upload_error)}")
            
            return {
                "message": "Demande de projet créée avec succès",
                "projectId": projectId,
                "status": "success"
            }
        
    except Exception as e:
        logger.error(f"Erreur lors de la création du projet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du projet: {str(e)}")

@router.get("/projects")
async def get_all_projects(userId: Optional[str] = None, current_user = Depends(get_current_user)):
    """
    Récupérer toutes les demandes de projets, optionnellement filtrées par userId
    """
    user_role_data = supabase.table("Users").select("role").eq("id", current_user.id).single().execute()
    is_admin = user_role_data.data and user_role_data.data.get('role') == 'admin'

    query = supabase.table('Projects').select('*')
    
    if is_admin:
        if userId:
            query = query.eq('userId', userId)
    else:
        query = query.eq('userId', current_user.id)
    
    result = query.execute()
    return {"projects": result.data, "total": len(result.data)}

@router.get("/projects/{projectId}")
async def get_project(projectId: str):
    """
    Récupérer une demande de projet spécifique avec ses images
    """
    result = supabase.table('Projects').select('*').eq('id', projectId).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    project = result.data[0]
    
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

@router.put("/projects/{projectId}")
async def update_project(
    projectId: str,
    title: Optional[str] = Form(None),
    descriptionClient: Optional[str] = Form(None),
    use: Optional[str] = Form(None),
    format: Optional[str] = Form(None),
    nbElements: Optional[str] = Form(None),
    dimensionLength: Optional[float] = Form(None),
    dimensionWidth: Optional[float] = Form(None),
    dimensionHeight: Optional[float] = Form(None),
    dimensionNoConstraint: Optional[bool] = Form(None),
    detailLevel: Optional[str] = Form(None),
    deadlineType: Optional[str] = Form(None),
    deadlineDate: Optional[str] = Form(None),
    budget: Optional[str] = Form(None),
    current_user = Depends(get_current_user)
):
    """
    Mettre à jour un projet existant (uniquement si statut 'en attente')
    """
    try:
        project_query = supabase.table('Projects').select('*').eq('id', projectId).execute()
        if not project_query.data:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        project = project_query.data[0]
        
        if project['userId'] != current_user.id:
            raise HTTPException(status_code=403, detail="Non autorisé")

        if project['status'] != 'en attente':
            raise HTTPException(status_code=400, detail="Le projet ne peut être modifié que s'il est en attente")

        update_data = {
            "updatedAt": datetime.now(timezone.utc).date().isoformat()
        }
        
        if title is not None: update_data['title'] = title
        if descriptionClient is not None: update_data['descriptionClient'] = descriptionClient
        if use is not None: update_data['use'] = use
        if format is not None: update_data['format'] = format
        if nbElements is not None: update_data['nbElements'] = nbElements
        if dimensionLength is not None: update_data['dimensionLength'] = dimensionLength
        if dimensionWidth is not None: update_data['dimensionWidth'] = dimensionWidth
        if dimensionHeight is not None: update_data['dimensionHeight'] = dimensionHeight
        if dimensionNoConstraint is not None: update_data['dimensionNoConstraint'] = dimensionNoConstraint
        if detailLevel is not None: update_data['detailLevel'] = detailLevel
        if deadlineType is not None: update_data['deadlineType'] = deadlineType
        if deadlineDate is not None: update_data['deadlineDate'] = deadlineDate
        if budget is not None: update_data['budget'] = budget

        result = supabase.table('Projects').update(update_data).eq('id', projectId).execute()
        
        return {
            "message": "Projet mis à jour avec succès",
            "project": result.data[0],
            "status": "success"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du projet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour du projet: {str(e)}")
