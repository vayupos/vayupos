from sqlalchemy import Column, Integer, String, Float, Date, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Staff(Base):
    """Staff database model"""
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False, index=True)
    role = Column(String, nullable=False)
    salary = Column(Float, nullable=False)
    joined = Column(Date, nullable=False)
    aadhar = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    @property
    def status(self) -> str:
        """Computed property for status based on is_active"""
        return "Active" if self.is_active else "Inactive"