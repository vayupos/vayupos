import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(".env")
db_url = os.getenv("DATABASE_URL")
sync_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(sync_url)

TABLES_TO_FIX = [
    "categories", "products", "customers", "orders", 
    "order_items", "payments", "inventory_logs", "notifications",
    "coupons", "coupon_categories", "dish_templates", "expenses",
    "order_coupons", "staff"
]

def fix_database():
    with engine.connect() as conn:
        for table in TABLES_TO_FIX:
            # Check if table exists
            check_table = conn.execute(text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')")).scalar()
            if not check_table:
                print(f"Skipping '{table}' (does not exist)")
                continue
                
            # Check if client_id exists
            check_col = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='client_id'")).fetchone()
            
            if not check_col:
                print(f"Adding client_id to '{table}'...")
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN client_id INTEGER"))
                conn.execute(text(f"UPDATE {table} SET client_id = 1 WHERE client_id IS NULL"))
                conn.execute(text(f"ALTER TABLE {table} ALTER COLUMN client_id SET NOT NULL"))
                conn.execute(text(f"CREATE INDEX ix_{table}_client_id ON {table} (client_id)"))
                print(f"Fixed '{table}'")
            else:
                print(f"'{table}' already has client_id.")
        
        conn.commit()
        print("\nDatabase repair completed successfully.")

if __name__ == "__main__":
    fix_database()
