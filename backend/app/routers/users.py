from fastapi import APIRouter, HTTPException, status
from app.schemas.users import UserCreate
from app.database import supabase
from datetime import datetime, timezone
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    user_data = user.model_dump(exclude_unset=True)
    
    # Sécurité : Force le rôle à 'particulier' ou 'professionnel' uniquement
    # Empêche la création de comptes 'admin' via l'API publique
    if user_data.get('role') not in ['particulier', 'professionnel']:
        user_data['role'] = 'particulier'
    
    # Ensure dates are set if not provided
    if not user_data.get('createdAt'):
        user_data['createdAt'] = datetime.now(timezone.utc).isoformat()
    if not user_data.get('updateAt'):
        user_data['updateAt'] = datetime.now(timezone.utc).isoformat()

    try:
        response = supabase.table("Users").insert(user_data).execute()
        
        # Check for error in response if any (supabase-py usually raises exception on error, but let's be safe)
        # In v2, if there is an error it might raise postgrest.exceptions.APIError
        
        return {"message": "User created successfully", "user": response.data[0] if response.data else None}
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=400, detail=str(e))
