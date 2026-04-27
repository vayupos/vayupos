from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.user import Base
from datetime import datetime


class Category(Base):
    """Product category model"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint('client_id', 'name', name='_client_category_name_uc'),
    )
    description = Column(Text, nullable=True)
    icon_name = Column(String(50), default="Coffee")
    tax_rate = Column(Integer, default=5)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Printer routing (Optional)
    printer_ip = Column(String(50), nullable=True)
    printer_port = Column(Integer, default=9100, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    products = relationship("Product", back_populates="category", cascade="all, delete-orphan", lazy="select")

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', icon_name='{self.icon_name}', tax_rate={self.tax_rate})>"
