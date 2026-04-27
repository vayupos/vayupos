from app.core.database import SessionLocal
from app.models.user import User
from app.models.customer import Customer
from app.models.staff import Staff
from sqlalchemy import func

def check_db():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        print(f"Total Users: {user_count}")
        
        users = db.query(User).all()
        for u in users:
            print(f"User: {u.username}, Client ID: {u.client_id}, Role: {u.role}")
            
        cust_count = db.query(Customer).count()
        print(f"Total Customers: {cust_count}")
        
        # Check if staff has client_id column in DB
        try:
            staff_count = db.query(Staff).count()
            print(f"Total Staff: {staff_count}")
        except Exception as e:
            print(f"Error querying Staff (maybe missing client_id column?): {e}")

    finally:
        db.close()

if __name__ == "__main__":
    check_db()
