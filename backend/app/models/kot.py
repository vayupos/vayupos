from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.user import Base
from datetime import datetime
import enum

class KOTStatus(str, enum.Enum):
    PREPARING = "preparing"
    READY = "ready"
    SERVED = "served"
    CANCELLED = "cancelled"

class KOTPriority(str, enum.Enum):
    NORMAL = "normal"
    HIGH = "high"

class KOT(Base):
    """KOT (Kitchen Order Ticket) model"""
    __tablename__ = "kots"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, nullable=False, index=True)
    kot_number = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order")
    items = relationship("KOTItem", back_populates="kot", cascade="all, delete-orphan")

class KOTItem(Base):
    """KOT individual item model"""
    __tablename__ = "kot_items"

    id = Column(Integer, primary_key=True, index=True)
    kot_id = Column(Integer, ForeignKey("kots.id", ondelete="CASCADE"), nullable=False)
    order_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, nullable=False, index=True)
    
    status = Column(String(20), default=KOTStatus.PREPARING, nullable=False)
    priority = Column(String(20), default=KOTPriority.NORMAL, nullable=False)
    
    is_cancelled = Column(Boolean, default=False)
    cancel_reason = Column(Text, nullable=True)
    cancelled_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    printer_category = Column(String(50), default="food", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    kot = relationship("KOT", back_populates="items")
    order_item = relationship("OrderItem")
    canceller = relationship("User")
