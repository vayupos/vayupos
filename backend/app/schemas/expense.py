from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ExpenseBase(BaseModel):
    title: str
    category: str
    amount: float
    date: str
    subtitle: Optional[str] = "Manual entry"
    type: Optional[str] = "manual"
    account: Optional[str] = "Cashbook"
    tax: Optional[float] = 0.0
    payment_mode: Optional[str] = "Cash"
    due_date: Optional[str] = None
    notes: Optional[str] = ""

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    subtitle: Optional[str] = None
    type: Optional[str] = None
    account: Optional[str] = None
    tax: Optional[float] = None
    payment_mode: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None

class Expense(ExpenseBase):
    id: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
