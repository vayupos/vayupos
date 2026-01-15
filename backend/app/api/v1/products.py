"""Products API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.services import ProductService
from app.schemas import (
    ProductCreate,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["Products"])


def product_to_dict(product, include_category=True):
    """Convert Product ORM to dict"""
    result = {
        "id": product.id,
        "sku": product.sku,
        "name": product.name,
        "description": product.description,
        "barcode": product.barcode,
        "price": float(product.price),
        "cost_price": float(product.cost_price) if product.cost_price else None,
        "stock_quantity": product.stock_quantity,
        "min_stock_level": product.min_stock_level,
        "is_active": product.is_active,
        "image_url": product.image_url,
        "category_id": product.category_id,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "updated_at": product.updated_at.isoformat() if product.updated_at else None,
    }

    # Only include category if requested and available
    if include_category and getattr(product, "category", None):
        result["category"] = {
            "id": product.category.id,
            "name": product.category.name,
            "description": product.category.description,
            "is_active": product.category.is_active,
            "created_at": product.category.created_at.isoformat()
            if product.category.created_at
            else None,
            "updated_at": product.category.updated_at.isoformat()
            if product.category.updated_at
            else None,
        }

    return result


# ============= Product Routes =============

@router.post("")
def create_product(
    product_create: ProductCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new product"""
    product = ProductService.create_product(db, product_create, int(current_user["sub"]))
    return product_to_dict(product)


@router.get("")
def list_products(
    skip: int = 0,
    limit: int = 100,
    category_id: int | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
):
    """List all products"""
    products, total = ProductService.list_products(
        db, skip, limit, category_id, is_active
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [product_to_dict(p, include_category=False) for p in products],
    }


@router.get("/low-stock")
def get_low_stock_products(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get products with low stock"""
    products = ProductService.get_low_stock_products(db)
    return [product_to_dict(p, include_category=False) for p in products]


@router.get("/search")
def search_products(
    q: str,
    db: Session = Depends(get_db),
):
    """Search products by name, SKU, or barcode"""
    products = ProductService.search_products(db, q)
    return [product_to_dict(p, include_category=False) for p in products]


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product by ID"""
    product = ProductService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_dict(product)


@router.put("/{product_id}")
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update product"""
    product = ProductService.update_product(db, product_id, product_update)
    return product_to_dict(product)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete product"""
    ProductService.delete_product(db, product_id)
    return {"message": "Product deleted successfully"}
