from pydantic import BaseModel
from datetime import date
from typing import Optional

class ExpenseBase(BaseModel):
    title: str
    category: str
    amount: float
    date: date
    subtitle: Optional[str] = "Manual entry"
    type: Optional[str] = "manual"
    account: Optional[str] = "Cashbook"
    tax: Optional[float] = 0.0
    payment_mode: Optional[str] = "Cash"
    notes: Optional[str] = ""

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[date] = None
    # Add other optional fields...

class Expense(ExpenseBase):
    id: int
    created_at: Optional[date] = None

    class Config:
        from_attributes = True
