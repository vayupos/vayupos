from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base
import enum
from datetime import datetime

# Use declarative_base directly to avoid circular import
Base = declarative_base()


class UserRole(str, enum.Enum):
    """User role enumeration"""
    ADMIN = "admin"
    CASHIER = "cashier"
    MANAGER = "manager"
    INVENTORY_OFFICER = "inventory_officer"


class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), unique=True, nullable=True, index=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CASHIER)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    # Correct relationships
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    inventory_logs = relationship("InventoryLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role.value}')>"
