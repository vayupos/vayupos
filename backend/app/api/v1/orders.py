"""Orders API routes"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.services import OrderService
from app.schemas import OrderCreate, OrderUpdate, OrderResponse
# 🔥 NEW IMPORTS FOR NOTIFICATIONS
from app.services.notification_service import create_notification
from app.schemas.notification import NotificationCreate
import traceback

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderResponse)
@router.post("", response_model=OrderResponse)
def create_order(
    order_create: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new order"""
    try:
        print(f"📦 Creating order with data: {order_create.dict()}")
        print(f"👤 Current user: {current_user}")
        order = OrderService.create_order(
            db,
            order_create,
            int(current_user["user_id"]),
            int(current_user["client_id"]),
        )
        db.refresh(order) # Ensure we have the calculated total and ID
        print(f"✅ Order created successfully: {order.id}")
        
        # 🔥 NOTIFICATION: New order created
        notification = NotificationCreate(
            title=f"New order #{order.id}",
            description=f"Order #{order.order_number} received - ₹{float(order.total)}",
            category="order"
        )
        print(f"🔔 Attempting to create notification with data: {notification.dict()}")
        create_notification(db, notification)
        print(f"🔔 Notification sent successfully for order #{order.id}")
        
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
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all orders"""
    orders, total = OrderService.list_orders(
        db,
        int(current_user["client_id"]),
        skip,
        limit,
        status,
        customer_id,
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [OrderResponse.from_orm(order) for order in orders],
    }

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get order by ID or order_number"""
    order = None
    if order_id.isdigit():
        order = OrderService.get_order_by_id(db, int(order_id), int(current_user["client_id"]))
    
    # If not found by ID or not numeric, try by order_number
    if not order:
        order = OrderService.get_order_by_number(db, order_id, int(current_user["client_id"]))
        
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
        
    return OrderResponse.from_orm(order)

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update order"""
    order = OrderService.update_order(db, order_id, order_update, int(current_user["client_id"]))
    
    # 🔥 NOTIFICATION: Order updated
    notification = NotificationCreate(
        title=f"Order #{order_id} updated",
        description=f"Status changed to {order_update.status or 'modified'}",
        category="order"
    )
    create_notification(db, notification)
    
    return OrderResponse.from_orm(order)

@router.post("/{order_id}/cancel")
def cancel_order(
    order_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel an order"""
    order = OrderService.cancel_order(
        db,
        order_id,
        int(current_user["user_id"]),
        int(current_user["client_id"]),
    )
    
    # 🔥 NOTIFICATION: Order cancelled
    notification = NotificationCreate(
        title=f"Order #{order_id} cancelled",
        description=f"Table {getattr(order, 'table_number', 'N/A')} was cancelled by staff",
        category="order"
    )
    create_notification(db, notification)
    print(f"🔔 Cancellation notification sent for order #{order_id}")
    
    return {
        "message": "Order cancelled successfully",
        "order": OrderResponse.from_orm(order),
    }

@router.get("/number/{order_number}", response_model=OrderResponse)
def get_order_by_number(
    order_number: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get order by order number"""
    order = OrderService.get_order_by_number(db, order_number, int(current_user["client_id"]))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.from_orm(order)

@router.get("/customer/{customer_id}", response_model=List[OrderResponse])
def get_customer_orders(
    customer_id: int,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all orders for a customer"""
    orders = OrderService.get_customer_orders(db, customer_id, int(current_user["client_id"]), limit)
    return [OrderResponse.from_orm(order) for order in orders]
