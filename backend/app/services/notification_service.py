from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate
from sqlalchemy import desc

def create_notification(db: Session, notification: NotificationCreate, client_id: int):
    db_notif = Notification(client_id=client_id, **notification.dict())
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

def get_notifications(db: Session, client_id: int, skip: int = 0, limit: int = 50, unread_only: bool = False):
    query = db.query(Notification).filter(Notification.client_id == client_id).order_by(desc(Notification.created_at))
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.offset(skip).limit(limit).all()

def mark_notification_read(db: Session, notification_id: int, client_id: int):
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.client_id == client_id).first()
    if notif:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
        return notif
    return None

def mark_all_read(db: Session, client_id: int):
    unread_count = db.query(Notification).filter(
        Notification.is_read == False,
        Notification.client_id == client_id
    ).update({
        Notification.is_read: True
    })
    db.commit()
    return unread_count

def delete_notification(db: Session, notification_id: int, client_id: int):
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.client_id == client_id).first()
    if notif:
        db.delete(notif)
        db.commit()
        return True
    return False

def delete_all(db: Session, client_id: int):
    count = db.query(Notification).filter(Notification.client_id == client_id).delete()
    db.commit()
    return count
