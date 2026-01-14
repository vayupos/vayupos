from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False, unique=True)
    role = Column(String(50), nullable=False)
    salary = Column(Float, nullable=False)              # ✅ FIXED: was salary_amount
    joined = Column(DateTime, nullable=False)           # ✅ FIXED: was joined_date
    aadhar = Column(String(14))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    @property
    def status(self) -> str:
        """Convert is_active boolean to status string for API responses"""
        return "Active" if self.is_active else "Inactive"
