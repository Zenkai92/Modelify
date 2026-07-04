from pydantic import BaseModel, Field, field_validator


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
