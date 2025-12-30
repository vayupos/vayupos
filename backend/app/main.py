from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session


from app.core.config import get_settings
from app.core.database import init_db, get_db
from app.api.v1 import (
    auth, users, products, categories,
    customers, orders, inventory, payment, reports,
    coupons  # ← ADD THIS
)


settings = get_settings()


app = FastAPI(
    title=settings.app_name,
    description="Point of Sale System Backend API",
    version=settings.app_version,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()
    print("✓ Database initialized")


@app.get("/")
def root():
    return {"status": "running"}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute("SELECT 1")
    return {"database": "connected"}


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
app.include_router(coupons.router, prefix="/api/v1", tags=["Coupons"])  # ← ADD THIS
