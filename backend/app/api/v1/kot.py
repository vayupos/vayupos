from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.services.kot_service import KOTService
from app.schemas import (
    KOTResponse, 
    KOTItemUpdateStatus, 
    KOTItemUpdatePriority, 
    KOTItemCancel,
    KOTItemResponse
)
from app.models import UserRole

router = APIRouter(prefix="/kot", tags=["Kitchen Order Ticket"])

@router.get("/", response_model=List[KOTResponse])
@router.get("", response_model=List[KOTResponse])
def list_active_kots(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all active KOTs for the kitchen display"""
    kots = KOTService.list_active_kots(db, int(current_user["client_id"]))
    
    # Format response to include order details
    results = []
    for kot in kots:
        items = []
        for item in kot.items:
            items.append({
                "id": item.id,
                "kot_id": item.kot_id,
                "order_item_id": item.order_item_id,
                "product_name": item.order_item.product_name,
                "quantity": item.order_item.quantity,
                "status": item.status,
                "priority": item.priority,
                "is_cancelled": item.is_cancelled,
                "cancel_reason": item.cancel_reason,
                "printer_category": item.printer_category,
                "created_at": item.created_at,
                "notes": kot.order.notes # Order notes often apply to items
            })
            
        results.append({
            "id": kot.id,
            "order_id": kot.order_id,
            "order_number": kot.order.order_number,
            "kot_number": kot.kot_number,
            "table_number": getattr(kot.order, 'table_number', None), # If exists
            "items": items,
            "created_at": kot.created_at
        })
        
    return results

@router.patch("/items/{item_id}/status", response_model=KOTItemResponse)
def update_item_status(
    item_id: int,
    status_update: KOTItemUpdateStatus,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update KOT item status"""
    item = KOTService.update_item_status(
        db=db,
        kot_item_id=item_id,
        status=status_update.status,
        client_id=int(current_user["client_id"])
    )
    # Map back for response
    return {
        "id": item.id,
        "kot_id": item.kot_id,
        "order_item_id": item.order_item_id,
        "product_name": item.order_item.product_name,
        "quantity": item.order_item.quantity,
        "status": item.status,
        "priority": item.priority,
        "is_cancelled": item.is_cancelled,
        "cancel_reason": item.cancel_reason,
        "printer_category": item.printer_category,
        "created_at": item.created_at
    }

@router.patch("/items/{item_id}/priority", response_model=KOTItemResponse)
def update_item_priority(
    item_id: int,
    priority_update: KOTItemUpdatePriority,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update KOT item priority"""
    item = KOTService.update_item_priority(
        db=db,
        kot_item_id=item_id,
        priority=priority_update.priority,
        client_id=int(current_user["client_id"])
    )
    return {
        "id": item.id,
        "kot_id": item.kot_id,
        "order_item_id": item.order_item_id,
        "product_name": item.order_item.product_name,
        "quantity": item.order_item.quantity,
        "status": item.status,
        "priority": item.priority,
        "is_cancelled": item.is_cancelled,
        "cancel_reason": item.cancel_reason,
        "printer_category": item.printer_category,
        "created_at": item.created_at
    }

@router.patch("/items/{item_id}/cancel", response_model=KOTItemResponse)
def cancel_item(
    item_id: int,
    cancel_req: KOTItemCancel,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a KOT item (Manager only)"""
    if current_user["role"] != UserRole.MANAGER and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only managers can cancel KOT items")
        
    item = KOTService.cancel_item(
        db=db,
        kot_item_id=item_id,
        reason=cancel_req.reason,
        manager_id=int(current_user["user_id"]),
        client_id=int(current_user["client_id"])
    )
    return {
        "id": item.id,
        "kot_id": item.kot_id,
        "order_item_id": item.order_item_id,
        "product_name": item.order_item.product_name,
        "quantity": item.order_item.quantity,
        "status": item.status,
        "priority": item.priority,
        "is_cancelled": item.is_cancelled,
        "cancel_reason": item.cancel_reason,
        "printer_category": item.printer_category,
        "created_at": item.created_at
    }
