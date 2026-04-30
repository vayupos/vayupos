"""Restaurant settings API — GET/PUT /settings"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.models.client import Client

router = APIRouter(prefix="/settings", tags=["Settings"])


# ── Schemas ────────────────────────────────────────────────────────────────

class SettingsResponse(BaseModel):
    id: int
    restaurant_name: str
    owner_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    city: Optional[str]
    logo_url: Optional[str]
    currency_symbol: str
    bill_header: Optional[str]
    bill_footer: str
    bill_printer_type: str
    bill_paper_width: str
    bill_printer_ip: Optional[str]
    bill_printer_port: Optional[int]
    kot_printer_type: str
    kot_paper_width: str
    kot_printer_ip: Optional[str]
    kot_printer_port: Optional[int]
    is_active: bool
    trial_expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    restaurant_name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    logo_url: Optional[str] = None
    currency_symbol: Optional[str] = None
    bill_header: Optional[str] = None
    bill_footer: Optional[str] = None
    bill_printer_type: Optional[str] = None
    bill_paper_width: Optional[str] = None
    bill_printer_ip: Optional[str] = None
    bill_printer_port: Optional[int] = None
    kot_printer_type: Optional[str] = None
    kot_paper_width: Optional[str] = None
    kot_printer_ip: Optional[str] = None
    kot_printer_port: Optional[int] = None


# ── Helpers ────────────────────────────────────────────────────────────────

def _get_or_create_client(db: Session, client_id: int) -> Client:
    """Return the client row, creating it with defaults if it doesn't exist yet."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        client = Client(id=client_id)
        db.add(client)
        db.commit()
        db.refresh(client)
    return client


# ── Routes ─────────────────────────────────────────────────────────────────

@router.get("", response_model=SettingsResponse)
def get_settings(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current restaurant's settings (creates row with defaults on first call)."""
    client_id = int(current_user["client_id"])
    return _get_or_create_client(db, client_id)


@router.put("", response_model=SettingsResponse)
def update_settings(
    payload: SettingsUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current restaurant's settings."""
    client_id = int(current_user["client_id"])
    client = _get_or_create_client(db, client_id)

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(client, field, value)

    client.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(client)
    return client
