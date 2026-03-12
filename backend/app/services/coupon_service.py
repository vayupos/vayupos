from datetime import datetime, timezone
from typing import Optional, List, Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.coupon import Coupon
from app.models.order_coupon import OrderCoupon  # keep if you use later
from app.schemas.coupon import CouponCreate, CouponUpdate


class CouponService:

    @staticmethod
    def create_coupon(db: Session, coupon_data: CouponCreate) -> Coupon:
        """Create a new coupon"""
        # Check for duplicate code first (friendly error)
        existing = db.query(Coupon).filter(Coupon.code == coupon_data.code).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"A coupon with code '{coupon_data.code}' already exists. "
                       f"Please use a different code or edit the existing coupon."
            )

        coupon = Coupon(**coupon_data.dict())
        db.add(coupon)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail=f"A coupon with code '{coupon_data.code}' already exists."
            )
        db.refresh(coupon)
        return coupon

    @staticmethod
    def get_coupon_by_id(db: Session, coupon_id: int) -> Optional[Coupon]:
        """Get coupon by ID"""
        return db.query(Coupon).filter(Coupon.id == coupon_id).first()

    @staticmethod
    def get_coupon_by_code(db: Session, code: str) -> Optional[Coupon]:
        """Get coupon by code"""
        return db.query(Coupon).filter(Coupon.code == code).first()

    @staticmethod
    def get_all_coupons(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False,
    ) -> List[Coupon]:
        """Get all coupons with optional filtering"""
        query = db.query(Coupon)
        if active_only:
            query = query.filter(Coupon.is_active == True)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_available_coupons(
        db: Session, subtotal: float, customer_id: Optional[int] = None
    ) -> Tuple[List[Coupon], List[Coupon]]:
        """Get available coupons split into eligible and ineligible based on subtotal"""
        from app.models.order import Order
        now = datetime.now(timezone.utc)

        all_coupons = db.query(Coupon).all()

        eligible: List[Coupon] = []
        ineligible: List[Coupon] = []

        for coupon in all_coupons:
            # 1. Check Inactive
            if not coupon.is_active:
                ineligible.append(coupon)
                continue

            # 2. Check Expiration
            if coupon.valid_from and now < coupon.valid_from:
                ineligible.append(coupon)
                continue
            if coupon.valid_until and now > coupon.valid_until:
                ineligible.append(coupon)
                continue

            # 3. Usage Limit
            if coupon.max_uses and coupon.used_count >= coupon.max_uses:
                ineligible.append(coupon)
                continue

            # 4. Minimum Order
            if coupon.min_order_amount and subtotal < coupon.min_order_amount:
                ineligible.append(coupon)
                continue

            # 5. First Order Only
            if coupon.is_first_order_only:
                if not customer_id:
                    ineligible.append(coupon)
                    continue
                
                order_count = db.query(Order).filter(Order.customer_id == customer_id).count()
                if order_count > 0:
                    ineligible.append(coupon)
                    continue

            eligible.append(coupon)

        return eligible, ineligible

    @staticmethod
    def update_coupon(
        db: Session, coupon_id: int, coupon_data: CouponUpdate
    ) -> Optional[Coupon]:
        """Update a coupon"""
        coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
        if not coupon:
            return None

        for key, value in coupon_data.dict(exclude_unset=True).items():
            setattr(coupon, key, value)

        db.commit()
        db.refresh(coupon)
        return coupon

    @staticmethod
    def delete_coupon(db: Session, coupon_id: int) -> bool:
        """
        Soft delete a coupon.

        - Always keeps row in DB.
        - Just marks coupon as inactive (and optionally expired).
        """
        coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
        if not coupon:
            return False

        # soft delete only – NO db.delete here
        coupon.is_active = False

        # optional: also force expiry so it never applies again
        # if not coupon.valid_until or coupon.valid_until > datetime.now(timezone.utc):
        #     coupon.valid_until = datetime.now(timezone.utc)

        db.commit()
        return True

    @staticmethod
    def validate_coupon(
        db: Session,
        code: str,
        order_amount: float,
        customer_id: Optional[int] = None,
        apply_discount: bool = False,
    ) -> Tuple[bool, bool, Optional[str], Optional[Coupon], float]:
        """Validate if coupon can be applied to an order and optionally apply it"""
        # Import Order here to avoid circular imports if any, or at the top
        from app.models.order import Order

        coupon = db.query(Coupon).filter(Coupon.code == code).first()

        if not coupon:
            return False, False, "Coupon not found", None, 0.0

        if not coupon.is_active:
            return False, False, "Coupon is inactive", None, 0.0

        now = datetime.now(timezone.utc)

        if coupon.valid_from and now < coupon.valid_from:
            return False, False, "Coupon not yet active", None, 0.0

        if coupon.valid_until and now > coupon.valid_until:
            return False, False, "Coupon has expired", None, 0.0

        if coupon.max_uses and coupon.used_count >= coupon.max_uses:
            return False, False, "Coupon usage limit reached", None, 0.0

        if coupon.min_order_amount and order_amount < coupon.min_order_amount:
            return (
                False,
                False,
                f"Minimum order amount is ₹{coupon.min_order_amount}",
                None,
                0.0,
            )

        # Welcome Offer / First Order Only Logic
        if coupon.is_first_order_only:
            if not customer_id:
                return (
                    False,
                    False,
                    "Welcome offer is valid only for registered customers.",
                    None,
                    0.0,
                )

            order_count = db.query(Order).filter(Order.customer_id == customer_id).count()
            if order_count > 0:
                return (
                    False,
                    False,
                    "Welcome offer is valid only for first-time customers.",
                    None,
                    0.0,
                )

        discount = CouponService.calculate_discount(coupon, order_amount)

        if apply_discount:
            coupon.used_count += 1
            db.commit()

        return True, True, "Coupon is valid", coupon, discount

    @staticmethod
    def calculate_discount(coupon: Coupon, order_amount: float) -> float:
        """Calculate discount amount based on coupon type"""
        if coupon.discount_type == "percentage":
            discount = (order_amount * coupon.discount_value) / 100
        else:
            discount = coupon.discount_value
        return min(discount, order_amount)

    @staticmethod
    def increment_usage(db: Session, coupon_id: int) -> bool:
        """Increment coupon usage count"""
        coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
        if not coupon:
            return False
        coupon.used_count += 1
        db.commit()
        return True
