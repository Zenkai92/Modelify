from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.users import UserCreate, UserUpdate
from app.database import supabase
from app.dependencies import get_current_user
from datetime import datetime, timezone
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/users/me", status_code=status.HTTP_200_OK)
async def get_current_user_profile(current_user=Depends(get_current_user)):
    """
    Récupérer le profil complet de l'utilisateur connecté via la table Users.
    Enriched user profile (safe, server-side).
    """
    try:
        response = (
            supabase.table("Users")
            .select("*")
            .eq("id", current_user.id)
            .single()
            .execute()
        )

        if not response.data:
            # Fallback si l'utilisateur n'est pas encore dans la table Users
            logger.warning(
                f"User {current_user.id} not found in Users table during /me call"
            )
            return {
                "id": current_user.id,
                "email": current_user.email,
                "role": "user",  # Default
                "firstName": "",
                "lastName": "",
            }

        profile = response.data

        # Synchronisation de l'email : si l'utilisateur a changé son adresse via
        # Supabase Auth (et l'a confirmée par email), le JWT vérifié porte la
        # nouvelle adresse. On réaligne alors la table Users en conséquence.
        if current_user.email and profile.get("email") != current_user.email:
            try:
                synced = (
                    supabase.table("Users")
                    .update(
                        {
                            "email": current_user.email,
                            "updateAt": datetime.now(timezone.utc).isoformat(),
                        }
                    )
                    .eq("id", current_user.id)
                    .execute()
                )
                if synced.data:
                    profile = synced.data[0]
            except Exception as sync_error:
                logger.warning(
                    f"Échec de la synchronisation de l'email pour {current_user.id}: {sync_error}"
                )

        return profile
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du profil utilisateur /me: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.put("/users/me", status_code=status.HTTP_200_OK)
async def update_current_user_profile(
    payload: UserUpdate, current_user=Depends(get_current_user)
):
    """
    Mettre à jour le profil de l'utilisateur connecté (prénom, nom, société).
    L'email et le rôle ne peuvent pas être modifiés par ce endpoint :
    l'email passe par Supabase Auth avec confirmation par email.
    """
    update_data = payload.model_dump(exclude_unset=True, exclude_none=True)

    # Défense en profondeur : on n'accepte jamais ces champs sensibles ici
    for forbidden in ("role", "email", "id"):
        update_data.pop(forbidden, None)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune donnée à mettre à jour",
        )

    update_data["updateAt"] = datetime.now(timezone.utc).isoformat()

    try:
        response = (
            supabase.table("Users")
            .update(update_data)
            .eq("id", current_user.id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profil introuvable",
            )

        return {
            "message": "Profil mis à jour avec succès",
            "user": response.data[0],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du profil {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.get("/users", status_code=status.HTTP_200_OK)
async def get_users(current_user=Depends(get_current_user)):
    """
    Récupérer la liste de tous les utilisateurs (Admin uniquement).
    """
    # 1. Vérification du rôle Admin en base de données (Guidelines de sécurité)
    try:
        admin_check = (
            supabase.table("Users")
            .select("role")
            .eq("id", current_user.id)
            .single()
            .execute()
        )

        if not admin_check.data or admin_check.data["role"] != "admin":
            logger.warning(
                f"Accès refusé à /users pour l'utilisateur {current_user.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès réservé aux administrateurs",
            )

        # 2. Récupération de tous les utilisateurs
        response = supabase.table("Users").select("*").execute()
        return response.data

    except Exception as e:
        logger.error(f"Erreur lors de la récupération des utilisateurs: {e}")
        # Si l'erreur vient déjà d'une HTTPException, on la relance
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    user_data = user.model_dump(exclude_unset=True)

    # Sécurité : Force le rôle à 'user' uniquement
    # Empêche la création de comptes 'admin' via l'API publique
    if user_data.get("role") != "user":
        user_data["role"] = "user"

    # Ensure dates are set if not provided
    if not user_data.get("createdAt"):
        user_data["createdAt"] = datetime.now(timezone.utc).isoformat()
    if not user_data.get("updateAt"):
        user_data["updateAt"] = datetime.now(timezone.utc).isoformat()

    try:
        response = supabase.table("Users").insert(user_data).execute()

        # Check for error in response if any (supabase-py usually raises exception on error, but let's be safe)
        # In v2, if there is an error it might raise postgrest.exceptions.APIError

        return {
            "message": "User created successfully",
            "user": response.data[0] if response.data else None,
        }
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=400, detail=str(e))
