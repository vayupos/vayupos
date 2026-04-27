from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import uuid

from app.models import KOT, KOTItem, Order, OrderItem, Product, User
from app.models.kot import KOTStatus, KOTPriority
from app.core.exceptions import not_found_exception, bad_request_exception

class KOTService:
    """Service for Kitchen Order Ticket operations"""

    @staticmethod
    def _generate_kot_number(db: Session, client_id: int) -> str:
        """Generate a sequential KOT number for the client for today"""
        today = datetime.utcnow().date()
        count = db.query(KOT).filter(
            KOT.client_id == client_id,
            func.date(KOT.created_at) == today
        ).count()
        return f"KOT-{today.strftime('%y%m%d')}-{count + 1:03d}"

    @staticmethod
    def create_kot_for_order_items(db: Session, order: Order, order_items: List[OrderItem], client_id: int) -> KOT:
        """Create a new KOT for specific order items"""
        if not order_items:
            raise bad_request_exception("No items provided for KOT")

        kot = KOT(
            order_id=order.id,
            client_id=client_id,
            kot_number=KOTService._generate_kot_number(db, client_id)
        )
        db.add(kot)
        db.flush()

        for item in order_items:
            # Get product to find printer_category
            product = db.query(Product).filter(Product.id == item.product_id).first()
            printer_cat = product.printer_category if product else "food"

            kot_item = KOTItem(
                kot_id=kot.id,
                order_item_id=item.id,
                client_id=client_id,
                status=KOTStatus.PREPARING,
                priority=KOTPriority.NORMAL,
                printer_category=printer_cat
            )
            db.add(kot_item)

        db.commit()
        db.refresh(kot)
        return kot

    @staticmethod
    def list_active_kots(db: Session, client_id: int) -> List[KOT]:
        """List active KOTs for kitchen display"""
        # A KOT is active if any item is not 'served' and not 'cancelled'
        active_kot_ids = db.query(KOTItem.kot_id).filter(
            KOTItem.client_id == client_id,
            KOTItem.status.in_([KOTStatus.PREPARING, KOTStatus.READY]),
            KOTItem.is_cancelled == False
        ).distinct().all()
        
        ids = [r[0] for r in active_kot_ids]
        
        return db.query(KOT).filter(
            KOT.id.in_(ids),
            KOT.client_id == client_id
        ).order_by(KOT.created_at.asc()).all()

    @staticmethod
    def update_item_status(db: Session, kot_item_id: int, status: str, client_id: int) -> KOTItem:
        """Update KOT item status with transition rules"""
        item = db.query(KOTItem).filter(
            KOTItem.id == kot_item_id,
            KOTItem.client_id == client_id
        ).first()
        
        if not item:
            raise not_found_exception("KOT item not found")

        # Status transition rules: preparing -> ready -> served
        allowed_transitions = {
            KOTStatus.PREPARING: [KOTStatus.READY],
            KOTStatus.READY: [KOTStatus.SERVED],
            KOTStatus.SERVED: []
        }

        if status not in allowed_transitions.get(item.status, []):
            raise bad_request_exception(f"Invalid status transition from {item.status} to {status}")

        item.status = status
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_item_priority(db: Session, kot_item_id: int, priority: str, client_id: int) -> KOTItem:
        """Update KOT item priority"""
        item = db.query(KOTItem).filter(
            KOTItem.id == kot_item_id,
            KOTItem.client_id == client_id
        ).first()
        
        if not item:
            raise not_found_exception("KOT item not found")

        if priority not in [KOTPriority.NORMAL, KOTPriority.HIGH]:
            raise bad_request_exception("Invalid priority")

        item.priority = priority
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def cancel_item(db: Session, kot_item_id: int, reason: str, manager_id: int, client_id: int) -> KOTItem:
        """Cancel a KOT item (Manager only)"""
        item = db.query(KOTItem).filter(
            KOTItem.id == kot_item_id,
            KOTItem.client_id == client_id
        ).first()
        
        if not item:
            raise not_found_exception("KOT item not found")

        if not reason:
            raise bad_request_exception("Cancellation reason is required")

        item.is_cancelled = True
        item.cancel_reason = reason
        item.cancelled_by = manager_id
        item.status = KOTStatus.CANCELLED
        
        db.commit()
        db.refresh(item)
        return item
