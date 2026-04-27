import sys
import os
sys.path.append(os.getcwd())

from app.core.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("UPDATE alembic_version SET version_num = 'a92d529183b3'"))
        conn.commit()
    print("Alembic version reset successfully.")
except Exception as e:
    print(f"Error: {e}")
