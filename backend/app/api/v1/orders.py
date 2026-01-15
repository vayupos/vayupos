"""Orders API routes"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.services import OrderService
from app.schemas import OrderCreate, OrderUpdate, OrderResponse
import traceback  # ← ADD THIS LINE

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderResponse)
@router.post("", response_model=OrderResponse)
def create_order(
    order_create: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new order"""
    try:  # ← ADD TRY-CATCH BLOCK
        print(f"📦 Creating order with data: {order_create.dict()}")
        print(f"👤 Current user: {current_user}")
        order = OrderService.create_order(db, order_create, int(current_user["sub"]))
        print(f"✅ Order created successfully: {order.id}")
        return OrderResponse.from_orm(order)
    except Exception as e:
        print(f"❌ Error creating order: {str(e)}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating order: {str(e)}"
        )


@router.get("/", response_model=dict)
@router.get("", response_model=dict)
def list_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """List all orders"""
    orders, total = OrderService.list_orders(db, skip, limit, status, customer_id)
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [OrderResponse.from_orm(order) for order in orders],
    }


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get order by ID"""
    order = OrderService.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.from_orm(order)


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update order"""
    order = OrderService.update_order(db, order_id, order_update)
    return OrderResponse.from_orm(order)


@router.post("/{order_id}/cancel")
def cancel_order(
    order_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel an order"""
    order = OrderService.cancel_order(db, order_id, int(current_user["sub"]))
    return {
        "message": "Order cancelled successfully",
        "order": OrderResponse.from_orm(order),
    }


@router.get("/number/{order_number}", response_model=OrderResponse)
def get_order_by_number(order_number: str, db: Session = Depends(get_db)):
    """Get order by order number"""
    order = OrderService.get_order_by_number(db, order_number)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.from_orm(order)


@router.get("/customer/{customer_id}", response_model=List[OrderResponse])
def get_customer_orders(
    customer_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Get all orders for a customer"""
    orders = OrderService.get_customer_orders(db, customer_id, limit)
    return [OrderResponse.from_orm(order) for order in orders]