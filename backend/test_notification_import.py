#!/usr/bin/env python3
"""Test if notification module can be imported"""

try:
    print("Attempting to import notification router...")
    from app.api.v1 import notification
    print(f"✓ Successfully imported notification module")
    print(f"✓ Router object: {notification.router}")
    print(f"✓ Router routes: {notification.router.routes}")
    print(f"✓ All routes:")
    for route in notification.router.routes:
        print(f"  - {route.path}: {route.methods}")
except Exception as e:
    print(f"✗ Failed to import notification module")
    print(f"✗ Error: {str(e)}")
    import traceback
    traceback.print_exc()
