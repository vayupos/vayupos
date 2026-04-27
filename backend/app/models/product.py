from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, func, UniqueConstraint, Time
from sqlalchemy.orm import relationship
from app.models.user import Base
from datetime import datetime


class Product(Base):
    """Product model for inventory management"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    sku = Column(String(50), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint('client_id', 'sku', name='_client_sku_uc'),
    )
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    barcode = Column(String(100), unique=True, nullable=True, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    cost_price = Column(Numeric(10, 2), nullable=True)
    stock_quantity = Column(Integer, default=0, nullable=False)
    min_stock_level = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    food_type = Column(String(10), default='veg', nullable=False) # veg, non_veg, egg
    image_url = Column(String(500), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    printer_category = Column(String(50), default="food", nullable=False) # food, drinks
    
    is_time_restricted = Column(Boolean, default=False, nullable=False)
    available_from = Column(Time, nullable=True)
    available_to = Column(Time, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    inventory_logs = relationship("InventoryLog", back_populates="product", cascade="all, delete-orphan")
    ingredients = relationship("ProductIngredient", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product(id={self.id}, sku='{self.sku}', name='{self.name}', stock={self.stock_quantity})>"
