from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.schemas import (
    DishTemplateCreate,
    DishTemplateUpdate,
    DishTemplateOut,
)
from app.services.dish_template_service import DishTemplateService


router = APIRouter(
    prefix="/dish-templates",
    tags=["DishTemplates"],
)


def dish_to_dict(dish) -> dict:
    return {
        "id": dish.id,
        "name": dish.name,
        "image_url": dish.image_url,
        "description": dish.description,
        "default_category_id": dish.default_category_id,
    }


@router.get("/", response_model=List[DishTemplateOut])
@router.get("", response_model=List[DishTemplateOut])
def list_dish_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List dish templates (dish library)."""
    dishes, total = DishTemplateService.list_dish_templates(db, skip, limit)
    # If you want the paginated wrapper, change response_model accordingly
    return dishes


@router.post("/", response_model=DishTemplateOut)
@router.post("", response_model=DishTemplateOut)
def create_dish_template(
    dish_in: DishTemplateCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new dish template (name + image)."""
    dish = DishTemplateService.create_dish_template(db, dish_in)
    return dish


@router.get("/{dish_id}", response_model=DishTemplateOut)
def get_dish_template(
    dish_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a single dish template by id."""
    dish = DishTemplateService.get_dish_template(db, dish_id)
    return dish


@router.put("/{dish_id}", response_model=DishTemplateOut)
def update_dish_template(
    dish_id: int,
    dish_in: DishTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update dish template."""
    dish = DishTemplateService.update_dish_template(db, dish_id, dish_in)
    return dish


@router.delete("/{dish_id}")
def delete_dish_template(
    dish_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete dish template."""
    DishTemplateService.delete_dish_template(db, dish_id)
    return {"message": "Dish template deleted successfully"}
