from pydantic import BaseModel, validator
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

    @validator("date")
    def validate_date_format(cls, v):
        try:
            # Check if it already matches YYYY-MM-DD HH:MM
            datetime.strptime(v, "%Y-%m-%d %H:%M")
            return v
        except ValueError:
            try:
                # If it's just YYYY-MM-DD, convert it
                dt = datetime.strptime(v, "%Y-%m-%d")
                return dt.strftime("%Y-%m-%d 00:00")
            except ValueError:
                # If it's something else, try to parse it generically or fallback to now
                try:
                    dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                    return dt.strftime("%Y-%m-%d %H:%M")
                except:
                    # Final fallback to standard format for current time if everything fails
                    return datetime.now().strftime("%Y-%m-%d %H:%M")

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
