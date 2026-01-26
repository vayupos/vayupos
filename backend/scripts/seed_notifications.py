#!/usr/bin/env python3
"""Seed test notifications into the database"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal, init_db
from app.models.notification import Notification
from datetime import datetime

def seed_notifications():
    """Create sample notifications"""
    init_db()
    db = SessionLocal()
    
    try:
        # Check if notifications already exist
        existing = db.query(Notification).count()
        if existing > 0:
            print(f"✓ Database already has {existing} notifications")
            return
        
        # Create sample notifications
        notifications = [
            Notification(
                title="Welcome to VayuPOS",
                description="Your notification system is now active!",
                category="system",
                is_read=False
            ),
            Notification(
                title="Order #001 Completed",
                description="Customer order has been successfully completed",
                category="order",
                is_read=False
            ),
            Notification(
                title="Inventory Low Alert",
                description="Chai stock is running low",
                category="inventory",
                is_read=False
            ),
            Notification(
                title="Payment Received",
                description="Payment of ₹500 received from Table 2",
                category="payment",
                is_read=True
            ),
        ]
        
        db.add_all(notifications)
        db.commit()
        
        print(f"✓ Successfully seeded {len(notifications)} test notifications")
        
    except Exception as e:
        print(f"✗ Error seeding notifications: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_notifications()
