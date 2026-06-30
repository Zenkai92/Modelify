from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.database import supabase, supabase_admin
from app.dependencies import get_current_user
from datetime import datetime, timezone
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class LegalDocumentUpdate(BaseModel):
    title: str
    content: str


@router.get("/legal", status_code=status.HTTP_200_OK)
async def get_all_legal_documents():
    try:
        response = (
            supabase.table("legal_documents")
            .select("*")
            .order("slug")
            .execute()
        )
        return response.data or []
    except Exception as e:
        logger.error(f"Erreur récupération documents légaux: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.put("/legal/{slug}", status_code=status.HTTP_200_OK)
async def update_legal_document(
    slug: str,
    body: LegalDocumentUpdate,
    current_user=Depends(get_current_user),
):
    try:
        admin_check = (
            supabase_admin.table("Users")
            .select("role")
            .eq("id", current_user.id)
            .single()
            .execute()
        )
        if not admin_check.data or admin_check.data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Accès administrateur requis")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur vérification rôle admin: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

    try:
        existing = (
            supabase_admin.table("legal_documents")
            .select("version")
            .eq("slug", slug)
            .single()
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Document introuvable")

        response = (
            supabase_admin.table("legal_documents")
            .update({
                "title": body.title,
                "content": body.content,
                "version": existing.data["version"] + 1,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("slug", slug)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur mise à jour document légal '{slug}': {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")
