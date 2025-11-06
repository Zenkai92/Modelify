from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ProjectRequestBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    project_type: str
    title: str
    description: str
    budget: Optional[str] = None

class ProjectRequestCreate(ProjectRequestBase):
    pass

class ProjectRequestResponse(ProjectRequestBase):
    id: int
    created_at: datetime
    status: str = "pending"
    
    class Config:
        from_attributes = True