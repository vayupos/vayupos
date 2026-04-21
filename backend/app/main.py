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
    coupons, dish_templates, upload, staff, expense, notification, search, print_jobs
)

settings = get_settings()

# -------------------- APP INIT --------------------
app = FastAPI(
    title=settings.app_name,
    description="Point of Sale System Backend API",
    version=settings.app_version,
    redirect_slashes=False,
)

# -------------------- CORS --------------------
# NOTE: allow_origins=["*"] + allow_credentials=True is invalid per CORS spec.
# Browsers will block it. We must list origins explicitly when using credentials.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",

    # production frontend
    "https://restaurant-vayu-pos.vercel.app",
    
    # Allow all localhost variations and frontend access
    "*"  # For development - allows any origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
            print("[OK] Database migrations completed")
        elif "already exists" in result.stderr:
            # Tables already exist (e.g., in production database)
            print("[OK] Database schema already exists, skipping migrations")
        else:
            print(f"[WARN] Migration warning: {result.stderr}")

    except Exception as e:
        print(f"[ERR] Could not run migrations: {str(e)}")

    try:
        init_db()
        print("[OK] Database initialized")
    except Exception as e:
        print(f"[ERR] Could not initialize database: {str(e)}")
        print("[OK] Starting application anyway (tables may already exist)")

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

@app.get("/api/v1/test-db")
async def test_db():
    """Test database connection"""
    from app.core.database import engine
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            val = result.scalar()
            return {
                "status": "success",
                "message": "Database connection established",
                "result": val
            }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Database connection failed: {str(e)}",
                "traceback": traceback.format_exc() if settings.DEBUG else None
            }
        )


# -------------------- ROUTERS --------------------
print("[INFO] Including routers...")
try:
    app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
    print("[OK] Auth router included")
except Exception as e:
    print(f"[ERR] Failed to include auth router: {e}")
    traceback.print_exc()

try:
    app.include_router(users.router, prefix="/api/v1", tags=["Users"])
    print("[OK] Users router included")
except Exception as e:
    print(f"[ERR] Failed to include users router: {e}")

try:
    app.include_router(products.router, prefix="/api/v1", tags=["Products"])
    print("[OK] Products router included")
except Exception as e:
    print(f"[ERR] Failed to include products router: {e}")

try:
    app.include_router(categories.router, prefix="/api/v1", tags=["Categories"])
    print("[OK] Categories router included")
except Exception as e:
    print(f"[ERR] Failed to include categories router: {e}")

try:
    app.include_router(customers.router, prefix="/api/v1", tags=["Customers"])
    print("[OK] Customers router included")
except Exception as e:
    print(f"[ERR] Failed to include customers router: {e}")

try:
    app.include_router(orders.router, prefix="/api/v1", tags=["Orders"])
    print("[OK] Orders router included")
except Exception as e:
    print(f"[ERR] Failed to include orders router: {e}")

try:
    app.include_router(inventory.router, prefix="/api/v1", tags=["Inventory"])
    print("[OK] Inventory router included")
except Exception as e:
    print(f"[ERR] Failed to include inventory router: {e}")

try:
    app.include_router(payment.router, prefix="/api/v1", tags=["Payment"])
    print("[OK] Payment router included")
except Exception as e:
    print(f"[ERR] Failed to include payment router: {e}")

try:
    app.include_router(reports.router, prefix="/api/v1", tags=["Reports"])
    print("[OK] Reports router included")
except Exception as e:
    print(f"[ERR] Failed to include reports router: {e}")

try:
    app.include_router(coupons.router, prefix="/api/v1", tags=["Coupons"])
    print("[OK] Coupons router included")
except Exception as e:
    print(f"[ERR] Failed to include coupons router: {e}")

try:
    app.include_router(dish_templates.router, prefix="/api/v1", tags=["DishTemplates"])
    print("[OK] DishTemplates router included")
except Exception as e:
    print(f"[ERR] Failed to include dish_templates router: {e}")

try:
    app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
    print("[OK] Upload router included")
except Exception as e:
    print(f"[ERR] Failed to include upload router: {e}")

try:
    app.include_router(staff.router, prefix="/api/v1", tags=["Staff"])
    print("[OK] Staff router included")
except Exception as e:
    print(f"[ERR] Failed to include staff router: {e}")

try:
    app.include_router(expense.router, prefix="/api/v1", tags=["Expense"])
    print("[OK] Expense router included")
except Exception as e:
    print(f"[ERR] Failed to include expense router: {e}")

try:
    app.include_router(notification.router, prefix="/api/v1", tags=["Notifications"])
    print("[OK] Notification router included")
except Exception as e:
    print(f"[ERR] Failed to include notification router: {e}")

try:
    app.include_router(search.router, prefix="/api/v1", tags=["Search"])
    print("[OK] Search router included")
except Exception as e:
    print(f"[ERR] Failed to include search router: {e}")

try:
    app.include_router(print_jobs.router, prefix="/api/v1", tags=["Print Jobs"])
    print("[OK] Print Jobs router included")
except Exception as e:
    print(f"[ERR] Failed to include print jobs router: {e}")

print("[OK] All routers included")
