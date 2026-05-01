"""Orders API routes"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.services import OrderService
from app.schemas import OrderCreate, OrderUpdate, OrderResponse, OrderItemCreate
from app.services.notification_service import create_notification
from app.schemas.notification import NotificationCreate

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
        order = OrderService.create_order(
            db,
            order_create,
            int(current_user["user_id"]),
            int(current_user["client_id"]),
        )
        db.refresh(order)

        create_notification(
            db,
            NotificationCreate(
                title=f"New order #{order.id}",
                description=f"Order #{order.order_number} received - ₹{float(order.total)}",
                category="order",
            ),
            int(current_user["client_id"]),
        )

        return OrderResponse.from_orm(order)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while creating order: {str(e)}",
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

    create_notification(
        db,
        NotificationCreate(
            title=f"Order #{order_id} updated",
            description=f"Status changed to {order_update.status or 'modified'}",
            category="order",
        ),
        int(current_user["client_id"]),
    )

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

    create_notification(
        db,
        NotificationCreate(
            title=f"Order #{order_id} cancelled",
            description=f"Table {getattr(order, 'table_number', 'N/A')} was cancelled by staff",
            category="order",
        ),
        int(current_user["client_id"]),
    )

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


@router.post("/{order_id}/items", response_model=OrderResponse)
def add_items_to_order(
    order_id: int,
    items: List[OrderItemCreate],
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add items to an existing order and generate a new KOT"""
    order = OrderService.add_items_to_order(
        db=db,
        order_id=order_id,
        items=items,
        user_id=int(current_user["user_id"]),
        client_id=int(current_user["client_id"]),
    )
    return OrderResponse.from_orm(order)
