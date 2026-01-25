from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    id: str
    email: EmailStr
    firstName: Optional[str] = ""
    lastName: Optional[str] = ""
    role: Optional[str] = "particulier"
    companyName: Optional[str] = ""
    streetAddress: Optional[str] = ""
    city: Optional[str] = ""
    postalCode: Optional[str] = ""
    createdAt: Optional[str] = None
    updateAt: Optional[str] = None
