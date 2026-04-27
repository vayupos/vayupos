import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(".env")
db_url = os.getenv("DATABASE_URL")
sync_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(sync_url)

ALL_TABLES = [
    "users", "categories", "products", "customers", "orders", 
    "order_items", "payments", "inventory_logs", "notifications",
    "coupons", "coupon_categories", "dish_templates", "expenses",
    "order_coupons", "staff", "password_reset_tokens"
]

def audit_tables():
    with engine.connect() as conn:
        for table in ALL_TABLES:
            # Check if table exists
            check_table = conn.execute(text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')")).scalar()
            if not check_table:
                print(f"Table '{table}' does NOT exist.")
                continue
                
            # Check if client_id exists
            check_col = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='client_id'")).fetchone()
            if check_col:
                print(f"Table '{table}' has client_id.")
            else:
                print(f"Table '{table}' MISSING client_id.")

if __name__ == "__main__":
    audit_tables()
