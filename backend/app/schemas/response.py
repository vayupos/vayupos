"""Pydantic schemas for request and response validation"""

import re
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, EmailStr, validator

from app.models.user import UserRole
from app.models.order import OrderStatus
from app.models.payment import PaymentMethod, PaymentStatus
from app.models.inventory_log import InventoryAction


# ============= User Schemas =============
class UserBase(BaseModel):
    """Base user schema"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.CASHIER


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=72)

    @validator("password")
    def validate_password_length(cls, v: str) -> str:
        """Ensure password is not longer than 72 bytes (bcrypt limit)"""
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password cannot exceed 72 bytes when encoded as UTF-8")
        return v


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """User response schema"""
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============= Category Schemas =============
class CategoryBase(BaseModel):
    """Base category schema"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    """Category creation schema"""
    pass


class CategoryUpdate(BaseModel):
    """Category update schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    """Category response schema"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============= Product Schemas =============
class ProductBase(BaseModel):
    """Base product schema"""
    sku: str = Field(..., max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    barcode: Optional[str] = None
    price: Decimal = Field(..., decimal_places=2, gt=0)
    cost_price: Optional[Decimal] = Field(None, decimal_places=2)
    min_stock_level: int = Field(default=0, ge=0)
    category_id: Optional[int] = None
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    """Product creation schema"""
    stock_quantity: int = Field(default=0, ge=0)


class ProductUpdate(BaseModel):
    """Product update schema"""
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    barcode: Optional[str] = None
    price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    min_stock_level: Optional[int] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    """Product response schema"""
    id: int
    stock_quantity: int
    is_active: bool
    category: Optional["CategoryResponse"] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============= Customer Schemas =============

PHONE_PATTERN = re.compile(r"^[6-9]\d{9}$")
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.(com|org|in)$", re.IGNORECASE)


class CustomerBase(BaseModel):
    """Base customer schema"""
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None


class CustomerCreate(CustomerBase):
    """Customer creation schema"""

    @validator("phone")
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return v
        if not PHONE_PATTERN.match(v):
            raise ValueError("Phone must be 10-digit Indian mobile like 9876543210")
        return v

    @validator("email")
    def validate_email(cls, v: Optional[EmailStr]) -> Optional[EmailStr]:
        if v is None:
            return v
        if not EMAIL_PATTERN.match(str(v)):
            raise ValueError("Email must end with .com, .org or .in")
        return v


class CustomerUpdate(BaseModel):
    """Customer update schema"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    is_active: Optional[bool] = None

    @validator("phone")
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return v
        if not PHONE_PATTERN.match(v):
            raise ValueError("Phone must be 10-digit Indian mobile like 9876543210")
        return v

    @validator("email")
    def validate_email(cls, v: Optional[EmailStr]) -> Optional[EmailStr]:
        if v is None:
            return v
        if not EMAIL_PATTERN.match(str(v)):
            raise ValueError("Email must end with .com, .org or .in")
        return v


class CustomerResponse(CustomerBase):
    """Customer response schema"""
    id: int
    loyalty_points: int
    total_spent: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============= Order Item Schemas =============
class OrderItemCreate(BaseModel):
    """Order item creation schema"""
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Optional[Decimal] = None
    discount: Decimal = Field(default=0, ge=0)


class OrderItemResponse(BaseModel):
    """Order item response schema"""
    id: int
    order_id: int
    product_id: Optional[int]
    product_name: str
    product_sku: str
    quantity: int
    unit_price: Decimal
    discount: Decimal
    subtotal: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Order Schemas =============
class OrderCreate(BaseModel):
    """Order creation schema"""
    customer_id: Optional[int] = None
    order_items: List[OrderItemCreate]
    discount: Decimal = Field(default=0, ge=0)
    tax: Decimal = Field(default=0, ge=0)
    notes: Optional[str] = None


class OrderUpdate(BaseModel):
    """Order update schema"""
    customer_id: Optional[int] = None
    status: Optional[OrderStatus] = None
    discount: Optional[Decimal] = None
    tax: Optional[Decimal] = None
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    """Order response schema"""
    id: int
    order_number: str
    customer: Optional[CustomerResponse] = None
    user: Optional[UserResponse] = None
    status: OrderStatus
    subtotal: Decimal
    tax: Decimal
    discount: Decimal
    total: Decimal
    notes: Optional[str] = None
    order_items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============= Payment Schemas =============
class PaymentCreate(BaseModel):
    """Payment creation schema"""
    order_id: int
    payment_method: PaymentMethod
    amount: Decimal = Field(..., decimal_places=2, gt=0)
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentUpdate(BaseModel):
    """Payment update schema"""
    status: Optional[PaymentStatus] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    """Payment response schema"""
    id: int
    order_id: int
    payment_method: PaymentMethod
    status: PaymentStatus
    amount: Decimal
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============= Inventory Log Schemas =============
class InventoryLogCreate(BaseModel):
    """Inventory log creation schema"""
    product_id: int
    action: InventoryAction
    quantity_change: int = Field(..., ne=0)
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class InventoryLogResponse(BaseModel):
    """Inventory log response schema"""
    id: int
    product_id: int
    user_id: Optional[int] = None
    action: InventoryAction
    quantity_change: int
    quantity_before: int
    quantity_after: int
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Generic Response Schemas =============
class ResponseSchema(BaseModel):
    """Generic response schema"""
    status: str
    message: str
    data: Optional[dict] = None


class PaginationParams(BaseModel):
    """Pagination parameters"""
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=100, ge=1, le=1000)


class LoginRequest(BaseModel):
    """User login request schema"""
    username: str
    password: str


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
