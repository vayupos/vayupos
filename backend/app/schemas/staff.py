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
    salary_amount: float = Field(..., gt=0)  # Frontend sends this
    joined_date: datetime
    aadhar: Optional[str] = Field(None, max_length=14)

class StaffCreate(StaffBase):
    pass

class StaffUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    role: Optional[StaffRole] = None
    salary_amount: Optional[float] = Field(None, gt=0)
    aadhar: Optional[str] = Field(None, max_length=14)
    status: Optional[StaffStatus] = None

# ✅ FIXED: Matches frontend expectations
class StaffResponse(BaseModel):
    id: int
    name: str
    phone: str
    role: str
    salary: str  # "25,000 month" formatted
    salaryAmount: float  # 25000 raw number
    joined: str  # "13 Jan 2026" formatted  
    joinedDate: str  # ISO date
    avatar: str
    color: str
    status: StaffStatus
    aadhar: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ✅ FIXED: Matches StaffService & Frontend
class SalaryEntryResponse(BaseModel):
    id: int
    name: str
    role: str
    avatar: str
    color: str
    salary: dict  # {"amount": 25000} - Frontend expects this
    dueDate: str   # Frontend expects camelCase
    category: str = "Salaries & Wages"
