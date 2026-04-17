from pydantic import BaseModel
from typing import Optional


class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    price: float
    category: str
    overview_model_file: str
    file_formats: str
    download_model_file: str
