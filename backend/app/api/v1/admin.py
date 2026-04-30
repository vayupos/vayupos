"""Admin-only endpoints — protected by X-Admin-Key header."""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.config import get_settings
from app.core.security import hash_password
from app.models.client import Client
from app.models.user import User, UserRole

router = APIRouter(prefix="/admin", tags=["Admin"])
settings = get_settings()


# ── Auth guard ─────────────────────────────────────────────────────────────

def verify_admin_key(x_admin_key: str = Header(...)):
    if x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin key",
        )


# ── Schemas ────────────────────────────────────────────────────────────────

class RegisterRestaurantRequest(BaseModel):
    restaurant_name: str
    owner_name: str
    phone: str
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    username: str
    password: str
    trial_days: int = 30


class RegisterRestaurantResponse(BaseModel):
    client_id: int
    username: str
    restaurant_name: str
    trial_expires_at: datetime
    message: str


# ── Route ──────────────────────────────────────────────────────────────────

@router.post(
    "/register-restaurant",
    response_model=RegisterRestaurantResponse,
    dependencies=[Depends(verify_admin_key)],
)
def register_restaurant(
    payload: RegisterRestaurantRequest,
    db: Session = Depends(get_db),
):
    """
    Create a new restaurant client + owner user account.
    Protected by the X-Admin-Key header (set ADMIN_SECRET_KEY in .env).
    """
    normalized_username = payload.username.strip().lower()

    # Check username uniqueness
    if db.query(User).filter(func.lower(User.username) == normalized_username).first():
        raise HTTPException(status_code=409, detail="Username already taken")

    # Generate next client_id (one above current max)
    max_client_id = db.query(func.max(User.client_id)).scalar() or 0
    new_client_id = max_client_id + 1

    trial_expires_at = datetime.utcnow() + timedelta(days=payload.trial_days)

    # Create Client row
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

    # Create owner User row
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

    return RegisterRestaurantResponse(
        client_id=new_client_id,
        username=normalized_username,
        restaurant_name=payload.restaurant_name,
        trial_expires_at=trial_expires_at,
        message="Restaurant registered successfully",
    )
