from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
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
    salary: float = Field(..., gt=0)           # ✅ FIXED
    joined: date                               # ✅ FIXED
    aadhar: Optional[str] = Field(None, max_length=14)

class StaffCreate(StaffBase):
    pass

class StaffUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    role: Optional[StaffRole] = None
    salary: Optional[float] = Field(None, gt=0)  # ✅ FIXED
    aadhar: Optional[str] = Field(None, max_length=14)
    status: Optional[StaffStatus] = None

# Response schemas are perfect ✅
class StaffResponse(BaseModel):
    id: int
    name: str
    phone: str
    role: str
    salary: str
    salaryAmount: float
    joined: str
    joinedDate: str
    avatar: str
    color: str
    status: StaffStatus
    aadhar: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SalaryEntryResponse(BaseModel):
    id: int
    name: str
    role: str
    avatar: str
    color: str
    salary: dict
    dueDate: str
    category: str = "Salaries & Wages"
