from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean
from sqlalchemy.orm import relationship
from app.models.user import Base
from datetime import datetime


class Customer(Base):
    """Customer model for managing customer information"""
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=True, index=True)
    phone = Column(String(20), nullable=True, index=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    zip_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    loyalty_points = Column(Integer, default=0, nullable=False)
    total_spent = Column(Numeric(10, 2), default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")

    @property
    def orders_count(self):
        """Count total orders for this customer"""
        return len(self.orders)

    def __repr__(self):
        return f"<Customer(id={self.id}, name='{self.first_name} {self.last_name}', points={self.loyalty_points})>"
