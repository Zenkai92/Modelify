from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase
import os
import logging
from jose import jwt, JWTError

security = HTTPBearer()
logger = logging.getLogger(__name__)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Valide le token JWT via Supabase et retourne l'utilisateur courant.
    Tente une validation locale si SUPABASE_JWT_SECRET est présent pour les performances.
    """
    token = credentials.credentials
    secret = os.getenv("SUPABASE_JWT_SECRET")

    # Optimisation: Validation locale si le secret est disponible
    if secret:
        try:
            # Supabase utilise HS256 par défaut
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={
                    "verify_aud": False
                },  # Parfois l'audience peut varier, mais 'authenticated' est standard
            )

            # Reconstruction d'un objet utilisateur minimal
            class User:
                def __init__(self, id, email, user_metadata):
                    self.id = id
                    self.email = email
                    self.user_metadata = user_metadata

            return User(
                id=payload.get("sub"),
                email=payload.get("email"),
                user_metadata=payload.get("user_metadata", {}),
            )
        except JWTError:
            # Si échec local, fallback sur l'API
            pass

    try:
        # Vérification du token auprès de Supabase Auth
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide ou expiré",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_response.user
    except Exception as e:
        logger.error(f"Erreur d'authentification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Erreur d'authentification",
            headers={"WWW-Authenticate": "Bearer"},
        )
