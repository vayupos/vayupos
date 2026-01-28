from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.api.dependencies import get_db
from app.services import ProductService, CustomerService, OrderService
from app.schemas.customer import CustomerResponse
from app.schemas.order import OrderResponse

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/global")
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """Search across products, customers, and orders"""
    
    # Search Products
    products = ProductService.search_products(db, q)
    product_results = [{
        "id": p.id,
        "name": p.name,
        "type": "product",
        "price": float(p.price),
        "sku": p.sku,
        "image_url": p.image_url
    } for p in products[:5]]
    
    # Search Customers
    customers = CustomerService.search_customers(db, q)
    customer_results = [{
        "id": c.id,
        "name": f"{c.first_name} {c.last_name}",
        "type": "customer",
        "email": c.email,
        "phone": c.phone
    } for c in customers[:5]]
    
    # Search Orders (Adding method to OrderService)
    from app.models import Order, Customer
    orders = db.query(Order).join(Customer, Order.customer_id == Customer.id, isouter=True).filter(
        (Order.order_number.ilike(f"%{q}%")) |
        (Customer.first_name.ilike(f"%{q}%")) |
        (Customer.last_name.ilike(f"%{q}%"))
    ).order_by(Order.created_at.desc()).limit(5).all()
    
    order_results = [{
        "id": o.id,
        "order_number": o.order_number,
        "type": "order",
        "total": float(o.total),
        "status": o.order_status if hasattr(o, 'order_status') else "pending",
        "created_at": o.created_at.isoformat() if o.created_at else None
    } for o in orders]
    
    return {
        "products": product_results,
        "customers": customer_results,
        "orders": order_results,
        "query": q
    }
