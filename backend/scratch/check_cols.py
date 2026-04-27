import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(".env")
db_url = os.getenv("DATABASE_URL")
sync_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(sync_url)

TABLES = [
    "users",
    "categories",
    "products",
    "customers",
    "orders",
]

def check_columns():
    with engine.connect() as conn:
        for table in TABLES:
            try:
                result = conn.execute(text(f"SELECT client_id FROM {table} LIMIT 1"))
                print(f"Table '{table}' has client_id column.")
            except Exception:
                print(f"Table '{table}' does NOT have client_id column.")

if __name__ == "__main__":
    check_columns()
