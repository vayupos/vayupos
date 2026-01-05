from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models import DishTemplate
from app.schemas import DishTemplateCreate, DishTemplateUpdate
from app.core.exceptions import not_found_exception, conflict_exception


class DishTemplateService:
    """Service for dish template operations (dish library)."""

    @staticmethod
    def list_dish_templates(
        db: Session,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[DishTemplate], int]:
        query = db.query(DishTemplate)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def create_dish_template(db: Session, data: DishTemplateCreate) -> DishTemplate:
        # avoid duplicate names
        existing = (
            db.query(DishTemplate)
            .filter(DishTemplate.name == data.name)
            .first()
        )
        if existing:
            raise conflict_exception("Dish with this name already exists")

        dish = DishTemplate(
            name=data.name,
            image_url=data.image_url,
            description=data.description,
            default_category_id=data.default_category_id,
        )
        db.add(dish)
        db.commit()
        db.refresh(dish)
        return dish

    @staticmethod
    def get_dish_template(db: Session, dish_id: int) -> DishTemplate:
        dish = db.query(DishTemplate).filter(DishTemplate.id == dish_id).first()
        if not dish:
            raise not_found_exception("Dish template not found")
        return dish

    @staticmethod
    def update_dish_template(
        db: Session,
        dish_id: int,
        data: DishTemplateUpdate,
    ) -> DishTemplate:
        dish = DishTemplateService.get_dish_template(db, dish_id)

        # ensure name uniqueness if changed
        if data.name and data.name != dish.name:
            existing = (
                db.query(DishTemplate)
                .filter(DishTemplate.name == data.name)
                .first()
            )
            if existing:
                raise conflict_exception("Dish with this name already exists")

        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(dish, field, value)

        db.commit()
        db.refresh(dish)
        return dish

    @staticmethod
    def delete_dish_template(db: Session, dish_id: int) -> bool:
        dish = DishTemplateService.get_dish_template(db, dish_id)
        db.delete(dish)
        db.commit()
        return True
