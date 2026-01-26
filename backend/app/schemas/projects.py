from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum


class NbElementsEnum(str, Enum):
    unique = "unique"
    multiple = "multiple"


class DetailLevelEnum(str, Enum):
    basique = "basique"
    standard = "standard"
    hd = "hd"


class DeadlineTypeEnum(str, Enum):
    none = "none"
    flexible = "flexible"
    urgent = "urgent"


class BudgetEnum(str, Enum):
    less_100 = "less_100"
    budget_100_300 = "100_300"
    budget_300_500 = "300_500"
    budget_500_1000 = "500_1000"
    more_1000 = "more_1000"
    discuss = "discuss"


class ProjectStatusEnum(str, Enum):
    en_attente = "en attente"
    devis_envoye = "devis_envoyé"
    paiement_attente = "paiement_attente"
    paye = "payé"
    en_cours = "en cours"
    termine = "terminé"


class ProjectQuote(BaseModel):
    """Schéma pour la création d'un devis"""
    price: float = Field(..., gt=0, description="Prix du devis en euros")
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Le prix doit être supérieur à 0')
        if v > 100000:
            raise ValueError('Le prix ne peut pas dépasser 100 000€')
        return round(v, 2)


class ProjectBase(BaseModel):
    """Schéma de base pour les projets"""
    title: str = Field(..., min_length=3, max_length=200, description="Titre du projet")
    descriptionClient: str = Field(..., min_length=10, max_length=5000, description="Description du projet")
    use: str = Field(..., min_length=3, max_length=500, description="Usage prévu du modèle")
    format: Optional[str] = Field(None, max_length=200, description="Formats de fichier souhaités")
    nbElements: str = Field(default="unique", description="Nombre d'éléments")
    dimensionLength: Optional[float] = Field(None, ge=0, le=10000, description="Longueur en cm")
    dimensionWidth: Optional[float] = Field(None, ge=0, le=10000, description="Largeur en cm")
    dimensionHeight: Optional[float] = Field(None, ge=0, le=10000, description="Hauteur en cm")
    dimensionNoConstraint: bool = Field(default=False)
    detailLevel: str = Field(default="standard", description="Niveau de détail")
    deadlineType: Optional[str] = Field(None, description="Type de délai")
    deadlineDate: Optional[str] = Field(None, description="Date limite")
    budget: Optional[str] = Field(None, description="Budget indicatif")
    
    @field_validator('title')
    @classmethod
    def sanitize_title(cls, v):
        # Supprimer les caractères potentiellement dangereux
        if v:
            v = v.strip()
            # Empêcher les scripts XSS basiques
            v = v.replace('<', '&lt;').replace('>', '&gt;')
        return v
    
    @field_validator('descriptionClient')
    @classmethod
    def sanitize_description(cls, v):
        if v:
            v = v.strip()
            v = v.replace('<script', '&lt;script').replace('</script>', '&lt;/script&gt;')
        return v


class ProjectCreate(ProjectBase):
    """Schéma pour la création d'un projet"""
    pass


class ProjectUpdate(BaseModel):
    """Schéma pour la mise à jour d'un projet (tous les champs optionnels)"""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    descriptionClient: Optional[str] = Field(None, min_length=10, max_length=5000)
    use: Optional[str] = Field(None, min_length=3, max_length=500)
    format: Optional[str] = Field(None, max_length=200)
    nbElements: Optional[str] = None
    dimensionLength: Optional[float] = Field(None, ge=0, le=10000)
    dimensionWidth: Optional[float] = Field(None, ge=0, le=10000)
    dimensionHeight: Optional[float] = Field(None, ge=0, le=10000)
    dimensionNoConstraint: Optional[bool] = None
    detailLevel: Optional[str] = None
    deadlineType: Optional[str] = None
    deadlineDate: Optional[str] = None
    budget: Optional[str] = None


class ProjectResponse(ProjectBase):
    """Schéma de réponse pour un projet"""
    id: str
    userId: str
    status: str
    created_at: str
    price: Optional[float] = None
    stripe_quote_id: Optional[str] = None
    stripe_invoice_id: Optional[str] = None
    images: Optional[List[dict]] = None
    
    class Config:
        from_attributes = True
