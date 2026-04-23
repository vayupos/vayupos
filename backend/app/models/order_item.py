from sqlalchemy import Column, Integer, Numeric, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from app.models.user import Base
from datetime import datetime


class OrderItem(Base):
    """Order item model for individual items in an order"""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(200), nullable=False)  # Store name in case product is deleted
    product_sku = Column(String(50), nullable=False)    # Store SKU in case product is deleted
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), nullable=False, default=0)
    subtotal = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")

    def __repr__(self):
        return f"<OrderItem(id={self.id}, product='{self.product_name}', qty={self.quantity}, price={self.unit_price})>"
