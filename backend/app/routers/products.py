from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from app.database import supabase, supabase_admin
from app.dependencies import get_current_user
from datetime import datetime, timezone
from typing import Optional
import logging
import re

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_MODEL_SIZE = 50 * 1024 * 1024  # 50 MB

OVERVIEW_EXTENSIONS = {".stl", ".obj", ".3mf", ".gltf", ".glb"}
DOWNLOAD_EXTENSIONS = {".stl", ".obj", ".f3d", ".3mf", ".gltf", ".glb", ".ply", ".zip"}


def sanitize_filename(filename: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "", filename)


def upload_to_bucket(bucket: str, file: UploadFile, content: bytes) -> str:
    """Upload un fichier vers un bucket Supabase et retourne l'URL publique.
    Utilise le client admin (service role) pour bypasser le RLS sur le storage.
    """
    clean_filename = sanitize_filename(file.filename or "file")
    timestamp = datetime.now(timezone.utc).timestamp()
    file_path = f"{timestamp}_{clean_filename}"

    supabase_admin.storage.from_(bucket).upload(
        file_path,
        content,
        {"content-type": file.content_type or "application/octet-stream"},
    )

    return supabase_admin.storage.from_(bucket).get_public_url(file_path)


@router.get("/products", status_code=status.HTTP_200_OK)
async def get_products():
    """
    Récupérer la liste de tous les produits (public).
    """
    try:
        response = (
            supabase.table("Products")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des produits: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(
    title: str = Form(...),
    description: Optional[str] = Form(""),
    price: float = Form(...),
    category: str = Form(...),
    file_formats: str = Form(...),
    overview_model_file: UploadFile = File(...),
    download_model_file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """
    Créer un nouveau produit (Admin uniquement).
    """
    # Vérification du rôle Admin en base de données
    try:
        admin_check = (
            supabase.table("Users")
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
        logger.error(f"Erreur lors de la vérification du rôle admin: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

    # Validation des extensions
    for upload_file, label, allowed in [
        (overview_model_file, "aperçu", OVERVIEW_EXTENSIONS),
        (download_model_file, "téléchargement", DOWNLOAD_EXTENSIONS),
    ]:
        filename = upload_file.filename or ""
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Fichier {label} : extension non autorisée. Extensions acceptées : {', '.join(allowed)}",
            )

    # Lecture et validation des tailles
    overview_content = await overview_model_file.read()
    download_content = await download_model_file.read()

    for content, label in [(overview_content, "aperçu"), (download_content, "téléchargement")]:
        if len(content) > MAX_MODEL_SIZE:
            raise HTTPException(status_code=400, detail=f"Fichier {label} trop volumineux (max 50 Mo)")

    # Upload vers les buckets
    try:
        overview_url = upload_to_bucket("overview-model-file", overview_model_file, overview_content)
    except Exception as e:
        logger.error(f"Erreur upload fichier aperçu: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload du fichier aperçu")

    try:
        download_url = upload_to_bucket("download-model-file", download_model_file, download_content)
    except Exception as e:
        logger.error(f"Erreur upload fichier téléchargement: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload du fichier de téléchargement")

    # Insertion en base
    try:
        now = datetime.now(timezone.utc).isoformat()
        # file_formats est une colonne array PostgreSQL : on découpe la chaîne
        formats_list = [f.strip() for f in file_formats.split(",") if f.strip()]

        product_data = {
            "title": title,
            "description": description,
            "price": price,
            "category": category,
            "overview_model_file": overview_url,
            "file_formats": formats_list,
            "download_model_file": download_url,
            "created_at": now,
        }

        response = supabase.table("Products").insert(product_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Erreur lors de la création du produit")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la création du produit: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: str, current_user=Depends(get_current_user)):
    """
    Supprimer un produit (Admin uniquement).
    """
    try:
        admin_check = (
            supabase.table("Users")
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
        result = supabase.table("Products").delete().eq("id", product_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Produit introuvable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur suppression produit: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.put("/products/{product_id}", status_code=status.HTTP_200_OK)
async def update_product(
    product_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(""),
    price: float = Form(...),
    category: str = Form(...),
    file_formats: str = Form(...),
    overview_model_file: Optional[UploadFile] = File(None),
    download_model_file: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
):
    """
    Modifier un produit existant (Admin uniquement).
    Les fichiers sont optionnels : si non fournis, les URLs existantes sont conservées.
    """
    # Vérification du rôle Admin
    try:
        admin_check = (
            supabase.table("Users")
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

    # Récupération du produit existant
    try:
        existing = supabase.table("Products").select("*").eq("id", product_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Produit introuvable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur récupération produit: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

    update_data = {
        "title": title,
        "description": description,
        "price": price,
        "category": category,
        "file_formats": [f.strip() for f in file_formats.split(",") if f.strip()],
    }

    # Fichier aperçu (optionnel)
    if overview_model_file and overview_model_file.filename:
        ext = "." + overview_model_file.filename.rsplit(".", 1)[-1].lower()
        if ext not in OVERVIEW_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Fichier aperçu : extension non autorisée")
        content = await overview_model_file.read()
        if len(content) > MAX_MODEL_SIZE:
            raise HTTPException(status_code=400, detail="Fichier aperçu trop volumineux (max 50 Mo)")
        try:
            update_data["overview_model_file"] = upload_to_bucket("overview-model-file", overview_model_file, content)
        except Exception as e:
            logger.error(f"Erreur upload aperçu: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de l'upload du fichier aperçu")

    # Fichier téléchargement (optionnel)
    if download_model_file and download_model_file.filename:
        ext = "." + download_model_file.filename.rsplit(".", 1)[-1].lower()
        if ext not in DOWNLOAD_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Fichier téléchargement : extension non autorisée")
        content = await download_model_file.read()
        if len(content) > MAX_MODEL_SIZE:
            raise HTTPException(status_code=400, detail="Fichier téléchargement trop volumineux (max 50 Mo)")
        try:
            update_data["download_model_file"] = upload_to_bucket("download-model-file", download_model_file, content)
        except Exception as e:
            logger.error(f"Erreur upload téléchargement: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de l'upload du fichier de téléchargement")

    try:
        response = supabase.table("Products").update(update_data).eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour du produit")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur mise à jour produit: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")
