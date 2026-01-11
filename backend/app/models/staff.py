from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, text
from sqlalchemy.sql import func
from app.core.database import Base

class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False, unique=True)
    role = Column(String(50), nullable=False)
    salary_amount = Column(Float, nullable=False)
    joined_date = Column(DateTime, nullable=False)
    aadhar = Column(String(14))
    status = Column(String(20), default="Active")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
