import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("DATABASE_URL")
if not url:
    print("DATABASE_URL not found")
    exit(1)

# Alembic transformation
sync_url = url.replace("postgresql+asyncpg://", "postgresql://")

print(f"Testing connection to: {sync_url}")

try:
    conn = psycopg2.connect(sync_url, connect_timeout=5)
    print("Connection successful!")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
