"""Payments API routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.services import PaymentService
from app.schemas import PaymentCreate, PaymentUpdate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/", response_model=PaymentResponse)
def create_payment(
    payment_create: PaymentCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new payment"""
    payment = PaymentService.create_payment(db, payment_create, int(current_user["client_id"]))
    return payment


@router.get("/", response_model=dict)
def list_payments(
    skip: int = 0,
    limit: int = 100,
    order_id: int = None,
    status: str = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all payments"""
    payments, total = PaymentService.list_payments(
        db, 
        int(current_user["client_id"]), 
        skip, 
        limit, 
        order_id, 
        status
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": payments,
    }


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment by ID"""
    payment = PaymentService.get_payment_by_id(db, payment_id, int(current_user["client_id"]))
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    payment_update: PaymentUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update payment"""
    payment = PaymentService.update_payment(db, payment_id, payment_update, int(current_user["client_id"]))
    return payment


@router.post("/{payment_id}/refund")
def refund_payment(
    payment_id: int,
    reason: str = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Refund a payment"""
    payment = PaymentService.refund_payment(db, payment_id, int(current_user["client_id"]), reason)
    return {"message": "Payment refunded successfully", "payment_id": payment.id}


@router.get("/order/{order_id}/status", response_model=dict)
def get_order_payment_status(
    order_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get payment status for an order"""
    status = PaymentService.get_order_payment_status(db, order_id, int(current_user["client_id"]))
    return status
