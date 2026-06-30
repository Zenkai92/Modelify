from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from app.database import supabase, supabase_admin
from app.dependencies import get_current_user
from app.services.stripe_service import (
    get_or_create_customer,
    create_stripe_product_and_price,
    update_stripe_product_and_price,
    create_product_checkout_session,
)
from datetime import datetime, timezone
from typing import Optional, List
import logging
import os
import re

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_MODEL_SIZE = 50 * 1024 * 1024  # 50 MB

OVERVIEW_EXTENSIONS = {".stl", ".obj", ".3mf", ".gltf", ".glb"}
DOWNLOAD_EXTENSIONS = {".stl", ".obj", ".f3d", ".3mf", ".gltf", ".glb", ".ply", ".zip"}


def sanitize_filename(filename: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "", filename)


def upload_to_bucket(bucket: str, file: UploadFile, content: bytes) -> str:
    """Upload un fichier vers un bucket Supabase et retourne l'URL publique."""
    clean_filename = sanitize_filename(file.filename or "file")
    timestamp = datetime.now(timezone.utc).timestamp()
    file_path = f"{timestamp}_{clean_filename}"

    supabase_admin.storage.from_(bucket).upload(
        file_path,
        content,
        {"content-type": file.content_type or "application/octet-stream"},
    )

    return supabase_admin.storage.from_(bucket).get_public_url(file_path)


def check_admin(current_user) -> None:
    """Vérifie que l'utilisateur courant est admin. Lève une 403 sinon."""
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


@router.get("/products", status_code=status.HTTP_200_OK)
async def get_products():
    """Récupérer la liste de tous les produits (public)."""
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
    download_files: List[UploadFile] = File(...),
    current_user=Depends(get_current_user),
):
    """Créer un nouveau produit (Admin uniquement). Accepte plusieurs fichiers de téléchargement."""
    check_admin(current_user)

    # Validation fichier aperçu
    overview_ext = "." + (overview_model_file.filename or "").rsplit(".", 1)[-1].lower()
    if overview_ext not in OVERVIEW_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier aperçu : extension non autorisée. Acceptées : {', '.join(OVERVIEW_EXTENSIONS)}",
        )

    if not download_files:
        raise HTTPException(status_code=400, detail="Au moins un fichier de téléchargement est requis")

    # Validation et lecture des fichiers de téléchargement
    download_contents = []
    for dl_file in download_files:
        ext = "." + (dl_file.filename or "").rsplit(".", 1)[-1].lower()
        if ext not in DOWNLOAD_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Fichier {dl_file.filename} : extension non autorisée",
            )
        content = await dl_file.read()
        if len(content) > MAX_MODEL_SIZE:
            raise HTTPException(status_code=400, detail=f"Fichier {dl_file.filename} trop volumineux (max 50 Mo)")
        download_contents.append((dl_file, content, ext.lstrip(".")))

    overview_content = await overview_model_file.read()
    if len(overview_content) > MAX_MODEL_SIZE:
        raise HTTPException(status_code=400, detail="Fichier aperçu trop volumineux (max 50 Mo)")

    # Upload fichier aperçu
    try:
        overview_url = upload_to_bucket("overview-model-file", overview_model_file, overview_content)
    except Exception as e:
        logger.error(f"Erreur upload fichier aperçu: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload du fichier aperçu")

    # Upload fichiers de téléchargement
    uploaded_download_files = []
    for dl_file, content, extension in download_contents:
        try:
            url = upload_to_bucket("download-model-file", dl_file, content)
            uploaded_download_files.append({"url": url, "extension": extension})
        except Exception as e:
            logger.error(f"Erreur upload fichier {dl_file.filename}: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload de {dl_file.filename}")

    # Création du produit et du prix Stripe
    try:
        stripe_ids = create_stripe_product_and_price(title, description or "", price)
    except Exception as e:
        logger.error(f"Erreur création produit Stripe: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création du produit Stripe")

    # Insertion en base
    try:
        now = datetime.now(timezone.utc).isoformat()
        formats_list = [f.strip() for f in file_formats.split(",") if f.strip()]

        product_data = {
            "title": title,
            "description": description,
            "price": price,
            "category": category,
            "overview_model_file": overview_url,
            "file_formats": formats_list,
            "download_files": uploaded_download_files,
            "stripe_product_id": stripe_ids["stripe_product_id"],
            "stripe_price_id": stripe_ids["stripe_price_id"],
            "created_at": now,
            "updated_at": now,
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
    """Supprimer un produit (Admin uniquement)."""
    check_admin(current_user)
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
    download_files: Optional[List[UploadFile]] = File(None),
    current_user=Depends(get_current_user),
):
    """
    Modifier un produit (Admin uniquement).
    - Fichiers optionnels : si non fournis, les données existantes sont conservées.
    - Si de nouveaux fichiers de téléchargement sont fournis, ils remplacent tous les anciens.
    - Met à jour le produit Stripe et crée un nouveau Price si le prix a changé.
    """
    check_admin(current_user)

    try:
        existing = supabase.table("Products").select("*").eq("id", product_id).single().execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Produit introuvable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur récupération produit: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

    existing_product = existing.data
    price_changed = float(price) != float(existing_product.get("price", 0))

    update_data = {
        "title": title,
        "description": description,
        "price": price,
        "category": category,
        "file_formats": [f.strip() for f in file_formats.split(",") if f.strip()],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Mise à jour du produit Stripe (nom, description, prix si changé)
    if existing_product.get("stripe_product_id"):
        try:
            new_price_id = update_stripe_product_and_price(
                stripe_product_id=existing_product["stripe_product_id"],
                old_price_id=existing_product.get("stripe_price_id", ""),
                title=title,
                description=description or "",
                new_price_eur=price,
                price_changed=price_changed,
            )
            if price_changed:
                update_data["stripe_price_id"] = new_price_id
        except Exception as e:
            logger.warning(f"Erreur mise à jour Stripe (non bloquante): {e}")
    else:
        # Produit sans Stripe Product/Price (ex: créé avant l'intégration Stripe) : on le crée.
        try:
            stripe_ids = create_stripe_product_and_price(title, description or "", price)
            update_data["stripe_product_id"] = stripe_ids["stripe_product_id"]
            update_data["stripe_price_id"] = stripe_ids["stripe_price_id"]
        except Exception as e:
            logger.warning(f"Erreur création Stripe (non bloquante): {e}")

    # Fichier aperçu (optionnel)
    if overview_model_file and overview_model_file.filename:
        ext = "." + overview_model_file.filename.rsplit(".", 1)[-1].lower()
        if ext not in OVERVIEW_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Fichier aperçu : extension non autorisée")
        content = await overview_model_file.read()
        if len(content) > MAX_MODEL_SIZE:
            raise HTTPException(status_code=400, detail="Fichier aperçu trop volumineux (max 50 Mo)")
        try:
            update_data["overview_model_file"] = upload_to_bucket("overview-model-file", overview_model_file, content)
        except Exception as e:
            logger.error(f"Erreur upload aperçu: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de l'upload du fichier aperçu")

    # Fichiers de téléchargement (optionnels — remplacent tous les anciens si fournis)
    real_download_files = [f for f in (download_files or []) if f and f.filename]
    if real_download_files:
        uploaded_download_files = []
        for dl_file in real_download_files:
            ext = "." + dl_file.filename.rsplit(".", 1)[-1].lower()
            if ext not in DOWNLOAD_EXTENSIONS:
                raise HTTPException(status_code=400, detail=f"Fichier {dl_file.filename} : extension non autorisée")
            content = await dl_file.read()
            if len(content) > MAX_MODEL_SIZE:
                raise HTTPException(status_code=400, detail=f"Fichier {dl_file.filename} trop volumineux (max 50 Mo)")
            try:
                url = upload_to_bucket("download-model-file", dl_file, content)
                uploaded_download_files.append({"url": url, "extension": ext.lstrip(".")})
            except Exception as e:
                logger.error(f"Erreur upload {dl_file.filename}: {e}")
                raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload de {dl_file.filename}")
        update_data["download_files"] = uploaded_download_files

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


@router.get("/products/{product_id}/purchased", status_code=status.HTTP_200_OK)
async def check_purchased(product_id: str, current_user=Depends(get_current_user)):
    """Vérifie si l'utilisateur courant a acheté ce produit (via la table Orders)."""
    try:
        result = (
            supabase.table("Orders")
            .select("id")
            .eq("client_id", current_user.id)
            .eq("product_id", product_id)
            .eq("status", "completed")
            .execute()
        )
        return {"purchased": bool(result.data)}
    except Exception as e:
        logger.error(f"Erreur vérification achat produit: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.post("/products/{product_id}/buy", status_code=status.HTTP_200_OK)
async def buy_product(product_id: str, current_user=Depends(get_current_user)):
    """
    Initier le paiement Stripe pour l'achat d'un produit.
    Utilise le stripe_price_id stocké sur le produit.
    Retourne l'URL de redirection vers Stripe Checkout.
    """
    try:
        product_query = supabase.table("Products").select("*").eq("id", product_id).single().execute()
        if not product_query.data:
            raise HTTPException(status_code=404, detail="Produit introuvable")
        product = product_query.data

        if not product.get("stripe_price_id"):
            raise HTTPException(status_code=400, detail="Ce produit n'est pas encore disponible à l'achat")

        # Vérifier si déjà acheté
        already = (
            supabase.table("Orders")
            .select("id")
            .eq("client_id", current_user.id)
            .eq("product_id", product_id)
            .eq("status", "completed")
            .execute()
        )
        if already.data:
            raise HTTPException(status_code=400, detail="Vous avez déjà acheté ce produit")

        # Récupérer les infos utilisateur
        user_data = (
            supabase.table("Users").select("*").eq("id", current_user.id).single().execute()
        )
        if not user_data.data:
            raise HTTPException(status_code=404, detail="Utilisateur introuvable")

        user = user_data.data
        stripe_customer_id = user.get("stripe_customer_id")

        if not stripe_customer_id:
            client_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or user.get("email")
            stripe_customer_id = get_or_create_customer(user["email"], client_name, current_user.id)
            supabase.table("Users").update({"stripe_customer_id": stripe_customer_id}).eq("id", current_user.id).execute()

        base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

        checkout_url = create_product_checkout_session(
            customer_id=stripe_customer_id,
            price_id=product["stripe_price_id"],
            product_id=product_id,
            user_id=current_user.id,
            success_url=f"{base_url}/payment/success?product_id={product_id}&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/payment/cancel",
        )

        return {"checkout_url": checkout_url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'initiation du paiement produit: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
