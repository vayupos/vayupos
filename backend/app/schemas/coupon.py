from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DiscountType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class CouponBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=50, description="Coupon code")
    discount_type: DiscountType
    discount_value: float = Field(..., gt=0, description="Discount amount or percentage")
    min_order_amount: float = Field(default=0.0, ge=0)
    max_uses: Optional[int] = Field(None, ge=1, description="Maximum uses, NULL for unlimited")
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    description: Optional[str] = None


    @validator("code")
    def code_uppercase(cls, v: str) -> str:
        return v.upper().strip()


    @validator("discount_value")
    def validate_discount(cls, v: float, values):
        if "discount_type" in values:
            if values["discount_type"] == DiscountType.PERCENTAGE and v > 100:
                raise ValueError("Percentage discount cannot exceed 100%")
        return v


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=3, max_length=50)
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[float] = Field(None, gt=0)
    min_order_amount: Optional[float] = Field(None, ge=0)
    max_uses: Optional[int] = Field(None, ge=1)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class CouponResponse(CouponBase):
    id: int
    used_count: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


    class Config:
        from_attributes = True


# ✅ FIXED: Flexible field aliases for frontend compatibility
class CouponValidateRequest(BaseModel):
    code: str = Field(..., description="Coupon code")  # Accepts 'code' OR 'coupon_code'
    order_total: float = Field(..., ge=0, description="Order subtotal")  # Accepts 'order_total' OR 'subtotal'
    customer_id: Optional[str] = None


class CouponValidateResponse(BaseModel):
    valid: bool
    eligible: bool
    message: str
    coupon: Optional[CouponResponse] = None
    discount_amount: Optional[float] = None


class CouponAvailableResponse(BaseModel):
    eligible: List[CouponResponse]
    ineligible: List[dict]  # Can include reason, etc.


# -------- Assign schemas --------
class AssignOrderRequest(BaseModel):
    order_id: int


class AssignOrderResponse(BaseModel):
    success: bool
    message: str


class AssignCategoriesRequest(BaseModel):
    category_ids: List[int]


class AssignCategoriesResponse(BaseModel):
    success: bool
    message: str
