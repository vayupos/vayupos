"""Payment service"""
from decimal import Decimal
from typing import Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Payment, PaymentStatus, Order
from app.schemas import PaymentCreate, PaymentUpdate
from app.core.exceptions import not_found_exception, bad_request_exception


class PaymentService:
    """Service for payment operations"""

    @staticmethod
    def create_payment(db: Session, payment_create: PaymentCreate, client_id: int) -> Payment:
        """Create a new payment"""
        order = db.query(Order).filter(
            Order.id == payment_create.order_id,
            Order.client_id == client_id
        ).first()
        if not order:
            raise not_found_exception("Order not found")

        # ----- Validate payment amount -----
        total_paid = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(
                Payment.order_id == payment_create.order_id,
                Payment.client_id == client_id,
                Payment.status.in_(
                    [PaymentStatus.COMPLETED, PaymentStatus.PARTIALLY_REFUNDED]
                ),
            )
            .scalar()
            or Decimal(0)
        )

        remaining_amount = order.total - total_paid

        if payment_create.amount > remaining_amount:
            raise bad_request_exception(
                f"Payment amount exceeds remaining order total. Remaining: {remaining_amount}"
            )

        # ----- Create payment -----
        db_payment = Payment(
            client_id=client_id,
            order_id=payment_create.order_id,
            payment_method=payment_create.payment_method,
            status=PaymentStatus.COMPLETED,  # or PENDING if you want async capture
            amount=payment_create.amount,
            transaction_id=payment_create.transaction_id,
            reference_number=payment_create.reference_number,
            notes=payment_create.notes,
        )

        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        return db_payment

    @staticmethod
    def get_payment_by_id(db: Session, payment_id: int, client_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        return db.query(Payment).filter(Payment.id == payment_id, Payment.client_id == client_id).first()

    @classmethod
    def get_payment_by_transaction_id(
        cls, db: Session, transaction_id: str, client_id: int
    ) -> Optional[Payment]:
        """Get payment by transaction ID"""
        return db.query(Payment).filter(
            Payment.transaction_id == transaction_id,
            Payment.client_id == client_id
        ).first()

    @staticmethod
    def update_payment(
        db: Session, payment_id: int, payment_update: PaymentUpdate, client_id: int
    ) -> Payment:
        """Update payment"""
        payment = PaymentService.get_payment_by_id(db, payment_id, client_id)
        if not payment:
            raise not_found_exception("Payment not found")

        update_data = payment_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(payment, field, value)

        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def refund_payment(
        db: Session, payment_id: int, client_id: int, reason: Optional[str] = None
    ) -> Payment:
        """Refund a payment"""
        payment = PaymentService.get_payment_by_id(db, payment_id, client_id)
        if not payment:
            raise not_found_exception("Payment not found")

        if payment.status == PaymentStatus.REFUNDED:
            raise bad_request_exception("Payment is already refunded")

        payment.status = PaymentStatus.REFUNDED
        if reason:
            payment.notes = f"Refunded: {reason}"

        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def list_payments(
        db: Session,
        client_id: int,
        skip: int = 0,
        limit: int = 100,
        order_id: Optional[int] = None,
        status: Optional[PaymentStatus] = None,
    ) -> Tuple[list[Payment], int]:
        """List payments"""
        query = db.query(Payment).filter(Payment.client_id == client_id)

        if order_id is not None:
            query = query.filter(Payment.order_id == order_id)

        if status is not None:
            query = query.filter(Payment.status == status)

        query = query.order_by(Payment.created_at.desc())
        total = query.count()
        payments = query.offset(skip).limit(limit).all()
        return payments, total

    @staticmethod
    def get_order_payment_status(db: Session, order_id: int, client_id: int) -> dict:
        """Get payment status for an order"""
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.client_id == client_id
        ).first()
        if not order:
            raise not_found_exception("Order not found")

        paid_amount = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(
                Payment.order_id == order_id,
                Payment.client_id == client_id,
                Payment.status == PaymentStatus.COMPLETED,
            )
            .scalar()
            or Decimal(0)
        )

        remaining = order.total - paid_amount
        is_paid = remaining <= 0

        return {
            "order_id": order_id,
            "order_total": order.total,
            "paid_amount": paid_amount,
            "remaining_amount": max(remaining, Decimal(0)),
            "is_fully_paid": is_paid,
        }
