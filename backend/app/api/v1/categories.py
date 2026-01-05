from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.services import CategoryService
from app.schemas import CategoryCreate, CategoryUpdate

router = APIRouter(tags=["Categories"], prefix="/categories")


def category_to_dict(category):
    """Convert Category ORM to dict"""
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "is_active": category.is_active,
        "created_at": category.created_at.isoformat() if category.created_at else None,
        "updated_at": category.updated_at.isoformat() if category.updated_at else None,
    }


# ============= Category Routes =============

@router.post("/")
def create_category(
    category_create: CategoryCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new category"""
    category = CategoryService.create_category(db, category_create)
    return category_to_dict(category)


@router.get("/")
def list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all categories"""
    categories, total = CategoryService.list_categories(db, skip, limit)
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [category_to_dict(cat) for cat in categories],
    }


@router.get("/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get category by ID"""
    category = CategoryService.get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category_to_dict(category)


@router.put("/{category_id}")
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update category"""
    category = CategoryService.update_category(db, category_id, category_update)
    return category_to_dict(category)


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete category"""
    CategoryService.delete_category(db, category_id)
    return {"message": "Category deleted successfully"}
