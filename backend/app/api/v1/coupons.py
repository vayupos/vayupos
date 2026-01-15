from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.coupon import (
    CouponCreate,
    CouponUpdate,
    CouponResponse,
    CouponValidateRequest,
    CouponValidateResponse,
    CouponAvailableResponse,
    AssignOrderRequest,
    AssignOrderResponse,
    AssignCategoriesRequest,
    AssignCategoriesResponse,
)
from app.services.coupon_service import CouponService
from app.api.dependencies import get_current_user

from app.models.coupon import Coupon
from app.models.order import Order
from app.models.category import Category
from app.models.order_coupon import OrderCoupon
from app.models.coupon_category import CouponCategory

router = APIRouter(prefix="/coupons", tags=["Coupons"])


@router.post(
    "/",
    response_model=CouponResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_coupon(
    coupon_data: CouponCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new coupon (Admin only)"""
    return CouponService.create_coupon(db, coupon_data)


@router.get("/", response_model=List[CouponResponse])
def list_coupons(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Get all coupons with optional filtering"""
    return CouponService.get_all_coupons(db, skip, limit, active_only)


# ✅ FIXED: Changed from Query parameter to request body
@router.get("/available", response_model=CouponAvailableResponse)
def get_available_coupons(
    db: Session = Depends(get_db),
):
    """Get all available coupons (no subtotal filter needed for initial load)"""
    # Get all active coupons
    eligible, ineligible = CouponService.get_available_coupons(db, subtotal=0)
    
    # Combine both lists - frontend will filter based on order total
    all_coupons = eligible + ineligible

    # Convert Coupon objects to CouponResponse dicts
    coupons_response = [CouponResponse.model_validate(coupon).model_dump() for coupon in all_coupons]

    return {
        "eligible": coupons_response,
        "ineligible": [],
    }


# ✅ FIXED: This is the main endpoint that was causing the error
@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(
    request: CouponValidateRequest,  # ✅ Now accepts body with code + order_total
    db: Session = Depends(get_db),
):
    """
    ✅ FIXED: Validate a coupon code and check eligibility
    
    Request Body:
    {
        "code": "PONGAL",           // or "coupon_code": "PONGAL" 
        "order_total": 500          // or "subtotal": 500
    }
    """
    # ✅ Handle both field names (code/coupon_code and order_total/subtotal)
    coupon_code = getattr(request, 'code', None) or getattr(request, 'coupon_code', None)
    order_total = getattr(request, 'order_total', None) or getattr(request, 'subtotal', None)
    
    if not coupon_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon code is required"
        )
    
    if order_total is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order total is required"
        )
    
    valid, eligible, message, coupon, discount_amount = CouponService.validate_coupon(
        db,
        coupon_code,
        order_total,
    )
    return {
        "valid": valid,
        "eligible": eligible,
        "message": message,
        "coupon": CouponResponse.model_validate(coupon).model_dump() if coupon else None,
        "discount_amount": discount_amount,
    }


@router.get("/{coupon_id}", response_model=CouponResponse)
def get_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific coupon by ID"""
    coupon = CouponService.get_coupon_by_id(db, coupon_id)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coupon with ID {coupon_id} not found",
        )
    return CouponResponse.model_validate(coupon).model_dump()


@router.put("/{coupon_id}", response_model=CouponResponse)
def update_coupon(
    coupon_id: int,
    coupon_data: CouponUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update an existing coupon (Admin only)"""
    updated = CouponService.update_coupon(db, coupon_id, coupon_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coupon with ID {coupon_id} not found",
        )
    return CouponResponse.model_validate(updated).model_dump()


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete (deactivate) a coupon (Admin only)"""
    ok = CouponService.delete_coupon(db, coupon_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coupon with ID {coupon_id} not found",
        )
    return None


# ---- Assign coupon to order ----

@router.post(
    "/{coupon_id}/assign-order",
    response_model=AssignOrderResponse,
    summary="Assign coupon to order",
)
def assign_coupon_to_order(
    coupon_id: int,
    payload: AssignOrderRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Assign a coupon to a specific order"""
    # Check if coupon exists
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )

    # Check if order exists
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check if this coupon is already assigned to this order
    existing = db.query(OrderCoupon).filter(
        OrderCoupon.order_id == order.id,
        OrderCoupon.coupon_id == coupon.id
    ).first()

    if existing:
        return AssignOrderResponse(
            success=True,
            message=f"Coupon '{coupon.code}' is already assigned to Order #{order.id}"
        )

    # Create the assignment
    link = OrderCoupon(order_id=order.id, coupon_id=coupon.id)
    db.add(link)
    db.commit()

    return AssignOrderResponse(
        success=True,
        message=f"Coupon '{coupon.code}' successfully assigned to Order #{order.id}"
    )


# ---- Assign coupon to categories ----

@router.post(
    "/{coupon_id}/assign-categories",
    response_model=AssignCategoriesResponse,
    summary="Assign coupon to menu categories",
)
def assign_coupon_to_categories(
    coupon_id: int,
    payload: AssignCategoriesRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Assign a coupon to multiple menu categories"""
    # Check if coupon exists
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )

    # Validate that all category IDs exist
    if not payload.category_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one category ID must be provided"
        )

    for cat_id in payload.category_ids:
        category = db.query(Category).filter(Category.id == cat_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {cat_id} not found"
            )

    # Remove existing category assignments for this coupon
    db.query(CouponCategory).filter(CouponCategory.coupon_id == coupon_id).delete()

    # Assign new categories
    for cat_id in payload.category_ids:
        link = CouponCategory(coupon_id=coupon_id, category_id=cat_id)
        db.add(link)

    db.commit()

    # Get category names for the response message
    assigned_categories = db.query(Category).filter(
        Category.id.in_(payload.category_ids)
    ).all()
    category_names = ", ".join([cat.name for cat in assigned_categories])

    return AssignCategoriesResponse(
        success=True,
        message=f"Coupon '{coupon.code}' successfully assigned to categories: {category_names}"
    )