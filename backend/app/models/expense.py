from sqlalchemy import Column, Integer, String, Float, Date, Text, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subtitle = Column(String(255))
    category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    type = Column(String(50), default="manual")  # 'manual' or 'auto'
    account = Column(String(100), default="Cashbook")
    tax = Column(Float, default=0.0)
    payment_mode = Column(String(50), default="Cash")
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
