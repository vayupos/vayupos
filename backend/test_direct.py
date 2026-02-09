#!/usr/bin/env python
import traceback
from app.core.database import SessionLocal, init_db
from app.services.auth_service import AuthService
from app.schemas.response import UserCreate

try:
    print("Initializing database...")
    init_db()
    print("Database initialized")
    
    print("\nCreating user...")
    db = SessionLocal()
    user_data = UserCreate(
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        phone_number="1234567890",
        password="TestPass123"
    )
    print(f"Schema validated: {user_data.username}")
    
    user = AuthService.create_user(db, user_data)
    print(f"User created: {user.username}")
    db.close()
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()
