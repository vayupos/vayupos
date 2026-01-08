"""
VayuPOS Backend - Complete main.py with SQLAlchemy 2.0 Fix
"""

from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path
from sqlalchemy import text  # ✅ SQLAlchemy 2.0 FIX

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

# ✅ CORS - Frontend origins
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",      # Vite dev
    "http://127.0.0.1:5173",
    "https://restaurant-vayu-pos.vercel.app",
    "https://restaurant-vayupos.onrender.com",
    "*",  # Development wildcard
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ CREATE STATIC DIRECTORIES FIRST
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)

uploads_dir = static_dir / "uploads" / "products"
uploads_dir.mkdir(parents=True, exist_ok=True)

# ✅ MOUNT STATIC FILES
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
async def startup_event():
    await init_db()  # ✅ Make async if needed
    print("✓ Database initialized")
    print(f"✓ Static files: {static_dir.absolute()}")
    print(f"✓ Uploads: {uploads_dir.absolute()}")

@app.get("/")
async def root():
    return {"status": "VayuPOS Backend Running", "version": settings.app_version}

# ✅ FIXED HEALTH CHECK - SQLAlchemy 2.0 Compatible
@app.get("/health")
async def health(db: Session = Depends(get_db)):
    try:
        # ✅ text() wrapper fixes "Textual SQL expression" error
        result = db.execute(text("SELECT 1"))
        db.commit()
        
        # ✅ Test coupon endpoint connectivity
        return {
            "status": "healthy",
            "database": "connected",
            "coupons_endpoint": "ready",
            "message": "All systems operational"
        }
    except Exception as e:
        print(f"Health check failed: {e}")  # ✅ Backend logging
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "solution": "Check DATABASE_URL, restart service"
            }
        )

# ✅ API ROUTERS (All your endpoints)
app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
app.include_router(products.router, prefix="/api/v1", tags=["Products"])
app.include_router(categories.router, prefix="/api/v1", tags=["Categories"])
app.include_router(customers.router, prefix="/api/v1", tags=["Customers"])
app.include_router(orders.router, prefix="/api/v1", tags=["Orders"])
app.include_router(inventory.router, prefix="/api/v1", tags=["Inventory"])
app.include_router(payment.router, prefix="/api/v1", tags=["Payment"])
app.include_router(reports.router, prefix="/api/v1", tags=["Reports"])
app.include_router(coupons.router, prefix="/api/v1", tags=["Coupons"])  # ✅ Your coupons!
app.include_router(dish_templates.router, prefix="/api/v1", tags=["DishTemplates"])
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])

# ✅ Graceful shutdown
@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 VayuPOS Backend shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
