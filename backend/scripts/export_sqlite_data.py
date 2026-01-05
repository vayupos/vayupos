"""
Export SQLite data to JSON for migration to production PostgreSQL
Run: python scripts/export_sqlite_data.py
"""
import sqlite3
import json
from datetime import datetime
from decimal import Decimal

def serialize(obj):
    """Handle non-serializable types"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    return obj

def export_database(db_path="test.db", output_path="scripts/data_export.json"):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'alembic%' AND name NOT LIKE 'sqlite%';")
    tables = [row[0] for row in cursor.fetchall()]
    
    export_data = {}
    
    for table in tables:
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        export_data[table] = [
            {key: serialize(row[key]) for key in row.keys()}
            for row in rows
        ]
        print(f"Exported {len(rows)} rows from '{table}'")
    
    conn.close()
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Data exported to: {output_path}")
    print(f"📊 Tables exported: {', '.join(tables)}")

if __name__ == "__main__":
    export_database()
