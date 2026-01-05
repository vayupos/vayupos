from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path  # ✅ ADD THIS

from app.core.config import get_settings
from app.core.database import init_db, get_db
from app.api.v1 import (
    auth, users, products, categories,
    customers, orders, inventory, payment, reports,
    coupons, dish_templates, upload
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Point of Sale System Backend API",
    version=settings.app_version,
)

# ✅ CORS - Add more origins for frontend
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",      # ✅ ADD THIS
    "http://127.0.0.1:3000",      # ✅ ADD THIS
    "http://localhost:5173",      # ✅ ADD THIS (Vite)
    "http://127.0.0.1:5173",      # ✅ ADD THIS
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ CREATE DIRECTORIES FIRST (before mounting)
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)

uploads_dir = static_dir / "uploads" / "products"
uploads_dir.mkdir(parents=True, exist_ok=True)

# ✅ NOW mount /static/* (after directories exist)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
def startup_event():
    init_db()
    print("✓ Database initialized")
    print(f"✓ Static files directory: {static_dir.absolute()}")  # ✅ ADD THIS
    print(f"✓ Uploads directory: {uploads_dir.absolute()}")      # ✅ ADD THIS

@app.get("/")
def root():
    return {"status": "running"}

@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:  # ✅ ADD TRY-CATCH
        db.execute("SELECT 1")
        return {"database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"database": "disconnected", "error": str(e)}
        )

# ROUTERS
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(payment.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(coupons.router, prefix="/api/v1", tags=["Coupons"])
app.include_router(dish_templates.router, prefix="/api/v1", tags=["DishTemplates"])
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])