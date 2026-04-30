"""Superadmin endpoints — manage all restaurants on the platform."""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_superadmin_user
from app.core.config import get_settings
from app.core.security import hash_password
from app.models.client import Client
from app.models.user import User, UserRole

router = APIRouter(prefix="/superadmin", tags=["Superadmin"])
settings = get_settings()


# ── Schemas ────────────────────────────────────────────────────────────────

class RestaurantSummary(BaseModel):
    client_id: int
    restaurant_name: str
    owner_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    city: Optional[str]
    username: str
    is_active: bool
    trial_expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class CreateRestaurantRequest(BaseModel):
    restaurant_name: str
    owner_name: str
    phone: str
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    username: str
    password: str
    trial_days: int = 30


class CreateRestaurantResponse(BaseModel):
    client_id: int
    username: str
    restaurant_name: str
    trial_expires_at: datetime
    message: str


# ── One-time setup: create the superadmin account ─────────────────────────

class SuperadminSetupRequest(BaseModel):
    email: EmailStr
    password: str
    username: str = "superadmin"


@router.post("/setup", status_code=201)
def setup_superadmin(
    payload: SuperadminSetupRequest,
    x_admin_key: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Create the superadmin user account (one-time setup).
    Protected by X-Admin-Key header.
    """
    if x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    if db.query(User).filter(User.is_superadmin == True).first():
        raise HTTPException(status_code=409, detail="Superadmin already exists")

    normalized_email    = str(payload.email).strip().lower()
    normalized_username = payload.username.strip().lower()

    if db.query(User).filter(func.lower(User.email) == normalized_email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(User).filter(func.lower(User.username) == normalized_username).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        client_id=0,
        username=normalized_username,
        email=normalized_email,
        hashed_password=hash_password(payload.password),
        full_name="VayuPOS Superadmin",
        role=UserRole.ADMIN,
        is_active=True,
        is_superadmin=True,
    )
    db.add(user)
    db.commit()
    return {"message": "Superadmin created", "username": normalized_username, "email": normalized_email}


# ── Protected routes (superadmin JWT required) ─────────────────────────────

@router.get("/restaurants", response_model=List[RestaurantSummary])
def list_restaurants(
    _: dict = Depends(get_superadmin_user),
    db: Session = Depends(get_db),
):
    """Return all registered restaurants with their owner user info."""
    clients = db.query(Client).order_by(Client.created_at.desc()).all()

    result = []
    for client in clients:
        owner = (
            db.query(User)
            .filter(User.client_id == client.id, User.is_superadmin == False)
            .order_by(User.id)
            .first()
        )
        result.append(RestaurantSummary(
            client_id=client.id,
            restaurant_name=client.restaurant_name,
            owner_name=client.owner_name,
            phone=client.phone,
            email=client.email,
            city=client.city,
            username=owner.username if owner else "—",
            is_active=client.is_active,
            trial_expires_at=client.trial_expires_at,
            created_at=client.created_at,
        ))
    return result


@router.post("/restaurants", response_model=CreateRestaurantResponse, status_code=201)
def create_restaurant(
    payload: CreateRestaurantRequest,
    _: dict = Depends(get_superadmin_user),
    db: Session = Depends(get_db),
):
    """Create a new restaurant client + owner user account."""
    normalized_username = payload.username.strip().lower()

    if db.query(User).filter(func.lower(User.username) == normalized_username).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    max_client_id = db.query(func.max(User.client_id)).scalar() or 0
    # Skip 0 (reserved for superadmin)
    new_client_id = max(max_client_id, 0) + 1

    trial_expires_at = datetime.utcnow() + timedelta(days=payload.trial_days)

    client = Client(
        id=new_client_id,
        restaurant_name=payload.restaurant_name,
        owner_name=payload.owner_name,
        phone=payload.phone,
        email=str(payload.email) if payload.email else None,
        city=payload.city,
        trial_expires_at=trial_expires_at,
    )
    db.add(client)

    user = User(
        client_id=new_client_id,
        username=normalized_username,
        email=str(payload.email) if payload.email else f"{normalized_username}@vayupos.local",
        hashed_password=hash_password(payload.password),
        full_name=payload.owner_name,
        phone_number=payload.phone,
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    db.commit()

    return CreateRestaurantResponse(
        client_id=new_client_id,
        username=normalized_username,
        restaurant_name=payload.restaurant_name,
        trial_expires_at=trial_expires_at,
        message="Restaurant created successfully",
    )


@router.patch("/restaurants/{client_id}/toggle-active")
def toggle_restaurant_active(
    client_id: int,
    _: dict = Depends(get_superadmin_user),
    db: Session = Depends(get_db),
):
    """Enable or disable a restaurant account."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    client.is_active = not client.is_active
    db.commit()
    return {"client_id": client_id, "is_active": client.is_active}
