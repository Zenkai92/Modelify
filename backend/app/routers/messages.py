from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from app.database import supabase_admin
from app.dependencies import get_current_user
from app.routers.projects import (
    sanitize_filename,
    validate_mime_type,
    MAX_FILE_SIZE,
)
from typing import Optional
from datetime import datetime, timezone
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Pièces jointes de la messagerie : images uniquement (avancement du projet)
ALLOWED_MESSAGE_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]

MAX_MESSAGE_LENGTH = 2000


def _check_project_access(projectId: str, current_user) -> tuple:
    """
    Vérifie que le projet existe et que l'utilisateur courant y a accès
    (propriétaire ou admin). Retourne (project, is_admin).
    """
    result = supabase_admin.table("Projects").select("*").eq("id", projectId).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    project = result.data[0]

    is_admin = False
    try:
        user_role_data = (
            supabase_admin.table("Users")
            .select("role")
            .eq("id", current_user.id)
            .single()
            .execute()
        )
        is_admin = bool(user_role_data.data) and user_role_data.data.get("role") == "admin"
    except Exception as e:
        logger.warning(f"Vérification du rôle impossible pour {current_user.id}: {e}")

    if project["userId"] != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce projet")

    return project, is_admin


def _sign_file_url(file_path: Optional[str]) -> Optional[str]:
    """Génère une URL signée (1h) pour un chemin relatif du bucket project-images."""
    if not file_path:
        return None
    try:
        signed = supabase_admin.storage.from_("project-images").create_signed_url(
            file_path, 3600
        )
        return signed.get("signedURL", file_path)
    except Exception as e:
        logger.warning(f"URL signée impossible pour {file_path}: {e}")
        return file_path


def _serialize_message(msg: dict) -> dict:
    """
    Prépare un message pour le frontend : nom de l'expéditeur aplati
    (depuis l'embed Users) et URL signée pour la pièce jointe.
    """
    msg = dict(msg)
    sender = msg.pop("Users", None) or {}
    first = sender.get("firstName") or ""
    last = sender.get("lastName") or ""
    msg["senderName"] = f"{first} {last}".strip() or "Utilisateur"
    msg["fileUrl"] = _sign_file_url(msg.get("fileUrl"))
    return msg


@router.get("/projects/{projectId}/messages")
async def get_project_messages(projectId: str, current_user=Depends(get_current_user)):
    """
    Récupérer les messages de la discussion d'un projet (propriétaire ou admin),
    triés du plus ancien au plus récent.
    """
    _check_project_access(projectId, current_user)

    result = (
        supabase_admin.table("ProjectsMessages")
        .select("*, Users(firstName, lastName)")
        .eq("projectId", projectId)
        .order("created_at", desc=False)
        .execute()
    )

    messages = [_serialize_message(m) for m in (result.data or [])]
    return {"messages": messages}


@router.post("/projects/{projectId}/messages")
async def send_project_message(
    projectId: str,
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
):
    """
    Envoyer un message dans la discussion d'un projet (propriétaire ou admin),
    avec éventuellement une image jointe (avancement du projet).
    """
    _, is_admin = _check_project_access(projectId, current_user)

    content = (content or "").strip()
    if not content and not file:
        raise HTTPException(
            status_code=400, detail="Le message doit contenir du texte ou une image"
        )
    if len(content) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Message trop long (max {MAX_MESSAGE_LENGTH} caractères)",
        )

    file_path = None
    if file:
        file_content = await file.read()

        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, detail="Image trop volumineuse (max 10MB)"
            )

        mime_type = validate_mime_type(file_content, file.content_type)
        if mime_type not in ALLOWED_MESSAGE_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Seules les images (JPEG, PNG, WebP, GIF) sont autorisées",
            )

        clean_filename = sanitize_filename(file.filename or "image")
        file_path = f"messages/{projectId}/{datetime.now(timezone.utc).timestamp()}_{clean_filename}"

        try:
            supabase_admin.storage.from_("project-images").upload(
                file_path, file_content, {"content-type": mime_type}
            )
        except Exception as e:
            logger.error(f"Erreur upload image message: {e}")
            raise HTTPException(
                status_code=500, detail="Erreur lors de l'upload de l'image"
            )

    message_data = {
        "projectId": projectId,
        "senderId": current_user.id,
        "sender_role": "admin" if is_admin else "client",
        "content": content or None,
        "fileUrl": file_path,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = supabase_admin.table("ProjectsMessages").insert(message_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi du message")

    created = result.data[0]

    # Nom de l'expéditeur pour l'affichage immédiat côté frontend
    try:
        sender_data = (
            supabase_admin.table("Users")
            .select("firstName, lastName")
            .eq("id", current_user.id)
            .single()
            .execute()
        )
        created["Users"] = sender_data.data
    except Exception:
        created["Users"] = None

    return {"message": "Message envoyé", "data": _serialize_message(created)}
