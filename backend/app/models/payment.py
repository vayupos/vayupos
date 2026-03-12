from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.models.user import Base
import enum
from datetime import datetime


class PaymentMethod(str, enum.Enum):
    """Payment method enumeration"""
    CASH = "cash"
    CARD = "card"
    UPI = "upi"
    OTHER = "other"


class PaymentStatus(str, enum.Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class Payment(Base):
    """Payment model for managing order payments"""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_id = Column(String(100), unique=True, nullable=True, index=True)
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="payments")

    def __repr__(self):
        return f"<Payment(id={self.id}, method='{self.payment_method.value}', amount={self.amount}, status='{self.status.value}')>"
