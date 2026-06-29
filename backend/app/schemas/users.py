from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    id: str
    email: EmailStr
    firstName: Optional[str] = ""
    lastName: Optional[str] = ""
    role: Optional[str] = "user"
    companyName: Optional[str] = ""
    createdAt: Optional[str] = None
    updateAt: Optional[str] = None


class UserUpdate(BaseModel):
    """
    Champs modifiables par l'utilisateur sur son propre profil.
    L'email n'y figure pas : il est modifié via Supabase Auth avec
    confirmation par email, puis synchronisé dans la table Users.
    """

    firstName: Optional[str] = None
    lastName: Optional[str] = None
    companyName: Optional[str] = None
