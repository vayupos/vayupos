import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv('backend/.env')

db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith('postgresql+asyncpg://'):
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://', 1)

def fix_expenses_table():
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Add updated_at column to expenses table
        print("Checking if updated_at exists in expenses...")
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='expenses' AND column_name='updated_at'")
        if not cur.fetchone():
            print("Adding updated_at to expenses...")
            cur.execute("ALTER TABLE expenses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
            print("Successfully added updated_at to expenses.")
        else:
            print("updated_at already exists in expenses.")
            
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_expenses_table()
