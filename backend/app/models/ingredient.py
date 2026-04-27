from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.models.user import Base
from datetime import datetime

class Ingredient(Base):
    """Ingredient model for recipe and stock management"""
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    unit = Column(String(50), default="grams", nullable=False)
    threshold = Column(Integer, default=10, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    stock = relationship("Stock", back_populates="ingredient", uselist=False, cascade="all, delete-orphan")
    product_links = relationship("ProductIngredient", back_populates="ingredient", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Ingredient(id={self.id}, name='{self.name}', unit='{self.unit}')>"

class ProductIngredient(Base):
    """Mapping between Products and Ingredients (Recipe)"""
    __tablename__ = "product_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="product_links")

    def __repr__(self):
        return f"<ProductIngredient(product_id={self.product_id}, ingredient_id={self.ingredient_id}, quantity={self.quantity})>"

class Stock(Base):
    """Current stock levels for ingredients"""
    __tablename__ = "stock"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False, unique=True)
    available_quantity = Column(Numeric(10, 2), default=0, nullable=False)
    total_added = Column(Numeric(10, 2), default=0, nullable=False)
    total_used = Column(Numeric(10, 2), default=0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    ingredient = relationship("Ingredient", back_populates="stock")

    def __repr__(self):
        return f"<Stock(ingredient_id={self.ingredient_id}, available={self.available_quantity})>"
