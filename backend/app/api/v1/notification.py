from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db  # ✅ CORRECT IMPORT
from app.schemas.notification import Notification, NotificationCreate
from app.services.notification_service import (
    create_notification,
    get_notifications,
    mark_notification_read,
    mark_all_read,
    delete_notification,
    delete_all
)

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/", response_model=Notification)
def create_notification_endpoint(notification: NotificationCreate, db: Session = Depends(get_db)):
    """Create a new notification"""
    return create_notification(db, notification)

@router.get("/", response_model=List[Notification])
def read_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get notifications with pagination and filters"""
    return get_notifications(db, skip, limit, unread_only)

@router.patch("/{notification_id}/read", response_model=Notification)
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark single notification as read"""
    notif = mark_notification_read(db, notification_id)
    if notif is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif

@router.patch("/", response_model=dict)
def mark_all_read_endpoint(db: Session = Depends(get_db)):
    """Mark ALL unread notifications as read"""
    count = mark_all_read(db)
    return {"marked_as_read": count}

@router.delete("/{notification_id}", response_model=dict)
def delete_notification_endpoint(notification_id: int, db: Session = Depends(get_db)):
    """Delete single notification"""
    success = delete_notification(db, notification_id)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

@router.delete("/", response_model=dict)
def delete_all_endpoint(db: Session = Depends(get_db)):
    """Delete ALL notifications"""
    count = delete_all(db)
    return {"deleted": count}
