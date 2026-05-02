"""Restaurant settings API — GET/PUT /settings"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, field_validator
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
    loyalty_point_value:    float
    loyalty_earn_pct:       float
    loyalty_min_redeem_pts: int
    module_pos:       bool
    module_kot:       bool
    module_inventory: bool
    module_reports:   bool
    module_expenses:  bool
    module_staff:     bool
    module_customers: bool
    module_coupons:   bool
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
    loyalty_point_value:    Optional[float] = None
    loyalty_earn_pct:       Optional[float] = None
    loyalty_min_redeem_pts: Optional[int]   = None

    @field_validator("bill_printer_ip", "kot_printer_ip", mode="before")
    @classmethod
    def validate_printer_ip(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return v
        import ipaddress
        try:
            ipaddress.ip_address(v.strip())
        except ValueError:
            raise ValueError(f"'{v}' is not a valid IP address")
        return v.strip()

    @field_validator("bill_printer_port", "kot_printer_port", mode="before")
    @classmethod
    def validate_printer_port(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if not (1 <= int(v) <= 65535):
            raise ValueError("Port must be between 1 and 65535")
        return v


# ── Helpers ────────────────────────────────────────────────────────────────

def _get_or_create_client(db: Session, client_id: int) -> Client:
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
    client_id = int(current_user["client_id"])
    return _get_or_create_client(db, client_id)


@router.put("", response_model=SettingsResponse)
def update_settings(
    payload: SettingsUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client_id = int(current_user["client_id"])
    client = _get_or_create_client(db, client_id)

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(client, field, value)

    client.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(client)
    return client
