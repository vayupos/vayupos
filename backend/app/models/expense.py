from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.models.user import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(String, nullable=False)
    subtitle = Column(String, default="Manual entry")
    type = Column(String, default="manual")
    account = Column(String, default="Cashbook")
    tax = Column(Float, default=0.0)
    payment_mode = Column(String, default="Cash")
    due_date = Column(String, nullable=True)  # Added to track salary due date
    notes = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
