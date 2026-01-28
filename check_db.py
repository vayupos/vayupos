
from app.core.database import SessionLocal
from app.models.notification import Notification
from app.models.order import Order

def check_notifications():
    db = SessionLocal()
    try:
        notifications = db.query(Notification).order_by(Notification.created_at.desc()).limit(5).all()
        print(f"Total notifications: {db.query(Notification).count()}")
        for n in notifications:
            print(f"ID: {n.id}, Title: {n.title}, Created: {n.created_at}, Is Read: {n.is_read}")
            
        orders = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
        print(f"\nTotal orders: {db.query(Order).count()}")
        for o in orders:
            print(f"ID: {o.id}, Order#: {o.order_number}, Total: {o.total}, Created: {o.created_at}")
    finally:
        db.close()

if __name__ == "__main__":
    check_notifications()
