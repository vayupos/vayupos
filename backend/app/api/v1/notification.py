from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.notification import Notification, NotificationCreate
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/", response_model=Notification)
def create_notification(notification: NotificationCreate, db: Session = Depends(get_db)):
    return notification_service.create_notification(db, notification)

@router.get("/", response_model=List[Notification])
def read_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    return notification_service.get_notifications(db, skip, limit, unread_only)

@router.patch("/{notification_id}/read", response_model=Notification)
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    notif = notification_service.mark_notification_read(db, notification_id)
    if notif is None:
        return {"error": "Notification not found"}
    return notif

@router.patch("/", response_model=dict)
def mark_all_read(db: Session = Depends(get_db)):
    count = notification_service.mark_all_read(db)
    return {"marked_as_read": count}

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    success = notification_service.delete_notification(db, notification_id)
    if not success:
        return {"error": "Notification not found"}
    return {"success": True}

@router.delete("/")
def delete_all(db: Session = Depends(get_db)):
    count = notification_service.delete_all(db)
    return {"deleted": count}
