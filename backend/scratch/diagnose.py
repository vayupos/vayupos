import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(".env")
db_url = os.getenv("DATABASE_URL")
sync_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(sync_url)

def diagnose():
    with engine.connect() as conn:
        print("--- USER ACCOUNTS ---")
        users = conn.execute(text("SELECT id, username, client_id FROM users ORDER BY id DESC LIMIT 5")).fetchall()
        for u in users:
            print(f"User: {u.username} (ID: {u.id}), Client ID: {u.client_id}")
            
        print("\n--- STAFF DATA ---")
        staff = conn.execute(text("SELECT id, name, client_id FROM staff LIMIT 5")).fetchall()
        for s in staff:
            print(f"Staff: {s.name}, Client ID: {s.client_id}")
            
        print("\n--- CUSTOMER DATA ---")
        cust = conn.execute(text("SELECT id, first_name, client_id FROM customers LIMIT 5")).fetchall()
        for c in cust:
            print(f"Customer: {c.first_name}, Client ID: {c.client_id}")

        print("\n--- PRODUCT DATA ---")
        prod = conn.execute(text("SELECT id, name, client_id FROM products LIMIT 5")).fetchall()
        for p in prod:
            print(f"Product: {p.name}, Client ID: {p.client_id}")

if __name__ == "__main__":
    diagnose()
