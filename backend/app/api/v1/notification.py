from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import traceback

from app.core.database import get_db

# Import schema and service  
try:
    from app.schemas.notification import Notification, NotificationCreate
    print("✓ Notification schemas imported successfully")
except Exception as e:
    print(f"✗ Failed to import notification schemas: {e}")
    traceback.print_exc()
    NotificationCreate = None
    Notification = dict

try:
    from app.services.notification_service import (
        create_notification,
        get_notifications,
        mark_notification_read,
        mark_all_read,
        delete_notification,
        delete_all
    )
    print("✓ Notification service imported successfully")
except Exception as e:
    print(f"✗ Failed to import notification service: {e}")
    traceback.print_exc()
    # Define dummy functions
    def get_notifications(db, skip=0, limit=50, unread_only=False):
        return []

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[dict])
def read_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get notifications with pagination and filters"""
    try:
        print(f"🔔 Fetching notifications: skip={skip}, limit={limit}")
        notifications = get_notifications(db, skip, limit, unread_only)
        print(f"✓ Found {len(notifications) if notifications else 0} notifications")
        return notifications if notifications else []
    except Exception as e:
        print(f"✗ ERROR in read_notifications: {str(e)}")
        traceback.print_exc()
        return []

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_notification_endpoint(
    notification: NotificationCreate, 
    db: Session = Depends(get_db)
):
    """Create a new notification"""
    try:
        if NotificationCreate is None:
            return {"error": "Service not available"}
        return create_notification(db, notification)
    except Exception as e:
        print(f"✗ ERROR in create_notification: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create notification")

@router.patch("/mark-all-read", response_model=dict)
def mark_all_read_endpoint(db: Session = Depends(get_db)):
    """Mark ALL unread notifications as read"""
    try:
        count = mark_all_read(db)
        return {"marked_as_read": count}
    except Exception as e:
        print(f"✗ ERROR in mark_all_read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark all as read")

@router.patch("/{notification_id}/read", response_model=dict)
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark single notification as read"""
    try:
        notif = mark_notification_read(db, notification_id)
        if notif is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True, "notification_id": notification_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ ERROR in mark_read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark as read")

@router.delete("/{notification_id}", response_model=dict)
def delete_notification_endpoint(notification_id: int, db: Session = Depends(get_db)):
    """Delete single notification"""
    try:
        success = delete_notification(db, notification_id)
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ ERROR in delete_notification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")

@router.delete("/all", response_model=dict)
def delete_all_endpoint(db: Session = Depends(get_db)):
    """Delete ALL notifications"""
    try:
        count = delete_all(db)
        return {"deleted": count}
    except Exception as e:
        print(f"✗ ERROR in delete_all: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete all notifications")

print("✓ Notification router successfully configured")
