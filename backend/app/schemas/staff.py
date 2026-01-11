from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class StaffRole(str, Enum):
    CASHIER = "Cashier"
    WAITER = "Waiter"
    CHEF = "Chef"
    MANAGER = "Manager"

class StaffStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"

class StaffBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    role: StaffRole
    salary_amount: float = Field(..., gt=0)
    joined_date: datetime
    aadhar: Optional[str] = Field(None, max_length=14)  # Formatted: "1234 5678 9012"

class StaffCreate(StaffBase):
    pass

class StaffUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    role: Optional[StaffRole] = None
    salary_amount: Optional[float] = Field(None, gt=0)
    aadhar: Optional[str] = Field(None, max_length=14)
    status: Optional[StaffStatus] = None

class StaffResponse(StaffBase):
    id: int
    status: StaffStatus = "Active"
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SalaryEntryResponse(BaseModel):
    id: int
    name: str
    role: str
    salary_amount: float
    due_date: str
    category: str = "Salaries & Wages"
