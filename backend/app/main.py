from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from pathlib import Path
import subprocess
import os
import traceback

from app.core.config import get_settings
from app.core.database import init_db, get_db
from app.api.v1 import (
    auth, users, products, categories,
    customers, orders, inventory, payment, reports,
    coupons, dish_templates, upload, staff, expense, notification, search
)

settings = get_settings()

# -------------------- APP INIT --------------------
app = FastAPI(
    title=settings.app_name,
    description="Point of Sale System Backend API",
    version=settings.app_version,
    redirect_slashes=False,
)

# -------------------- CORS (FIXED) --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Temporarily allow all for deployment debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- STATIC FILES --------------------
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)

uploads_dir = static_dir / "uploads" / "products"
uploads_dir.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

# -------------------- STARTUP --------------------
@app.on_event("startup")
def startup_event():
    try:
        backend_dir = Path(__file__).parent.parent
        env = os.environ.copy()
        env["PYTHONPATH"] = str(backend_dir)

        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=str(backend_dir),
            env=env,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print("✓ Database migrations completed")
        else:
            print(f"⚠ Migration warning: {result.stderr}")

    except Exception as e:
        print(f"⚠ Could not run migrations: {str(e)}")

    init_db()
    print("✓ Database initialized")

# -------------------- ROOT --------------------
@app.get("/")
async def root():
    return {"status": "VayuPOS Backend Live"}

@app.get("/api/v1/test")
async def test_endpoint():
    """Test endpoint to verify API is working"""
    return {"message": "API is working", "timestamp": str(__import__('datetime').datetime.now())}

@app.get("/api/v1/notifications-health")
async def notifications_health():
    """Health check for notifications module"""
    try:
        from app.api.v1 import notification
        return {
            "status": "healthy",
            "notification_module": str(notification),
            "notification_router": str(notification.router),
            "router_routes": len(notification.router.routes) if hasattr(notification, 'router') else 0
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "trace": __import__('traceback').format_exc()
        }

# -------------------- HEALTH CHECK --------------------
@app.get("/health")
async def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db.commit()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
            },
        )

# -------------------- ROUTERS --------------------
print("📋 Including routers...")
try:
    app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
    print("✓ Auth router included")
except Exception as e:
    print(f"✗ Failed to include auth router: {e}")
    traceback.print_exc()

try:
    app.include_router(users.router, prefix="/api/v1", tags=["Users"])
    print("✓ Users router included")
except Exception as e:
    print(f"✗ Failed to include users router: {e}")

try:
    app.include_router(products.router, prefix="/api/v1", tags=["Products"])
    print("✓ Products router included")
except Exception as e:
    print(f"✗ Failed to include products router: {e}")

try:
    app.include_router(categories.router, prefix="/api/v1", tags=["Categories"])
    print("✓ Categories router included")
except Exception as e:
    print(f"✗ Failed to include categories router: {e}")

try:
    app.include_router(customers.router, prefix="/api/v1", tags=["Customers"])
    print("✓ Customers router included")
except Exception as e:
    print(f"✗ Failed to include customers router: {e}")

try:
    app.include_router(orders.router, prefix="/api/v1", tags=["Orders"])
    print("✓ Orders router included")
except Exception as e:
    print(f"✗ Failed to include orders router: {e}")

try:
    app.include_router(inventory.router, prefix="/api/v1", tags=["Inventory"])
    print("✓ Inventory router included")
except Exception as e:
    print(f"✗ Failed to include inventory router: {e}")

try:
    app.include_router(payment.router, prefix="/api/v1", tags=["Payment"])
    print("✓ Payment router included")
except Exception as e:
    print(f"✗ Failed to include payment router: {e}")

try:
    app.include_router(reports.router, prefix="/api/v1", tags=["Reports"])
    print("✓ Reports router included")
except Exception as e:
    print(f"✗ Failed to include reports router: {e}")

try:
    app.include_router(coupons.router, prefix="/api/v1", tags=["Coupons"])
    print("✓ Coupons router included")
except Exception as e:
    print(f"✗ Failed to include coupons router: {e}")

try:
    app.include_router(dish_templates.router, prefix="/api/v1", tags=["DishTemplates"])
    print("✓ DishTemplates router included")
except Exception as e:
    print(f"✗ Failed to include dish_templates router: {e}")

try:
    app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
    print("✓ Upload router included")
except Exception as e:
    print(f"✗ Failed to include upload router: {e}")

try:
    app.include_router(staff.router, prefix="/api/v1", tags=["Staff"])
    print("✓ Staff router included")
except Exception as e:
    print(f"✗ Failed to include staff router: {e}")

try:
    app.include_router(expense.router, prefix="/api/v1", tags=["Expense"])
    print("✓ Expense router included")
except Exception as e:
    print(f"✗ Failed to include expense router: {e}")

try:
    app.include_router(notification.router, prefix="/api/v1", tags=["Notifications"])
    print("✓ Notification router included")
except Exception as e:
    print(f"✗ Failed to include notification router: {e}")

try:
    app.include_router(search.router, prefix="/api/v1", tags=["Search"])
    print("✓ Search router included")
except Exception as e:
    print(f"✗ Failed to include search router: {e}")

print("✓ All routers included")
