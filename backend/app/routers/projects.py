from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from app.database import supabase
from app.dependencies import get_current_user
from app.schemas.projects import ProjectQuote
from app.services.stripe_service import (
    get_or_create_customer,
    create_quote,
    create_checkout_session,
)
import stripe
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

# Configuration des limites de fichiers
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_FILES_PER_PROJECT = 10

ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/x-zip-compressed",
    "application/zip",
]


def sanitize_filename(filename: str) -> str:
    """
    Nettoie le nom de fichier pour éviter les problèmes d'encodage et de sécurité.
    Ne garde que les caractères alphanumériques, points, tirets et underscores.
    """
    return re.sub(r"[^a-zA-Z0-9._-]", "", filename)


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


@router.get("/projects/count")
async def get_project_count(current_user=Depends(get_current_user)):
    """
    Récupérer le nombre de projets actifs (non 'terminé') pour l'utilisateur courant
    """
    result = (
        supabase.table("Projects")
        .select("id", count="exact")
        .eq("userId", current_user.id)
        .neq("status", "terminé")
        .execute()
    )

    return {"active_projects": result.count or 0, "limit": 2}


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
    current_user=Depends(get_current_user),
):
    """
    Créer une nouvelle demande de projet de modélisation 3D
    """
    try:
        # Vérification de la limite de projets actifs (non "terminé")
        active_projects = (
            supabase.table("Projects")
            .select("id", count="exact")
            .eq("userId", current_user.id)
            .neq("status", "terminé")
            .execute()
        )

        if active_projects.count and active_projects.count >= 2:
            raise HTTPException(
                status_code=400,
                detail="Limite de projets atteinte. Vous ne pouvez pas avoir plus de 2 projets en cours simultanément (hors projets terminés).",
            )

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
            "created_at": datetime.now(timezone.utc).date().isoformat(),
        }

        result = supabase.table("Projects").insert(project_data).execute()

        if result.data:
            projectId = result.data[0]["id"]
            rejected_files = []

            if files:
                # Vérification du nombre maximum de fichiers
                if len(files) > MAX_FILES_PER_PROJECT:
                    logger.warning(f"Trop de fichiers ({len(files)}), limite: {MAX_FILES_PER_PROJECT}")
                    files = files[:MAX_FILES_PER_PROJECT]

                for file in files:
                    try:
                        file_content = await file.read()

                        # Vérification de la taille du fichier
                        if len(file_content) > MAX_FILE_SIZE:
                            logger.warning(
                                f"Fichier rejeté (trop volumineux): {file.filename} ({len(file_content)} bytes)"
                            )
                            rejected_files.append({"filename": file.filename, "reason": "Fichier trop volumineux (max 10MB)"})
                            continue

                        mime_type = validate_mime_type(file_content, file.content_type)

                        if mime_type not in ALLOWED_MIME_TYPES:
                            logger.warning(
                                f"Fichier rejeté (type non autorisé): {file.filename} ({mime_type})"
                            )
                            rejected_files.append({"filename": file.filename, "reason": "Type de fichier non autorisé"})
                            continue

                        clean_filename = sanitize_filename(file.filename)

                        file_path = f"{projectId}/{datetime.now(timezone.utc).timestamp()}_{clean_filename}"

                        upload_response = supabase.storage.from_(
                            "project-images"
                        ).upload(file_path, file_content, {"content-type": mime_type})

                        public_url = supabase.storage.from_(
                            "project-images"
                        ).get_public_url(file_path)

                        file_type = (
                            "image" if mime_type.startswith("image/") else "document"
                        )

                        supabase.table("ProjectsImages").insert(
                            {
                                "projectId": projectId,
                                "fileUrl": public_url,
                                "file_type": file_type,
                            }
                        ).execute()

                    except Exception as upload_error:
                        logger.error(
                            f"ERROR processing file {file.filename}: {str(upload_error)}"
                        )
                        rejected_files.append({"filename": file.filename, "reason": "Erreur lors de l'upload"})

            response_data = {
                "message": "Demande de projet créée avec succès",
                "projectId": projectId,
                "status": "success",
            }
            
            # Informer l'utilisateur des fichiers rejetés
            if rejected_files:
                response_data["rejected_files"] = rejected_files
                response_data["warning"] = f"{len(rejected_files)} fichier(s) n'ont pas pu être uploadés"
            
            return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la création du projet: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Erreur lors de la création du projet"
        )


@router.get("/projects")
async def get_all_projects(
    userId: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user=Depends(get_current_user)
):
    """
    Récupérer toutes les demandes de projets, optionnellement filtrées par userId.
    Supporte la pagination avec les paramètres page et limit.
    """
    # Validation des paramètres de pagination
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 20
    
    offset = (page - 1) * limit
    
    user_role_data = (
        supabase.table("Users")
        .select("role")
        .eq("id", current_user.id)
        .single()
        .execute()
    )
    is_admin = user_role_data.data and user_role_data.data.get("role") == "admin"

    # Requête pour le count total
    if is_admin:
        count_query = supabase.table("Projects").select("id", count="exact")
        if userId:
            count_query = count_query.eq("userId", userId)
    else:
        count_query = supabase.table("Projects").select("id", count="exact").eq("userId", current_user.id)
    
    count_result = count_query.execute()
    total_count = count_result.count or 0

    # Requête pour les données paginées
    if is_admin:
        query = supabase.table("Projects").select(
            "*, Users(firstName, lastName, companyName, role)"
        )
        if userId:
            query = query.eq("userId", userId)
    else:
        query = supabase.table("Projects").select("*").eq("userId", current_user.id)

    # Appliquer pagination et tri
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    return {
        "projects": result.data,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit
    }


@router.get("/projects/{projectId}")
async def get_project(projectId: str, current_user=Depends(get_current_user)):
    """
    Récupérer une demande de projet spécifique avec ses images
    Sécurisé: Admin ou propriétaire seulement
    """
    # 1. Récupérer le projet
    result = supabase.table("Projects").select("*").eq("id", projectId).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    project = result.data[0]

    # 2. Vérification des droits (Admin ou Owner)
    if project["userId"] != current_user.id:
        # Check if admin
        user_role_data = (
            supabase.table("Users")
            .select("role")
            .eq("id", current_user.id)
            .single()
            .execute()
        )
        if not user_role_data.data or user_role_data.data.get("role") != "admin":
            raise HTTPException(
                status_code=403, detail="Accès non autorisé à ce projet"
            )

    # 3. Récupérer les images
    images_result = (
        supabase.table("ProjectsImages")
        .select("*")
        .eq("projectId", projectId)
        .execute()
    )
    project["images"] = images_result.data if images_result.data else []

    return project


@router.put("/projects/{projectId}/status")
async def update_project_status(
    projectId: str, status: str, current_user=Depends(get_current_user)
):
    """
    Mettre à jour le statut d'un projet (Admin uniquement)
    """
    # 1. Vérification Admin
    try:
        user_role_data = (
            supabase.table("Users")
            .select("role")
            .eq("id", current_user.id)
            .single()
            .execute()
        )
        if not user_role_data.data or user_role_data.data.get("role") != "admin":
            raise HTTPException(
                status_code=403, detail="Accès réservé aux administrateurs"
            )
    except Exception:
        raise HTTPException(status_code=403, detail="Erreur de vérification des droits")

    valid_statuses = [
        "en attente",
        "devis_envoyé",
        "paiement_attente",
        "payé",
        "en cours",
        "terminé",
    ]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Statut invalide")

    update_data = {
        "status": status,
        "updatedAt": datetime.now(timezone.utc).date().isoformat(),
    }

    result = (
        supabase.table("Projects").update(update_data).eq("id", projectId).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    return {"message": "Statut mis à jour", "project": result.data[0]}


@router.post("/projects/{projectId}/quote")
async def create_project_quote(
    projectId: str, quote: ProjectQuote, current_user=Depends(get_current_user)
):
    """
    Définir un prix pour le projet (Admin uniquement), créer un devis Stripe
    et passer en statut 'devis_envoyé'.
    """
    try:
        # 1. Vérification Admin
        user_role_data = (
            supabase.table("Users")
            .select("role")
            .eq("id", current_user.id)
            .single()
            .execute()
        )
        if not user_role_data.data or user_role_data.data.get("role") != "admin":
            raise HTTPException(
                status_code=403, detail="Accès réservé aux administrateurs"
            )

        # 2. Récuperer les infos du projet et du client
        project_data = (
            supabase.table("Projects")
            .select("*")
            .eq("id", projectId)
            .single()
            .execute()
        )
        if not project_data.data:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        project = project_data.data

        client_id = project["userId"]
        client_data = (
            supabase.table("Users").select("*").eq("id", client_id).single().execute()
        )
        if not client_data.data:
            raise HTTPException(status_code=404, detail="Client introuvable")
        client = client_data.data

        # 3. Stripe : Récupérer ou créer le Customer
        # On utilise le nom complet ou juste le prénom si pas de nom
        client_name = (
            f"{client.get('firstName', '')} {client.get('lastName', '')}".strip()
            or client.get("email")
        )

        stripe_customer_id = client.get("stripe_customer_id")

        # Si pas d'ID Stripe en base, on interroge Stripe
        if not stripe_customer_id:
            stripe_customer_id = get_or_create_customer(
                client["email"], client_name, client["id"]
            )
            # On sauvegarde le nouvel ID pour la prochaine fois
            supabase.table("Users").update(
                {"stripe_customer_id": stripe_customer_id}
            ).eq("id", client_id).execute()

        # 4. Stripe : Créer le Devis (Quote)
        stripe_quote = create_quote(
            customer_id=stripe_customer_id,
            amount_eur=quote.price,
            project_title=project["title"],
        )

        # 5. Mise à jour du projet avec l'ID du devis Stripe
        update_data = {
            "price": quote.price,
            "status": "devis_envoyé",
            "stripe_quote_id": stripe_quote.id,
            "updatedAt": datetime.now(timezone.utc).date().isoformat(),
        }

        result = (
            supabase.table("Projects").update(update_data).eq("id", projectId).execute()
        )

        return {
            "message": "Devis Stripe créé avec succès",
            "project": result.data[0],
            "stripe_quote_url": stripe_quote.id,  # On pourrait renvoyer l'URL si on l'avait
        }

    except Exception as e:
        logger.error(f"Erreur lors de la création du devis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{projectId}/pay")
async def pay_project(projectId: str, current_user=Depends(get_current_user)):
    """
    Initier le paiement Stripe pour le projet (Client uniquement)
    Retourne l'URL de redirection vers Stripe Checkout
    """
    try:
        # 1. Récupérer le projet
        project_query = (
            supabase.table("Projects").select("*").eq("id", projectId).execute()
        )
        if not project_query.data:
            raise HTTPException(status_code=404, detail="Projet non trouvé")

        project = project_query.data[0]

        # 2. Vérifier que c'est bien le client
        if project["userId"] != current_user.id:
            raise HTTPException(status_code=403, detail="Non autorisé")

        # 3. Vérifier le statut
        if project["status"] != "devis_envoyé":
            raise HTTPException(
                status_code=400, detail="Paiement non disponible pour ce statut"
            )

        # 4. Récupérer les infos client (Stripe ID)
        user_data = (
            supabase.table("Users")
            .select("*")
            .eq("id", current_user.id)
            .single()
            .execute()
        )
        stripe_customer_id = user_data.data.get("stripe_customer_id")

        # Si pour une raison quelconque l'ID manque, on le recrée
        if not stripe_customer_id:
            client_name = f"{user_data.data.get('firstName', '')} {user_data.data.get('lastName', '')}".strip() or user_data.data.get(
                "email"
            )
            stripe_customer_id = get_or_create_customer(
                user_data.data["email"], client_name, current_user.id
            )
            supabase.table("Users").update(
                {"stripe_customer_id": stripe_customer_id}
            ).eq("id", current_user.id).execute()

        # 5. Créer la session Checkout Stripe
        # URL de base du frontend (à configurer selon env prod/dev) ou referrer
        base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")  # A adapter

        checkout_url = create_checkout_session(
            customer_id=stripe_customer_id,
            amount_eur=project["price"],
            project_title=project["title"],
            project_id=projectId,
            success_url=f"{base_url}/projects/{projectId}?payment=success",
            cancel_url=f"{base_url}/projects/{projectId}?payment=cancel",
        )

        # On passe le statut à 'paiement_attente' le temps que l'utilisateur finisse sur Stripe
        supabase.table("Projects").update(
            {
                "status": "paiement_attente",
                "updatedAt": datetime.now(timezone.utc).date().isoformat(),
            }
        ).eq("id", projectId).execute()

        return {"url": checkout_url}

    except Exception as e:
        logger.error(f"Erreur lors de l'initiation du paiement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
    current_user=Depends(get_current_user),
):
    """
    Mettre à jour un projet existant (uniquement si statut 'en attente')
    """
    try:
        project_query = (
            supabase.table("Projects").select("*").eq("id", projectId).execute()
        )
        if not project_query.data:
            raise HTTPException(status_code=404, detail="Projet non trouvé")

        project = project_query.data[0]

        if project["userId"] != current_user.id:
            raise HTTPException(status_code=403, detail="Non autorisé")

        if project["status"] != "en attente":
            raise HTTPException(
                status_code=400,
                detail="Le projet ne peut être modifié que s'il est en attente",
            )

        update_data = {"updatedAt": datetime.now(timezone.utc).date().isoformat()}

        if title is not None:
            update_data["title"] = title
        if descriptionClient is not None:
            update_data["descriptionClient"] = descriptionClient
        if use is not None:
            update_data["use"] = use
        if format is not None:
            update_data["format"] = format
        if nbElements is not None:
            update_data["nbElements"] = nbElements
        if dimensionLength is not None:
            update_data["dimensionLength"] = dimensionLength
        if dimensionWidth is not None:
            update_data["dimensionWidth"] = dimensionWidth
        if dimensionHeight is not None:
            update_data["dimensionHeight"] = dimensionHeight
        if dimensionNoConstraint is not None:
            update_data["dimensionNoConstraint"] = dimensionNoConstraint
        if detailLevel is not None:
            update_data["detailLevel"] = detailLevel
        if deadlineType is not None:
            update_data["deadlineType"] = deadlineType
        if deadlineDate is not None:
            update_data["deadlineDate"] = deadlineDate
        if budget is not None:
            update_data["budget"] = budget

        result = (
            supabase.table("Projects").update(update_data).eq("id", projectId).execute()
        )

        return {
            "message": "Projet mis à jour avec succès",
            "project": result.data[0],
            "status": "success",
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du projet: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Erreur lors de la mise à jour du projet: {str(e)}"
        )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Webhook pour recevoir les confirmations de paiement de Stripe
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    # Log pour le débogage (ne pas laisser en prod si très verbeux)
    # logger.info(f"Webhook reçu. Signature: {sig_header[:10]}...")

    if not webhook_secret:
        logger.error(
            "STRIPE_WEBHOOK_SECRET manquant dans les variables d'environnement"
        )
        raise HTTPException(status_code=500, detail="Configuration serveur manquante")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError as e:
        logger.error(f"Webhook Error (ValueError): {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Webhook Error (SignatureVerificationError): {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Webhook Error (Unknown): {e}")
        raise HTTPException(status_code=400, detail="Webhook processing error")

    # Gestion de l'événement 'checkout.session.completed'
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        # Récupérer l'ID du projet stocké dans les métadonnées lors de la création de la session
        project_id = session.get("metadata", {}).get("project_id")

        if project_id:
            logger.info(f"WEBHOOK: Paiement confirmé pour le projet {project_id}")

            # Mise à jour du statut en 'payé'
            try:
                supabase.table("Projects").update(
                    {
                        "status": "payé",
                        "stripe_invoice_id": session.get("payment_intent"),
                        "updatedAt": datetime.now(timezone.utc).date().isoformat(),
                    }
                ).eq("id", project_id).execute()
                logger.info("Statut projet mis à jour -> payé")
            except Exception as db_error:
                logger.error(f"Erreur DB update projet {project_id}: {db_error}")

    # On renvoie toujours 200 OK pour dire à Stripe "Bien reçu", même si l'event ne nous intéresse pas
    return {"status": "success"}
