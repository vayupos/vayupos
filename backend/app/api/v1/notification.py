from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.notification import NotificationService
from app.schemas.notification import (
    Notification,
    NotificationCreate,
    NotificationUpdate,
)

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)

service = NotificationService()


@router.post("/", response_model=Notification)
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db)
):
    return service.create(db, data)


@router.get("/", response_model=List[Notification])
def get_notifications(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return service.get_all(db, skip, limit)


@router.get("/{notification_id}", response_model=Notification)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = service.get_by_id(db, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.put("/{notification_id}", response_model=Notification)
def update_notification(
    notification_id: int,
    data: NotificationUpdate,
    db: Session = Depends(get_db)
):
    notification = service.update(db, notification_id, data)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    success = service.delete(db, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted successfully"}
