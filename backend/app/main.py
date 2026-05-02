from contextlib import asynccontextmanager
from pathlib import Path
import os
import subprocess
import sys

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import init_db, get_db
from app.api.v1 import (
    auth, users, products, categories,
    customers, orders, inventory, payment, reports,
    coupons, dish_templates, upload, staff, expense, notification, search, ingredient, kot,
    settings as settings_router, admin as admin_router,
    superadmin as superadmin_router,
)

settings = get_settings()


# -------------------- LIFESPAN --------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[INFO] Starting application startup sequence...")
    try:
        backend_dir = Path(__file__).parent.parent
        env = os.environ.copy()
        env["PYTHONPATH"] = str(backend_dir)

        print("[INFO] Running database migrations...")
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=str(backend_dir),
            env=env,
            capture_output=False,
        )

        if result.returncode == 0:
            print("[OK] Database migrations completed")
        else:
            print(f"[WARN] Migration process exited with code {result.returncode}")

    except Exception as e:
        print(f"[ERR] Could not run migrations: {str(e)}")

    try:
        init_db()
        print("[OK] Database initialized")
    except Exception as e:
        print(f"[ERR] Could not initialize database: {str(e)}")
        print("[OK] Starting application anyway (tables may already exist)")

    yield


# -------------------- APP INIT --------------------
app = FastAPI(
    title=settings.app_name,
    description="Point of Sale System Backend API",
    version=settings.app_version,
    redirect_slashes=True,
    lifespan=lifespan,
)

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
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


# -------------------- HEALTH CHECK --------------------
@app.get("/")
async def root():
    return {"status": "VayuPOS Backend Live"}


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
app.include_router(expense.router, prefix="/api/v1", tags=["Expense"])
app.include_router(ingredient.router, prefix="/api/v1/ingredients", tags=["Ingredients"])
app.include_router(notification.router, prefix="/api/v1", tags=["Notifications"])
app.include_router(search.router, prefix="/api/v1", tags=["Search"])
app.include_router(kot.router, prefix="/api/v1", tags=["KOT"])
app.include_router(settings_router.router, prefix="/api/v1", tags=["Settings"])
app.include_router(admin_router.router, prefix="/api/v1", tags=["Admin"])
app.include_router(superadmin_router.router, prefix="/api/v1", tags=["Superadmin"])
