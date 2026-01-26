from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db

print("🔔 Loading notification module...")

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[dict])
def read_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get notifications with pagination and filters"""
    print(f"🔔 GET /notifications called with skip={skip}, limit={limit}, unread_only={unread_only}")
    try:
        from app.services.notification_service import get_notifications
        notifications = get_notifications(db, skip, limit, unread_only)
        print(f"✓ Returning {len(notifications) if notifications else 0} notifications")
        return notifications if notifications else []
    except Exception as e:
        print(f"✗ Error in read_notifications: {e}")
        import traceback
        traceback.print_exc()
        # Return empty list instead of erroring
        return []

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_notification_endpoint(notification_data: dict, db: Session = Depends(get_db)):
    """Create a new notification"""
    print(f"🔔 POST /notifications called")
    try:
        from app.services.notification_service import create_notification
        from app.schemas.notification import NotificationCreate
        notif = NotificationCreate(**notification_data)
        result = create_notification(db, notif)
        return {"id": result.id, "title": result.title}
    except Exception as e:
        print(f"✗ Error in create_notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/mark-all-read", response_model=dict)
def mark_all_read_endpoint(db: Session = Depends(get_db)):
    """Mark ALL unread notifications as read"""
    print(f"🔔 PATCH /mark-all-read called")
    try:
        from app.services.notification_service import mark_all_read
        count = mark_all_read(db)
        return {"marked_as_read": count}
    except Exception as e:
        print(f"✗ Error in mark_all_read: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{notification_id}/read", response_model=dict)
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark single notification as read"""
    print(f"🔔 PATCH /{notification_id}/read called")
    try:
        from app.services.notification_service import mark_notification_read
        notif = mark_notification_read(db, notification_id)
        if notif is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True, "id": notification_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Error in mark_read: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{notification_id}", response_model=dict)
def delete_notification_endpoint(notification_id: int, db: Session = Depends(get_db)):
    """Delete single notification"""
    print(f"🔔 DELETE /{notification_id} called")
    try:
        from app.services.notification_service import delete_notification
        success = delete_notification(db, notification_id)
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Error in delete_notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/all", response_model=dict)
def delete_all_endpoint(db: Session = Depends(get_db)):
    """Delete ALL notifications"""
    print(f"🔔 DELETE /all called")
    try:
        from app.services.notification_service import delete_all
        count = delete_all(db)
        return {"deleted": count}
    except Exception as e:
        print(f"✗ Error in delete_all: {e}")
        raise HTTPException(status_code=500, detail=str(e))

print("✓ Notification module loaded successfully!")
