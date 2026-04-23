from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.models.user import Base
import enum
from datetime import datetime


class InventoryAction(str, enum.Enum):
    """Inventory action enumeration"""
    STOCK_IN = "stock_in"
    STOCK_OUT = "stock_out"
    ADJUSTMENT = "adjustment"
    DAMAGE = "damage"
    RETURN = "return"
    SALE = "sale"


class InventoryLog(Base):
    """Inventory log model for tracking stock movements"""
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(Enum(InventoryAction), nullable=False)
    quantity_change = Column(Integer, nullable=False)  # Positive for addition, negative for reduction
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="inventory_logs")
    user = relationship("User")

    def __repr__(self):
        return f"<InventoryLog(id={self.id}, product_id={self.product_id}, action='{self.action.value}', change={self.quantity_change})>"
