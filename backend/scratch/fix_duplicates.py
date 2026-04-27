import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Try to load from .env then .env.neon
load_dotenv(".env")
db_url = os.getenv("DATABASE_URL")

if db_url:
    # Convert async URL to sync URL for this script
    sync_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    engine = create_engine(sync_url)
    
    def fix_duplicates():
        with engine.connect() as conn:
            print("Checking for duplicate phone numbers in 'users' table...")
            # Find duplicates
            result = conn.execute(text("""
                SELECT phone_number, COUNT(*) 
                FROM users 
                WHERE phone_number IS NOT NULL 
                GROUP BY phone_number 
                HAVING COUNT(*) > 1
            """))
            duplicates = result.fetchall()
            
            if not duplicates:
                print("No duplicates found in 'users' table.")
            else:
                for phone, count in duplicates:
                    print(f"Found {count} instances of phone: {phone}")
                    # Keep the one with the smallest ID, set others to NULL
                    conn.execute(text(f"""
                        UPDATE users 
                        SET phone_number = NULL 
                        WHERE phone_number = '{phone}' 
                        AND id != (SELECT MIN(id) FROM users WHERE phone_number = '{phone}')
                    """))
                    print(f"Fixed phone: {phone}")
                conn.commit()

            print("\nChecking for duplicate emails in 'users' table...")
            result = conn.execute(text("""
                SELECT email, COUNT(*) 
                FROM users 
                WHERE email IS NOT NULL 
                GROUP BY email 
                HAVING COUNT(*) > 1
            """))
            duplicates = result.fetchall()
            
            if not duplicates:
                print("No duplicate emails found.")
            else:
                for email, count in duplicates:
                    print(f"Found {count} instances of email: {email}")
                    # Append suffix to duplicates to keep them unique but distinguishable
                    conn.execute(text(f"""
                        UPDATE users 
                        SET email = email || '_dup_' || id 
                        WHERE email = '{email}' 
                        AND id != (SELECT MIN(id) FROM users WHERE email = '{email}')
                    """))
                    print(f"Fixed email: {email}")
                conn.commit()

            print("\nCleaning up completed.")

    if __name__ == "__main__":
        fix_duplicates()
else:
    print("DATABASE_URL not found in .env")
