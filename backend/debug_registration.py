#!/usr/bin/env python3
"""Test registration flow to debug the error"""
import sys
import traceback

try:
    print("1. Testing imports...")
    from app.core.database import engine, Base, SessionLocal
    from app.models.user import User, UserRole
    from app.schemas.response import UserCreate
    from app.services.auth_service import AuthService
    print("   ✓ All imports successful")
    
    print("\n2. Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("   ✓ Tables created")
    
    print("\n3. Testing UserCreate schema...")
    user_data = UserCreate(
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        phone_number="1234567890",
        role="cashier",
        password="TestPass123"
    )
    print(f"   ✓ Schema validation passed: {user_data}")
    
    print("\n4. Testing hash_password...")
    from app.core.security import hash_password
    hashed = hash_password(user_data.password)
    print(f"   ✓ Password hashed successfully")
    
    print("\n5. Testing user creation...")
    db = SessionLocal()
    try:
        user = AuthService.create_user(db, user_data)
        print(f"   ✓ User created: ID={user.id}, username={user.username}")
    finally:
        db.close()
    
    print("\n✓ All tests passed!")
    
except Exception as e:
    print(f"\n✗ Error: {type(e).__name__}: {e}")
    traceback.print_exc()
    sys.exit(1)
