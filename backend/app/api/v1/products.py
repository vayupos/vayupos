"""Products API routes"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import csv
import io
import uuid
from datetime import datetime

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
        "food_type": getattr(product, "food_type", "veg"),
        "ingredients": [
            {
                "ingredient_id": ing.ingredient_id,
                "quantity": float(ing.quantity),
                "name": ing.ingredient.name if ing.ingredient else "Unknown"
            }
            for ing in (product.ingredients or [])
        ] if hasattr(product, "ingredients") else [],
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

@router.post("/csv-upload")
async def upload_products_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Import products from CSV"""
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    try:
        content = await file.read()
        decoded = content.decode('utf-8')
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please upload a valid CSV.")

    reader = csv.DictReader(io.StringIO(decoded))
    
    # Ensure headers match
    headers = [h.strip().lower() for h in (reader.fieldnames or [])]
    if "name" not in headers or "price" not in headers:
        raise HTTPException(status_code=400, detail="CSV must contain 'name' and 'price' columns")

    success_count = 0
    failed_rows = []
    
    for row_idx, row in enumerate(reader, start=2):
        name = row.get("name", "").strip()
        price_str = row.get("price", "").strip()
        
        if not name or not price_str:
            failed_rows.append({"row": row_idx, "reason": "Missing name or price"})
            continue
            
        try:
            price = float(price_str)
        except ValueError:
            failed_rows.append({"row": row_idx, "reason": f"Invalid price format: {price_str}"})
            continue
            
        is_restricted_str = str(row.get("is_time_restricted", "")).strip().lower()
        is_restricted = is_restricted_str in ["true", "1", "yes"]
        
        available_from = None
        available_to = None
        
        if is_restricted:
            from_str = str(row.get("available_from", "")).strip()
            to_str = str(row.get("available_to", "")).strip()
            if not from_str or not to_str:
                failed_rows.append({"row": row_idx, "reason": "Time restricted items must have available_from and available_to"})
                continue
            try:
                available_from = datetime.strptime(from_str, "%H:%M").time()
                available_to = datetime.strptime(to_str, "%H:%M").time()
            except ValueError:
                failed_rows.append({"row": row_idx, "reason": f"Invalid time format (must be HH:MM). Got: {from_str} - {to_str}"})
                continue
        
        sku = f"{name.upper().replace(' ', '-')}-{str(uuid.uuid4())[:6]}"
        
        try:
            p_create = ProductCreate(
                name=name,
                price=price,
                sku=sku,
                is_time_restricted=is_restricted,
                available_from=available_from,
                available_to=available_to
            )
            ProductService.create_product(
                db, 
                p_create, 
                int(current_user["user_id"]), 
                int(current_user["client_id"])
            )
            success_count += 1
        except Exception as e:
            failed_rows.append({"row": row_idx, "reason": str(e)})

    return {
        "success_count": success_count,
        "failed_rows": failed_rows
    }


@router.post("")
@router.post("/")
def create_product(
    product_create: ProductCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new product"""
    product = ProductService.create_product(
        db,
        product_create,
        int(current_user["user_id"]),
        int(current_user["client_id"]),
    )
    return product_to_dict(product)


@router.get("")
@router.get("/")
def list_products(
    skip: int = 0,
    limit: int = 100,
    category_id: int | None = None,
    is_active: bool | None = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all products"""
    products, total = ProductService.list_products(
        db, int(current_user["client_id"]), skip, limit, category_id, is_active
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
    products = ProductService.get_low_stock_products(db, int(current_user["client_id"]))
    return [product_to_dict(p, include_category=False) for p in products]


@router.get("/search")
def search_products(
    q: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search products by name, SKU, or barcode"""
    products = ProductService.search_products(db, int(current_user["client_id"]), q)
    return [product_to_dict(p, include_category=False) for p in products]


@router.get("/{product_id}")
def get_product(
    product_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get product by ID"""
    product = ProductService.get_product_by_id(db, product_id, int(current_user["client_id"]))
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
    product = ProductService.update_product(db, product_id, product_update, int(current_user["client_id"]))
    return product_to_dict(product)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete product"""
    ProductService.delete_product(db, product_id, int(current_user["client_id"]))
    return {"message": "Product deleted successfully"}
