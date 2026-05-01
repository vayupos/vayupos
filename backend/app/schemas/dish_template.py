from typing import Optional
from datetime import time
from pydantic import BaseModel


class DishTemplateBase(BaseModel):
    name: str
    image_url: str
    description: Optional[str] = None
    default_category_id: Optional[int] = None
    food_type: Optional[str] = "veg"
    is_time_restricted: bool = False
    available_from: Optional[time] = None
    available_to: Optional[time] = None

class DishTemplateCreate(DishTemplateBase):
    """Data required to create a dish template."""
    pass


class DishTemplateUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    default_category_id: Optional[int] = None
    food_type: Optional[str] = None
    is_time_restricted: Optional[bool] = None
    available_from: Optional[time] = None
    available_to: Optional[time] = None

class DishTemplateOut(DishTemplateBase):
    id: int

    class Config:
        from_attributes = True
