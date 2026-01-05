from typing import Optional
from pydantic import BaseModel


class DishTemplateBase(BaseModel):
    name: str
    image_url: str
    description: Optional[str] = None
    default_category_id: Optional[int] = None


class DishTemplateCreate(DishTemplateBase):
    """Data required to create a dish template."""
    pass


class DishTemplateUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    default_category_id: Optional[int] = None


class DishTemplateOut(DishTemplateBase):
    id: int

    class Config:
        orm_mode = True
