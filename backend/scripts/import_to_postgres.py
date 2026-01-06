"""
Import JSON data to PostgreSQL production database
Run: python scripts/import_to_postgres.py

IMPORTANT: Set your DATABASE_URL environment variable to point to production PostgreSQL
Example: export DATABASE_URL="postgresql://user:pass@host/dbname"
"""
import json
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import order matters for foreign key constraints
TABLE_ORDER = [
    "users",
    "categories", 
    "products",
    "customers",
    "dish_templates",
    "coupons",
    "coupon_category",
    "orders",
    "order_items",
    "order_coupon",
    "payments",
    "inventory_logs"
]

def import_data(json_path="scripts/data_export.json"):
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        print("Set it with: export DATABASE_URL='your-production-postgres-url'")
        return
    
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    print(f"🔗 Connecting to production database...")
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"📂 Loaded data from: {json_path}\n")
    
    try:
        for table in TABLE_ORDER:
            if table not in data or not data[table]:
                print(f"⏭️  Skipping '{table}' (no data)")
                continue
            
            rows = data[table]
            columns = list(rows[0].keys())
            
            for row in rows:
                placeholders = ", ".join([f":{col}" for col in columns])
                column_names = ", ".join(columns)
                
                # Use INSERT ... ON CONFLICT DO NOTHING to avoid duplicates
                sql = text(f"""
                    INSERT INTO {table} ({column_names}) 
                    VALUES ({placeholders})
                    ON CONFLICT DO NOTHING
                """)
                
                session.execute(sql, row)
            
            session.commit()
            print(f"✅ Imported {len(rows)} rows into '{table}'")
        
        # Reset sequences for auto-increment IDs (PostgreSQL specific)
        for table in TABLE_ORDER:
            if table in data and data[table]:
                try:
                    session.execute(text(f"""
                        SELECT setval(pg_get_serial_sequence('{table}', 'id'), 
                               COALESCE((SELECT MAX(id) FROM {table}), 1))
                    """))
                except:
                    pass  # Table might not have id column
        
        session.commit()
        print("\n🎉 Data import completed successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error during import: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    import_data()
