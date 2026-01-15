from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path
from sqlalchemy import text  # SQLAlchemy 2.0 fix
import subprocess
import os

from app.core.config import get_settings
from app.core.database import init_db, get_db  # init_db() is SYNC
from app.api.v1 import (
    auth, users, products, categories,
    customers, orders, inventory, payment, reports,
    coupons, dish_templates, upload, staff
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Point of Sale System Backend API",
    version=settings.app_version,
    redirect_slashes=False,  # ✅ Don't auto-redirect trailing slashes - FIXED
)

# CORS - Must be added FIRST (last in order)
cors_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://restaurant-vayu-pos.vercel.app",
    "https://restaurant-vayupos.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Static files
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)
uploads_dir = static_dir / "uploads" / "products"
uploads_dir.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

# ✅ OPTIONS handler for preflight requests
@app.options("/{full_path:path}")
async def preflight_handler(full_path: str):
    """Handle CORS preflight requests"""
    return {}

# ✅ FIXED STARTUP - NO AWAIT
@app.on_event("startup")
def startup_event():  # ✅ SYNC function
    # Run migrations
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
    
    init_db()  # ✅ SYNC call
    print("✓ Database initialized")
    print(f"✓ Static: {static_dir.absolute()}")

@app.get("/")
async def root():
    return {"status": "VayuPOS Backend Live"}

# ✅ FIXED HEALTH CHECK
@app.get("/health")
async def health(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))
        db.commit()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected", "error": str(e)}
        )

# Routers
app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
app.include_router(products.router, prefix="/api/v1", tags=["Products"])
app.include_router(categories.router, prefix="/api/v1", tags=["Categories"])
app.include_router(customers.router, prefix="/api/v1", tags=["Customers"])
app.include_router(orders.router, prefix="/api/v1", tags=["Orders"])
app.include_router(inventory.router, prefix="/api/v1", tags=["Inventory"])
app.include_router(payment.router, prefix="/api/v1", tags=["Payment"])
app.include_router(reports.router, prefix="/api/v1", tags=["Reports"])
app.include_router(coupons.router, prefix="/api/v1", tags=["Coupons"])
app.include_router(dish_templates.router, prefix="/api/v1", tags=["DishTemplates"])
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
app.include_router(staff.router, prefix="/api/v1", tags=["Staff"])
#app.include_router(expense.router, prefix="/api/v1", tags=["Expense"])