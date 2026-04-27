import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(".env")
db_url = os.getenv("DATABASE_URL")
sync_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(sync_url)

def fix_users_client_id():
    with engine.connect() as conn:
        print("Fixing users with NULL client_id...")
        # Set existing users to 1
        conn.execute(text("UPDATE users SET client_id = 1 WHERE client_id IS NULL"))
        
        # Ensure column is NOT NULL
        try:
            conn.execute(text("ALTER TABLE users ALTER COLUMN client_id SET NOT NULL"))
            print("Successfully set client_id to NOT NULL")
        except Exception as e:
            print(f"Could not set NOT NULL (maybe already set?): {e}")
            
        # Verify
        users = conn.execute(text("SELECT username, client_id FROM users")).fetchall()
        for u in users:
            print(f"User: {u.username}, Client ID: {u.client_id}")
            
        conn.commit()

if __name__ == "__main__":
    fix_users_client_id()
