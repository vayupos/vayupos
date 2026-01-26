from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreate,
    NotificationUpdate,
)


class NotificationService:

    def create(self, db: Session, data: NotificationCreate) -> Notification:
        notification = Notification(
            title=data.title,
            description=data.description,
            category=data.category,
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> List[Notification]:
        return (
            db.query(Notification)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(
        self,
        db: Session,
        notification_id: int
    ) -> Optional[Notification]:
        return (
            db.query(Notification)
            .filter(Notification.id == notification_id)
            .first()
        )

    def update(
        self,
        db: Session,
        notification_id: int,
        data: NotificationUpdate
    ) -> Optional[Notification]:
        notification = self.get_by_id(db, notification_id)
        if not notification:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(notification, key, value)

        db.commit()
        db.refresh(notification)
        return notification

    def delete(self, db: Session, notification_id: int) -> bool:
        notification = self.get_by_id(db, notification_id)
        if not notification:
            return False

        db.delete(notification)
        db.commit()
        return True
