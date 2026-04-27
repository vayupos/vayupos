import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')

db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith('postgresql+asyncpg://'):
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://', 1)

def fix_all_tables():
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # List of tables to check
        tables = ['users', 'staff', 'products', 'payments', 'orders', 'expenses', 'customers', 'coupons', 'categories']
        
        for table in tables:
            print(f"Checking {table}...")
            cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='updated_at'")
            if not cur.fetchone():
                print(f"Adding updated_at to {table}...")
                cur.execute(f"ALTER TABLE {table} ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
                print(f"Successfully added updated_at to {table}.")
            else:
                print(f"updated_at already exists in {table}.")
            
        conn.commit()
        cur.close()
        conn.close()
        print("\nAll tables checked and updated.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_all_tables()
