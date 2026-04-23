# 🚀 FINAL IMPLEMENTATION PROMPT FOR ANTIGIRAVITY AI
## Landing Page + Superadmin Portal (VayuPOS System 1 & 2)

---

## 📌 EXECUTIVE SUMMARY

**Project:** VayuPOS Landing Page + Superadmin Portal  
**Timeline:** 5-6 days  
**Target Launch:** April 30, 2026 (Beta: 5 Hyderabad restaurants)  
**Repository:** https://github.com/yourrepo/VayuPos  
**Workspace:** `c:\Users\kavit\VayuPos`

**Objective:** Implement System 1 (Landing Page) and System 2 (Superadmin Portal) to manage the complete customer journey from lead generation → trial signup → document verification → restaurant account creation → multi-tenant POS access.

---

## 🏗️ SYSTEM ARCHITECTURE

### Backend Stack
- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL 16 (Neon)
- **ORM:** SQLAlchemy 2.0 (SYNC ONLY - no async)
- **Auth:** JWT (python-jose) + bcrypt
- **Migrations:** Alembic
- **Server:** Uvicorn on AWS EC2 (Mumbai, t2.micro)

### Frontend Stack
- **Framework:** React 18
- **Build:** Vite
- **Styling:** TailwindCSS
- **State:** Redux
- **Routing:** React Router v6
- **HTTP:** Axios
- **UI Components:** shadcn/ui
- **Icons:** Lucide Icons

### Database
- **URL (Dev):** `postgresql://user:password@localhost:5432/vayupos`
- **URL (Prod):** Neon PostgreSQL (connection string in ENV)
- **Migrations:** `backend/alembic/versions/`

### Deployment
- **Backend API:** http://35.154.233.168:8000/api/v1 (AWS EC2)
- **Frontend:** app.vayupos.com (Cloudflare Pages)
- **DNS:** api.vayupos.com (Cloudflare DNS proxy)

---

## 📊 DATABASE SCHEMA (COMPLETE)

### Run this Alembic migration:
```bash
cd backend
alembic upgrade head
```

### SQL Schema (if manual):

```sql
-- ===== LEADS TABLE (Contact Form Submissions) =====
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    plan VARCHAR(50) DEFAULT 'Basic',
    message TEXT,
    status VARCHAR(50) DEFAULT 'NEW',
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    follow_up_date DATE,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to_user_id);
CREATE INDEX idx_leads_city ON leads(city);
CREATE INDEX idx_leads_created ON leads(created_at);

-- ===== TRIAL_ACCOUNTS TABLE (OTP Verification) =====
CREATE TABLE trial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    otp_code VARCHAR(6),
    otp_attempts INT DEFAULT 0,
    otp_max_attempts INT DEFAULT 3,
    otp_verified BOOLEAN DEFAULT FALSE,
    otp_expires_at TIMESTAMPTZ,
    otp_verified_at TIMESTAMPTZ,
    trial_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trial_starts_at TIMESTAMPTZ,
    trial_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    status VARCHAR(50) DEFAULT 'OTP_PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_trial_phone ON trial_accounts(phone);
CREATE INDEX idx_trial_email ON trial_accounts(email);
CREATE INDEX idx_trial_status ON trial_accounts(status);

-- ===== COMMUNICATION_LOG TABLE (Lead Interactions) =====
CREATE TABLE communication_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    notes TEXT,
    status_change_from VARCHAR(50),
    status_change_to VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comm_lead ON communication_log(lead_id);
CREATE INDEX idx_comm_user ON communication_log(user_id);
CREATE INDEX idx_comm_created ON communication_log(created_at);

-- ===== ONBOARDING TABLE (Document Verification) =====
CREATE TABLE onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
    onboarding_link UUID UNIQUE DEFAULT gen_random_uuid(),
    link_expires_at TIMESTAMPTZ,
    step VARCHAR(50) DEFAULT 'DETAILS',
    restaurant_details_filled BOOLEAN DEFAULT FALSE,
    owner_id_url TEXT,
    gst_cert_url TEXT,
    fssai_cert_url TEXT,
    documents_submitted_at TIMESTAMPTZ,
    documents_verified BOOLEAN DEFAULT FALSE,
    documents_verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    documents_verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    restaurant_account_created BOOLEAN DEFAULT FALSE,
    restaurant_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_onboarding_lead ON onboarding(lead_id);
CREATE INDEX idx_onboarding_link ON onboarding(onboarding_link);

-- ===== CUSTOMERS TABLE (Converted Leads) =====
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_id UUID UNIQUE NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    org_code VARCHAR(20) UNIQUE NOT NULL,
    restaurant_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    gstin VARCHAR(20),
    fssai_number VARCHAR(20),
    logo_url TEXT,
    plan VARCHAR(50) DEFAULT 'Basic',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    trial_ends_at TIMESTAMPTZ,
    subscription_started_at TIMESTAMPTZ,
    next_billing_date DATE,
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    amount_per_cycle INTEGER,
    relationship_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    health_score VARCHAR(20),
    last_login TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_plan ON customers(plan);
CREATE INDEX idx_customers_city ON customers(city);

-- ===== SUBSCRIPTIONS TABLE (Module Access) =====
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);

-- ===== PAYMENTS TABLE (Phase 2) =====
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    invoice_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ===== ALTER USERS TABLE =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(15);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

---

## 🔧 BACKEND IMPLEMENTATION

### 1. CREATE SQLAlchemy MODELS

**File:** `backend/app/models/lead.py`
```python
from sqlalchemy import Column, String, Text, Date, DateTime, UUID, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_name = Column(String(200), nullable=False)
    owner_name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    city = Column(String(100), nullable=False)
    plan = Column(String(50), default='Basic')
    message = Column(Text)
    status = Column(String(50), default='NEW')
    assigned_to_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    follow_up_date = Column(Date)
    rejection_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    communication_logs = relationship("CommunicationLog", back_populates="lead")
    onboarding = relationship("Onboarding", uselist=False, back_populates="lead")
    customer = relationship("Customer", uselist=False, back_populates="lead")

    def to_dict(self):
        return {
            "id": str(self.id),
            "restaurant_name": self.restaurant_name,
            "owner_name": self.owner_name,
            "phone": self.phone,
            "email": self.email,
            "city": self.city,
            "plan": self.plan,
            "message": self.message,
            "status": self.status,
            "assigned_to_user_id": str(self.assigned_to_user_id) if self.assigned_to_user_id else None,
            "follow_up_date": str(self.follow_up_date) if self.follow_up_date else None,
            "rejection_reason": self.rejection_reason,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
```

**File:** `backend/app/models/trial_account.py`
```python
from sqlalchemy import Column, String, Integer, Boolean, DateTime, UUID, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid

from app.core.database import Base

class TrialAccount(Base):
    __tablename__ = "trial_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    otp_code = Column(String(6))
    otp_attempts = Column(Integer, default=0)
    otp_max_attempts = Column(Integer, default=3)
    otp_verified = Column(Boolean, default=False)
    otp_expires_at = Column(DateTime(timezone=True))
    otp_verified_at = Column(DateTime(timezone=True))
    trial_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    trial_starts_at = Column(DateTime(timezone=True))
    trial_expires_at = Column(DateTime(timezone=True), default=lambda: datetime.utcnow() + timedelta(days=30))
    status = Column(String(50), default='OTP_PENDING')
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    trial_user = relationship("User", foreign_keys=[trial_user_id])

    def to_dict(self):
        return {
            "id": str(self.id),
            "owner_name": self.owner_name,
            "phone": self.phone,
            "email": self.email,
            "otp_verified": self.otp_verified,
            "status": self.status,
            "trial_starts_at": self.trial_starts_at.isoformat() if self.trial_starts_at else None,
            "trial_expires_at": self.trial_expires_at.isoformat() if self.trial_expires_at else None,
            "created_at": self.created_at.isoformat()
        }
```

**File:** `backend/app/models/communication_log.py`
```python
from sqlalchemy import Column, String, Text, DateTime, UUID, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base

class CommunicationLog(Base):
    __tablename__ = "communication_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey('leads.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    action = Column(String(100), nullable=False)
    notes = Column(Text)
    status_change_from = Column(String(50))
    status_change_to = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    lead = relationship("Lead", back_populates="communication_logs")
    user = relationship("User")

    def to_dict(self):
        return {
            "id": str(self.id),
            "lead_id": str(self.lead_id),
            "user_id": str(self.user_id),
            "action": self.action,
            "notes": self.notes,
            "status_change_from": self.status_change_from,
            "status_change_to": self.status_change_to,
            "created_at": self.created_at.isoformat()
        }
```

**File:** `backend/app/models/onboarding.py`
```python
from sqlalchemy import Column, String, Text, Boolean, DateTime, UUID, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid

from app.core.database import Base

class Onboarding(Base):
    __tablename__ = "onboarding"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey('leads.id'), unique=True, nullable=False)
    onboarding_link = Column(UUID(as_uuid=True), unique=True, default=uuid.uuid4)
    link_expires_at = Column(DateTime(timezone=True), default=lambda: datetime.utcnow() + timedelta(days=7))
    step = Column(String(50), default='DETAILS')
    restaurant_details_filled = Column(Boolean, default=False)
    owner_id_url = Column(Text)
    gst_cert_url = Column(Text)
    fssai_cert_url = Column(Text)
    documents_submitted_at = Column(DateTime(timezone=True))
    documents_verified = Column(Boolean, default=False)
    documents_verified_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    documents_verified_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)
    restaurant_account_created = Column(Boolean, default=False)
    restaurant_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    lead = relationship("Lead", back_populates="onboarding")
    verified_by = relationship("User", foreign_keys=[documents_verified_by])
    restaurant_user = relationship("User", foreign_keys=[restaurant_user_id])

    def to_dict(self):
        return {
            "id": str(self.id),
            "lead_id": str(self.lead_id),
            "onboarding_link": str(self.onboarding_link),
            "step": self.step,
            "documents_verified": self.documents_verified,
            "rejection_reason": self.rejection_reason,
            "restaurant_account_created": self.restaurant_account_created,
            "created_at": self.created_at.isoformat()
        }
```

---

### 2. CREATE PYDANTIC SCHEMAS

**File:** `backend/app/schemas/lead.py`
```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date

class LeadCreate(BaseModel):
    restaurant_name: str
    owner_name: str
    phone: str
    email: EmailStr
    city: str
    plan: str = "Basic"
    message: Optional[str] = None

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to_user_id: Optional[str] = None
    follow_up_date: Optional[date] = None
    rejection_reason: Optional[str] = None

class LeadResponse(BaseModel):
    id: str
    restaurant_name: str
    owner_name: str
    phone: str
    email: str
    city: str
    plan: str
    status: str
    assigned_to_user_id: Optional[str]
    follow_up_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True

class TrialSignupRequest(BaseModel):
    owner_name: str
    phone: str
    email: EmailStr
    plan: str = "Basic"

class OTPVerifyRequest(BaseModel):
    phone: str
    otp_code: str

class OnboardingResponse(BaseModel):
    id: str
    onboarding_link: str
    step: str
    documents_verified: bool
    restaurant_account_created: bool
```

---

### 3. CREATE BACKEND ROUTES

**File:** `backend/app/api/v1/landing.py`
```python
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import random, string
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models import Lead, TrialAccount, User, Client
from app.schemas.lead import LeadCreate, TrialSignupRequest, OTPVerifyRequest
from app.core.security import hash_password, create_access_token
from app.core.config import settings

router = APIRouter()

@router.post("/leads")
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    """Submit contact form - create lead"""
    try:
        # Check if phone/email already exists
        existing = db.query(Lead).filter(
            (Lead.phone == lead.phone) | (Lead.email == lead.email)
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Phone or email already registered")
        
        # Create lead
        new_lead = Lead(
            restaurant_name=lead.restaurant_name,
            owner_name=lead.owner_name,
            phone=lead.phone,
            email=lead.email,
            city=lead.city,
            plan=lead.plan,
            message=lead.message,
            status="NEW"
        )
        
        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)
        
        return {
            "success": True,
            "message": "Lead created successfully",
            "lead_id": str(new_lead.id)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trials/request-otp")
def request_otp(request: TrialSignupRequest, db: Session = Depends(get_db)):
    """Send OTP to phone for trial signup"""
    try:
        # Check if already exists
        existing = db.query(TrialAccount).filter(
            (TrialAccount.phone == request.phone) | (TrialAccount.email == request.email)
        ).first()
        
        if existing and existing.otp_verified:
            raise HTTPException(status_code=400, detail="Account already registered")
        
        # Generate OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        if existing:
            # Update existing
            existing.otp_code = otp_code
            existing.otp_attempts = 0
            existing.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
            existing.status = "OTP_PENDING"
            db.commit()
        else:
            # Create new
            trial = TrialAccount(
                owner_name=request.owner_name,
                phone=request.phone,
                email=request.email,
                plan=request.plan,
                otp_code=otp_code,
                otp_expires_at=datetime.utcnow() + timedelta(minutes=10),
                status="OTP_PENDING"
            )
            db.add(trial)
            db.commit()
        
        # TODO: Send SMS via Twilio/AWS SNS
        print(f"[DEV] OTP for {request.phone}: {otp_code}")
        
        return {
            "success": True,
            "message": "OTP sent to phone",
            "otp": otp_code  # DEBUG: Remove in production
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trials/verify-otp")
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verify OTP and create trial account"""
    try:
        trial = db.query(TrialAccount).filter(TrialAccount.phone == request.phone).first()
        
        if not trial:
            raise HTTPException(status_code=400, detail="Account not found")
        
        if trial.otp_verified:
            raise HTTPException(status_code=400, detail="Already verified")
        
        if datetime.utcnow() > trial.otp_expires_at:
            raise HTTPException(status_code=400, detail="OTP expired")
        
        if trial.otp_attempts >= trial.otp_max_attempts:
            raise HTTPException(status_code=400, detail="Max attempts exceeded")
        
        if trial.otp_code != request.otp_code:
            trial.otp_attempts += 1
            db.commit()
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        # Create User account
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        user = User(
            username=request.phone,
            email=trial.email,
            hashed_password=hash_password(temp_password),
            role="owner",
            is_active=True
        )
        db.add(user)
        db.flush()
        
        # Create Client (multi-tenant)
        org_code = f"VAYU-TRIAL-{user.id.hex[:6].upper()}"
        client = Client(
            org_code=org_code,
            name=trial.owner_name,
            status="TRIAL",
            plan=trial.plan
        )
        db.add(client)
        db.flush()
        
        # Assign client to user
        user.client_id = client.id
        
        # Update trial account
        trial.otp_verified = True
        trial.otp_verified_at = datetime.utcnow()
        trial.trial_user_id = user.id
        trial.trial_starts_at = datetime.utcnow()
        trial.trial_expires_at = datetime.utcnow() + timedelta(days=30)
        trial.status = "VERIFIED"
        
        db.commit()
        
        # Generate JWT
        access_token = create_access_token(
            data={"sub": str(user.id), "client_id": str(client.id), "role": "owner"}
        )
        
        return {
            "success": True,
            "message": "OTP verified, account created",
            "token": access_token,
            "redirect": "/trial-dashboard"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/public/plans")
def get_plans():
    """Get available plans"""
    return {
        "plans": [
            {
                "name": "Basic",
                "price": 2999,
                "features": ["POS", "Basic Reports"]
            },
            {
                "name": "Pro",
                "price": 5999,
                "features": ["POS", "KOT", "Reports", "Customers"]
            },
            {
                "name": "Enterprise",
                "price": 9999,
                "features": ["All Features", "Multi-location", "Priority Support"]
            }
        ]
    }
```

**File:** `backend/app/api/v1/superadmin/leads.py`
```python
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Lead, CommunicationLog, Onboarding, User, Client, Customer, Subscription
from app.schemas.lead import LeadUpdate, LeadResponse

router = APIRouter()

@router.get("/admin/leads")
def get_leads(
    status: str = Query(None),
    city: str = Query(None),
    assigned_to: str = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all leads with optional filtering"""
    if current_user.role not in ["superadmin", "admin", "salesperson"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    query = db.query(Lead)
    
    if status:
        query = query.filter(Lead.status == status)
    if city:
        query = query.filter(Lead.city == city)
    if assigned_to:
        query = query.filter(Lead.assigned_to_user_id == uuid.UUID(assigned_to))
    
    total = query.count()
    leads = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "leads": [lead.to_dict() for lead in leads]
    }

@router.get("/admin/leads/{lead_id}")
def get_lead_detail(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get lead detail with communication history"""
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    lead = db.query(Lead).filter(Lead.id == uuid.UUID(lead_id)).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    communication_logs = db.query(CommunicationLog).filter(
        CommunicationLog.lead_id == lead.id
    ).order_by(CommunicationLog.created_at.desc()).all()
    
    onboarding = db.query(Onboarding).filter(Onboarding.lead_id == lead.id).first()
    
    return {
        "lead": lead.to_dict(),
        "communication_logs": [log.to_dict() for log in communication_logs],
        "onboarding": onboarding.to_dict() if onboarding else None
    }

@router.put("/admin/leads/{lead_id}/status")
def update_lead_status(
    lead_id: str,
    update: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update lead status"""
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    lead = db.query(Lead).filter(Lead.id == uuid.UUID(lead_id)).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    old_status = lead.status
    
    if update.status:
        lead.status = update.status
        
        # Log status change
        log = CommunicationLog(
            lead_id=lead.id,
            user_id=current_user.id,
            action="STATUS_CHANGE",
            status_change_from=old_status,
            status_change_to=update.status
        )
        db.add(log)
    
    if update.assigned_to_user_id:
        lead.assigned_to_user_id = uuid.UUID(update.assigned_to_user_id)
    
    if update.follow_up_date:
        lead.follow_up_date = update.follow_up_date
    
    if update.rejection_reason:
        lead.rejection_reason = update.rejection_reason
    
    db.commit()
    db.refresh(lead)
    
    return {
        "success": True,
        "lead": lead.to_dict()
    }

@router.post("/admin/leads/{lead_id}/onboarding-link")
def send_onboarding_link(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send onboarding link to lead"""
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    lead = db.query(Lead).filter(Lead.id == uuid.UUID(lead_id)).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check if onboarding exists
    onboarding = db.query(Onboarding).filter(Onboarding.lead_id == lead.id).first()
    if not onboarding:
        onboarding = Onboarding(lead_id=lead.id)
        db.add(onboarding)
        db.commit()
    
    # TODO: Send SMS with onboarding link
    link = f"https://app.vayupos.com/onboard/{onboarding.onboarding_link}"
    print(f"[DEV] Onboarding link for {lead.phone}: {link}")
    
    # Log action
    log = CommunicationLog(
        lead_id=lead.id,
        user_id=current_user.id,
        action="ONBOARDING_LINK_SENT",
        notes=f"Link sent to {lead.phone}"
    )
    db.add(log)
    db.commit()
    
    return {
        "success": True,
        "message": "Onboarding link sent",
        "link": link
    }

@router.put("/admin/onboarding/{onboarding_id}/approve")
def approve_documents(
    onboarding_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve onboarding documents"""
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    onboarding = db.query(Onboarding).filter(Onboarding.id == uuid.UUID(onboarding_id)).first()
    if not onboarding:
        raise HTTPException(status_code=404, detail="Onboarding not found")
    
    onboarding.documents_verified = True
    onboarding.documents_verified_by = current_user.id
    onboarding.documents_verified_at = datetime.utcnow()
    onboarding.step = "VERIFIED"
    
    # Update lead status
    lead = onboarding.lead
    lead.status = "READY_TO_PAY"
    
    # Log action
    log = CommunicationLog(
        lead_id=lead.id,
        user_id=current_user.id,
        action="DOCUMENTS_APPROVED"
    )
    db.add(log)
    db.commit()
    
    return {
        "success": True,
        "message": "Documents approved"
    }

@router.post("/admin/leads/{lead_id}/create-account")
def create_restaurant_account(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create restaurant account after approval"""
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    lead = db.query(Lead).filter(Lead.id == uuid.UUID(lead_id)).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Create Client
    org_code = f"VAYU-HYD-{str(uuid.uuid4())[:5].upper()}"
    client = Client(
        org_code=org_code,
        name=lead.restaurant_name,
        status="ACTIVE"
    )
    db.add(client)
    db.flush()
    
    # Create User
    import random, string
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    user = User(
        username=lead.phone,
        email=lead.email,
        hashed_password=hash_password(temp_password),
        role="owner",
        is_active=True,
        client_id=client.id
    )
    db.add(user)
    db.flush()
    
    # Create Customer
    customer = Customer(
        lead_id=lead.id,
        client_id=client.id,
        org_code=org_code,
        restaurant_name=lead.restaurant_name,
        owner_name=lead.owner_name,
        phone=lead.phone,
        email=lead.email,
        city=lead.city,
        plan=lead.plan,
        status="ACTIVE",
        relationship_manager_id=current_user.id
    )
    db.add(customer)
    db.flush()
    
    # Create Subscriptions based on plan
    modules = {
        "Basic": ["POS"],
        "Pro": ["POS", "KOT", "REPORTS", "CUSTOMERS"],
        "Enterprise": ["POS", "KOT", "STOCK", "REPORTS", "CUSTOMERS", "EXPENSES", "COUPONS"]
    }
    
    for module in modules.get(lead.plan, ["POS"]):
        subscription = Subscription(
            customer_id=customer.id,
            module_name=module,
            enabled=True
        )
        db.add(subscription)
    
    # Update onboarding
    onboarding = db.query(Onboarding).filter(Onboarding.lead_id == lead.id).first()
    if onboarding:
        onboarding.restaurant_account_created = True
        onboarding.restaurant_user_id = user.id
    
    # Update lead
    lead.status = "ACTIVE"
    
    # Log action
    log = CommunicationLog(
        lead_id=lead.id,
        user_id=current_user.id,
        action="ACCOUNT_CREATED",
        notes=f"Account created: {org_code}"
    )
    db.add(log)
    
    db.commit()
    
    # TODO: Send credentials via email/SMS
    print(f"[DEV] Credentials for {lead.phone}: {temp_password}")
    
    return {
        "success": True,
        "message": "Restaurant account created",
        "org_code": org_code,
        "username": lead.phone,
        "temp_password": temp_password
    }
```

---

### 4. REGISTER ROUTES IN MAIN

**File:** `backend/app/main.py` (Update)

```python
# Add these imports at top
from app.api.v1 import landing
from app.api.v1.superadmin import leads as superadmin_leads

# Add these after CORS setup:
app.include_router(landing.router, prefix="/api/v1", tags=["Landing Page"])
app.include_router(superadmin_leads.router, prefix="/api/v1", tags=["Superadmin"])
```

---

## 🎨 FRONTEND IMPLEMENTATION

### 1. LANDING PAGE COMPONENTS

**File:** `frontend/src/pages/LandingPage.jsx`
```javascript
import React, { useState } from 'react';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Pricing from '../components/landing/Pricing';
import ContactFormModal from '../components/landing/ContactFormModal';
import TrialSignupModal from '../components/landing/TrialSignupModal';

export default function LandingPage() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Hero 
        onContactClick={() => setShowContactModal(true)}
        onTrialClick={() => setShowTrialModal(true)}
      />
      <Features />
      <Pricing />
      
      {showContactModal && (
        <ContactFormModal onClose={() => setShowContactModal(false)} />
      )}
      
      {showTrialModal && (
        <TrialSignupModal onClose={() => setShowTrialModal(false)} />
      )}
    </div>
  );
}
```

**File:** `frontend/src/components/landing/Hero.jsx`
```javascript
import React from 'react';
import { ChefHat, Zap } from 'lucide-react';

export default function Hero({ onContactClick, onTrialClick }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-red-600 text-white py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ChefHat size={40} />
          <h1 className="text-5xl font-bold">VayuPOS</h1>
        </div>
        
        <h2 className="text-3xl font-bold mb-4">
          Cloud-Based POS & Restaurant Management
        </h2>
        
        <p className="text-xl text-gray-100 mb-8 max-w-2xl">
          Everything you need to manage your restaurant - POS, Billing, Kitchen Display, Orders & Reports. All in one place.
        </p>
        
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={onTrialClick}
            className="bg-white text-orange-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 flex items-center gap-2"
          >
            <Zap size={20} />
            Start Free Trial
          </button>
          
          <button
            onClick={onContactClick}
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-orange-600"
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
```

**File:** `frontend/src/components/landing/Features.jsx`
```javascript
import React from 'react';
import { ShoppingCart, TrendingUp, Users, Zap, Settings, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: ShoppingCart,
    title: 'Fast Billing',
    description: 'Speedy checkout with multiple payment options'
  },
  {
    icon: TrendingUp,
    title: 'KOT System',
    description: 'Kitchen Order Tickets for efficient order management'
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Build loyalty and track customer preferences'
  },
  {
    icon: BarChart3,
    title: 'Real-time Reports',
    description: 'Daily sales, product analytics, and insights'
  },
  {
    icon: Settings,
    title: 'Easy Setup',
    description: 'No technical knowledge required'
  },
  {
    icon: Zap,
    title: 'Multi-location',
    description: 'Manage multiple restaurants from one dashboard'
  }
];

export default function Features() {
  return (
    <div className="py-16 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Why Choose VayuPOS?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition">
                <Icon size={40} className="text-orange-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

**File:** `frontend/src/components/landing/Pricing.jsx`
```javascript
import React from 'react';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: 2999,
    features: ['POS Billing', 'Basic Reports', '1 Location', 'Email Support']
  },
  {
    name: 'Pro',
    price: 5999,
    features: ['All Basic +', 'KOT System', 'Customer Mgmt', 'Priority Support'],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 9999,
    features: ['All Pro +', 'Multi-location', 'Advanced Reports', '24/7 Support']
  }
];

export default function Pricing() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`p-8 rounded-lg border-2 ${
                plan.popular 
                  ? 'border-orange-600 bg-orange-50 relative' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-orange-600 mb-6">
                ₹{plan.price} <span className="text-sm text-gray-600">/month</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check size={20} className="text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className={`w-full py-3 rounded-lg font-bold ${
                plan.popular
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}>
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**File:** `frontend/src/components/landing/ContactFormModal.jsx`
```javascript
import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';

export default function ContactFormModal({ onClose }) {
  const [formData, setFormData] = useState({
    restaurant_name: '',
    owner_name: '',
    phone: '',
    email: '',
    city: '',
    plan: 'Pro',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/leads', formData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      alert(error.response?.data?.detail || 'Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-gray-600">Our team will contact you shortly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Contact Us</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="restaurant_name"
            placeholder="Restaurant Name"
            required
            value={formData.restaurant_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <input
            type="text"
            name="owner_name"
            placeholder="Your Name"
            required
            value={formData.owner_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <input
            type="text"
            name="city"
            placeholder="City"
            required
            value={formData.city}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <select
            name="plan"
            value={formData.plan}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="Basic">Basic</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          
          <textarea
            name="message"
            placeholder="Your Message"
            rows="3"
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          ></textarea>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**File:** `frontend/src/components/landing/TrialSignupModal.jsx`
```javascript
import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';
import TrialOtpVerify from './TrialOtpVerify';

export default function TrialSignupModal({ onClose }) {
  const [step, setStep] = useState('signup'); // signup, otp, success
  const [formData, setFormData] = useState({
    owner_name: '',
    phone: '',
    email: '',
    plan: 'Pro'
  });
  const [loading, setLoading] = useState(false);
  const [phoneSubmitted, setPhoneSubmitted] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/trials/request-otp', formData);
      setPhoneSubmitted(formData.phone);
      setStep('otp');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <TrialOtpVerify
        phone={phoneSubmitted}
        onSuccess={() => {
          onClose();
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Start Free Trial</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">Get 30 days free access. No credit card required.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="owner_name"
            placeholder="Your Name"
            required
            value={formData.owner_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <select
            name="plan"
            value={formData.plan}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="Basic">Basic - Free tier</option>
            <option value="Pro">Pro - Full features</option>
            <option value="Enterprise">Enterprise - All features</option>
          </select>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**File:** `frontend/src/components/landing/TrialOtpVerify.jsx`
```javascript
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken } from '../../redux/authSlice';

export default function TrialOtpVerify({ phone, onClose, onSuccess }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/trials/verify-otp', {
        phone,
        otp_code: otp
      });
      
      // Store token
      localStorage.setItem('token', response.data.token);
      dispatch(setToken(response.data.token));
      
      // Redirect
      setTimeout(() => {
        navigate(response.data.redirect);
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Verify OTP</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">We sent a 6-digit code to {phone}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest"
          />
          
          {error && <p className="text-red-600 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### 2. SUPERADMIN PAGES

**File:** `frontend/src/pages/admin/AdminLoginPage.jsx`
```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useDispatch } from 'react-redux';
import { setToken } from '../../redux/authSlice';

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', credentials);
      localStorage.setItem('token', response.data.access_token);
      dispatch(setToken(response.data.access_token));
      navigate('/admin/leads');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">VayuPOS Admin</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            required
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <input
            type="password"
            placeholder="Password"
            required
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          {error && <p className="text-red-600 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**File:** `frontend/src/pages/admin/LeadsListPage.jsx`
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ChevronRight, Filter } from 'lucide-react';

export default function LeadsListPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    city: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.city) params.append('city', filters.city);
      
      const response = await api.get(`/admin/leads?${params}`);
      setLeads(response.data.leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'NEW': 'bg-blue-100 text-blue-800',
      'CONTACTED': 'bg-yellow-100 text-yellow-800',
      'DEMO_SCHEDULED': 'bg-purple-100 text-purple-800',
      'DEMO_SHOWN': 'bg-green-100 text-green-800',
      'ONBOARDING': 'bg-orange-100 text-orange-800',
      'ACTIVE': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Leads Management</h1>
        
        <div className="flex gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="DEMO_SCHEDULED">Demo Scheduled</option>
            <option value="DEMO_SHOWN">Demo Shown</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="ACTIVE">Active</option>
          </select>
          
          <input
            type="text"
            placeholder="Filter by city"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold">Restaurant</th>
              <th className="px-6 py-3 text-left text-sm font-bold">Owner</th>
              <th className="px-6 py-3 text-left text-sm font-bold">City</th>
              <th className="px-6 py-3 text-left text-sm font-bold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-bold">Date</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{lead.restaurant_name}</td>
                <td className="px-6 py-4">{lead.owner_name}</td>
                <td className="px-6 py-4">{lead.city}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => navigate(`/admin/leads/${lead.id}`)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**File:** `frontend/src/pages/admin/LeadDetailPage.jsx`
```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ChevronLeft } from 'lucide-react';

export default function LeadDetailPage() {
  const { leadId } = useParams();
  const [lead, setLead] = useState(null);
  const [communicationLogs, setCommunicationLogs] = useState([]);
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeadDetail();
  }, [leadId]);

  const fetchLeadDetail = async () => {
    try {
      const response = await api.get(`/admin/leads/${leadId}`);
      setLead(response.data.lead);
      setCommunicationLogs(response.data.communication_logs || []);
      setOnboarding(response.data.onboarding);
      setNewStatus(response.data.lead.status);
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await api.put(`/admin/leads/${leadId}/status`, {
        status: newStatus
      });
      setLead({ ...lead, status: newStatus });
      setShowStatusModal(false);
      fetchLeadDetail();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleSendOnboardingLink = async () => {
    try {
      await api.post(`/admin/leads/${leadId}/onboarding-link`);
      alert('Onboarding link sent!');
      fetchLeadDetail();
    } catch (error) {
      alert('Error sending link');
    }
  };

  const handleApproveDocuments = async () => {
    if (!onboarding) return;
    try {
      await api.put(`/admin/onboarding/${onboarding.id}/approve`);
      alert('Documents approved!');
      fetchLeadDetail();
    } catch (error) {
      alert('Error approving documents');
    }
  };

  const handleCreateAccount = async () => {
    try {
      const response = await api.post(`/admin/leads/${leadId}/create-account`);
      alert(`Account created: ${response.data.org_code}\nCredentials sent to ${lead.email}`);
      fetchLeadDetail();
    } catch (error) {
      alert('Error creating account');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!lead) return <div className="p-8">Lead not found</div>;

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/admin/leads')}
        className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6"
      >
        <ChevronLeft size={20} />
        Back to Leads
      </button>
      
      <div className="grid grid-cols-3 gap-8">
        {/* Left Panel: Lead Info */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">{lead.restaurant_name}</h2>
            
            <div className="space-y-3 mb-6 text-sm">
              <div>
                <p className="text-gray-600">Owner</p>
                <p className="font-semibold">{lead.owner_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone</p>
                <p className="font-semibold">{lead.phone}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-semibold">{lead.email}</p>
              </div>
              <div>
                <p className="text-gray-600">City</p>
                <p className="font-semibold">{lead.city}</p>
              </div>
              <div>
                <p className="text-gray-600">Plan</p>
                <p className="font-semibold">{lead.plan}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-1 border rounded mt-1"
                >
                  <option>NEW</option>
                  <option>CONTACTED</option>
                  <option>DEMO_SCHEDULED</option>
                  <option>DEMO_SHOWN</option>
                  <option>FOLLOW_UP</option>
                  <option>READY_TO_PAY</option>
                  <option>ONBOARDING</option>
                  <option>ACTIVE</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handleUpdateStatus}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Update Status
              </button>
              <button
                onClick={handleSendOnboardingLink}
                className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
              >
                Send Onboarding Link
              </button>
              {onboarding?.documents_verified && (
                <button
                  onClick={handleCreateAccount}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  Create Account
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Panel: Communication Log */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-xl font-bold mb-4">Communication History</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {communicationLogs.map((log) => (
                <div key={log.id} className="border-l-4 border-orange-600 pl-4">
                  <p className="text-sm text-gray-600">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                  <p className="font-semibold text-orange-600">{log.action}</p>
                  {log.notes && <p className="text-gray-700">{log.notes}</p>}
                </div>
              ))}
            </div>
          </div>
          
          {onboarding && (
            <div className="bg-white rounded-lg p-6 shadow mt-6">
              <h3 className="text-xl font-bold mb-4">Onboarding Status</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Step:</span>
                  <span className="font-semibold">{onboarding.step}</span>
                </div>
                <div className="flex justify-between">
                  <span>Documents Verified:</span>
                  <span className="font-semibold">
                    {onboarding.documents_verified ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Account Created:</span>
                  <span className="font-semibold">
                    {onboarding.restaurant_account_created ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                
                {!onboarding.documents_verified && onboarding.owner_id_url && (
                  <div className="mt-4">
                    <button
                      onClick={handleApproveDocuments}
                      className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                      Approve Documents
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 3. UPDATE ROUTER

**File:** `frontend/src/App.jsx` (Update routes section)

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import LeadsListPage from './pages/admin/LeadsListPage';
import LeadDetailPage from './pages/admin/LeadDetailPage';
import DashboardPage from './pages/DashboardPage'; // Existing

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Superadmin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/leads" element={<LeadsListPage />} />
        <Route path="/admin/leads/:leadId" element={<LeadDetailPage />} />
        
        {/* Restaurant POS (Existing) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* ... other routes ... */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🔐 MULTI-TENANCY REQUIREMENTS

### Critical: Tenant Filtering in ALL Routes

**Template for EVERY database query in restaurant POS:**

```python
# Extract client_id from JWT
current_user = get_current_user(token)
client_id = current_user.client_id

# ALWAYS filter by client_id
query = db.query(Product).filter(Product.client_id == client_id)
```

**Template for EVERY JWT:**

```python
access_token = create_access_token(
    data={
        "sub": str(user.id),
        "client_id": str(user.client_id),  # CRITICAL
        "role": user.role
    }
)
```

---

## ✅ TESTING CHECKLIST

### Before submitting to production:

- [ ] **Landing Page loads** without errors
- [ ] **Contact form submits** → Lead created in DB with status=NEW
- [ ] **Free trial form sends OTP** via SMS (manual verification for MVP)
- [ ] **OTP verification creates** User + Client + JWT token
- [ ] **Trial user logs in** → sees POS dashboard
- [ ] **Superadmin login works** with valid credentials
- [ ] **Superadmin dashboard** shows all leads
- [ ] **Lead detail page** displays with communication history
- [ ] **Change lead status** → Communication log updated
- [ ] **Send onboarding link** → SMS with unique link
- [ ] **Owner fills onboarding form** → Documents uploaded to S3
- [ ] **Superadmin approves docs** → Lead status = ONBOARDING → READY_TO_PAY
- [ ] **Create account** → User + Client + Customer created, credentials sent
- [ ] **New owner logs in** → Can access POS with own data
- [ ] **Multi-tenancy test**: 2 restaurants see different data
- [ ] **End-to-end flow**: Contact → Trial → Lead → Account → POS

---

## 🚀 DEPLOYMENT

### 1. Database Migration
```bash
cd backend
alembic upgrade head
```

### 2. Backend Restart
```bash
docker-compose restart backend
# or
cd backend && uvicorn app.main:app --reload
```

### 3. Frontend Build
```bash
cd frontend
npm run build
```

### 4. Deploy to Cloudflare Pages
```bash
npm run build
# Push to GitHub
# Cloudflare automatically deploys from main branch
```

---

## 📞 SUPPORT & DOCUMENTATION

For detailed flows and architecture, see:
- [SYSTEM_FLOW_DIAGRAM.md](SYSTEM_FLOW_DIAGRAM.md)
- [SYSTEM_FLOW_MERMAID.md](SYSTEM_FLOW_MERMAID.md)
- [FLOW_QUICK_REFERENCE.md](FLOW_QUICK_REFERENCE.md)

---

**🎯 This prompt contains everything needed to implement Landing Page + Superadmin Portal. Copy-paste to AntiGravity AI and begin implementation!**
