from pydantic import BaseModel, Field, field_validator, ValidationInfo
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DiscountType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"
    FLAT = "flat"  # alias used by frontend & legacy DB rows


# ---------------------------------------------------------------------------
# Base — shared fields only. NO input-validation validators here because
# CouponResponse also inherits from this and runs validators on DB reads.
# ---------------------------------------------------------------------------
class CouponBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=50, description="Coupon code")
    discount_type: DiscountType
    discount_value: float = Field(..., gt=0, description="Discount amount or percentage")
    min_order_amount: float = Field(default=0.0, ge=0)
    max_uses: Optional[int] = Field(None, ge=1, description="Maximum uses, NULL for unlimited")
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    product_id: Optional[int] = None
    description: Optional[str] = None
    is_first_order_only: bool = False

    @field_validator("code", mode="before")
    @classmethod
    def code_uppercase(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("discount_value")
    @classmethod
    def validate_discount(cls, v: float, info: ValidationInfo) -> float:
        if info.data.get("discount_type") == DiscountType.PERCENTAGE and v > 100:
            raise ValueError("Percentage discount cannot exceed 100%")
        return v


# ---------------------------------------------------------------------------
# Create — adds min_order_amount rounding rule (input only, not on DB reads)
# ---------------------------------------------------------------------------
class CouponCreate(CouponBase):
    @field_validator("min_order_amount")
    @classmethod
    def validate_min_order_amount(cls, v: float) -> float:
        if v and v % 50 != 0:
            raise ValueError(
                f"Minimum order must be a rounded value (\u20b9100, \u20b9200, \u20b9300 etc.). "
                f"Got \u20b9{int(v)}, nearest valid values: "
                f"\u20b9{int(v // 50) * 50} or \u20b9{int(v // 50 + 1) * 50}."
            )
        return v


# ---------------------------------------------------------------------------
# Update — partial, with its own rounding rule
# ---------------------------------------------------------------------------
class CouponUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=3, max_length=50)
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[float] = Field(None, gt=0)
    min_order_amount: Optional[float] = Field(None, ge=0)
    max_uses: Optional[int] = Field(None, ge=1)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    product_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_first_order_only: Optional[bool] = None
    description: Optional[str] = None

    @field_validator("min_order_amount")
    @classmethod
    def validate_min_order_amount(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v != 0 and v % 50 != 0:
            raise ValueError(
                f"Minimum order must be a rounded value (\u20b9100, \u20b9200, \u20b9300 etc.). "
                f"Got \u20b9{int(v)}, nearest valid values: "
                f"\u20b9{int(v // 50) * 50} or \u20b9{int(v // 50 + 1) * 50}."
            )
        return v


# ---------------------------------------------------------------------------
# Response — inherits CouponBase WITHOUT any strict input validators
# ---------------------------------------------------------------------------
class CouponResponse(CouponBase):
    id: int
    used_count: int
    product_id: Optional[int] = None
    is_active: bool
    is_first_order_only: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ✅ PERFECT MATCH: Exactly what frontend sends
class CouponValidateRequest(BaseModel):
    coupon_code: str  # ✅ Matches frontend {"coupon_code":"PONGAL"}
    subtotal: float = Field(..., ge=0)  # ✅ Matches frontend {"subtotal":5720}
    customer_id: Optional[int] = None


class CouponValidateResponse(BaseModel):
    valid: bool
    eligible: bool
    message: str
    coupon: Optional[CouponResponse] = None
    discount_amount: Optional[float] = None


class CouponAvailableResponse(BaseModel):
    eligible: List[CouponResponse]
    ineligible: List[dict]


# Assign schemas
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
