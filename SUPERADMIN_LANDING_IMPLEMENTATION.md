# IMPLEMENTATION GUIDE: Landing Page + Superadmin Portal
## Complete Step-by-Step Specifications for System 1 + System 2

**Target Launch:** April 30, 2026  
**Estimated Effort:** 5-6 days (with System 3 multi-tenancy working)  
**Priority:** CRITICAL FOR BETA

---

# PHASE 1: DATABASE SCHEMA

## 1.1 Create Database Tables

### Table 1: leads (Contact Form Submissions)

```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    plan VARCHAR(50) DEFAULT 'Basic', -- Basic, Pro, Enterprise
    message TEXT,
    status VARCHAR(50) DEFAULT 'NEW', 
    -- Statuses: NEW, CONTACTED, DEMO_SCHEDULED, DEMO_SHOWN, FOLLOW_UP, READY_TO_PAY, ONBOARDING, ACTIVE, REJECTED, CHURNED
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
```

### Table 2: trial_accounts (Free Trial OTP Verification)

```sql
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
    -- Statuses: OTP_PENDING, VERIFIED, ACCOUNT_CREATED, EXPIRED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trial_phone ON trial_accounts(phone);
CREATE INDEX idx_trial_email ON trial_accounts(email);
CREATE INDEX idx_trial_status ON trial_accounts(status);
```

### Table 3: communication_log (Superadmin Lead Interactions)

```sql
CREATE TABLE communication_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, 
    -- Actions: CALL, EMAIL, VISIT, STATUS_CHANGE, NOTE_ADDED, DEMO_SCHEDULED, DEMO_GIVEN, ASSIGNED
    notes TEXT,
    status_change_from VARCHAR(50),
    status_change_to VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comm_lead ON communication_log(lead_id);
CREATE INDEX idx_comm_user ON communication_log(user_id);
CREATE INDEX idx_comm_created ON communication_log(created_at);
```

### Table 4: onboarding (Document Verification & Account Creation)

```sql
CREATE TABLE onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
    onboarding_link UUID UNIQUE DEFAULT gen_random_uuid(),
    link_expires_at TIMESTAMPTZ,
    step VARCHAR(50) DEFAULT 'DETAILS',
    -- Steps: DETAILS, DOCUMENTS, PAYMENT, VERIFIED
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
```

### Table 5: customers (Converted Leads - Paying Restaurants)

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_id UUID UNIQUE NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    org_code VARCHAR(20) UNIQUE NOT NULL, -- VAYU-HYD-00001
    restaurant_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    gstin VARCHAR(20),
    fssai_number VARCHAR(20),
    logo_url TEXT,
    plan VARCHAR(50) DEFAULT 'Basic', -- Basic, Pro, Enterprise
    status VARCHAR(50) DEFAULT 'ACTIVE',
    -- Statuses: TRIAL, ACTIVE, SUSPENDED, CANCELLED
    trial_ends_at TIMESTAMPTZ,
    subscription_started_at TIMESTAMPTZ,
    next_billing_date DATE,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, yearly
    amount_per_cycle INTEGER, -- in paise
    relationship_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    health_score VARCHAR(20), -- GREEN, YELLOW, RED
    last_login TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_plan ON customers(plan);
CREATE INDEX idx_customers_city ON customers(city);
```

### Table 6: subscriptions (Module Access Control)

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    -- Modules: POS, KOT, STOCK, REPORTS, CUSTOMERS, EXPENSES, COUPONS
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
```

### Table 7: payments (Payment Tracking - Phase 2 with Razorpay)

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- in paise
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED, REFUNDED
    payment_method VARCHAR(50), -- manual, razorpay, bank_transfer
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    invoice_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### Modify: users table (Add Superadmin Roles)

```sql
-- If NOT already done:
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
-- Roles: user, owner, cashier, waiter, chef, manager, salesperson, superadmin, admin

ALTER TABLE users ADD COLUMN phone VARCHAR(15);
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
```

---

# PHASE 2: BACKEND IMPLEMENTATION (FastAPI)

## 2.1 New Alembic Migration File

**File:** `backend/alembic/versions/001_add_superadmin_tables.py`

```python
"""Add superadmin and landing page tables"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Create leads table
    op.create_table(
        'leads',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('restaurant_name', sa.String(200), nullable=False),
        sa.Column('owner_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(15), nullable=False, unique=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('plan', sa.String(50), server_default='Basic'),
        sa.Column('message', sa.Text()),
        sa.Column('status', sa.String(50), server_default='NEW'),
        sa.Column('assigned_to_user_id', postgresql.UUID(as_uuid=True)),
        sa.Column('follow_up_date', sa.Date()),
        sa.Column('rejection_reason', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assigned_to_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_leads_status', 'leads', ['status'])
    op.create_index('idx_leads_assigned_to', 'leads', ['assigned_to_user_id'])
    op.create_index('idx_leads_city', 'leads', ['city'])

    # Create trial_accounts table
    op.create_table(
        'trial_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('owner_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(15), nullable=False, unique=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('otp_code', sa.String(6)),
        sa.Column('otp_attempts', sa.Integer(), server_default='0'),
        sa.Column('otp_max_attempts', sa.Integer(), server_default='3'),
        sa.Column('otp_verified', sa.Boolean(), server_default='false'),
        sa.Column('otp_expires_at', sa.DateTime(timezone=True)),
        sa.Column('otp_verified_at', sa.DateTime(timezone=True)),
        sa.Column('trial_user_id', postgresql.UUID(as_uuid=True)),
        sa.Column('trial_starts_at', sa.DateTime(timezone=True)),
        sa.Column('trial_expires_at', sa.DateTime(timezone=True)),
        sa.Column('status', sa.String(50), server_default='OTP_PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['trial_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_trial_phone', 'trial_accounts', ['phone'])
    op.create_index('idx_trial_email', 'trial_accounts', ['email'])

    # Create communication_log table
    op.create_table(
        'communication_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('notes', sa.Text()),
        sa.Column('status_change_from', sa.String(50)),
        sa.Column('status_change_to', sa.String(50)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_comm_lead', 'communication_log', ['lead_id'])

    # Create onboarding table
    op.create_table(
        'onboarding',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('onboarding_link', postgresql.UUID(as_uuid=True), unique=True),
        sa.Column('link_expires_at', sa.DateTime(timezone=True)),
        sa.Column('step', sa.String(50), server_default='DETAILS'),
        sa.Column('restaurant_details_filled', sa.Boolean(), server_default='false'),
        sa.Column('owner_id_url', sa.Text()),
        sa.Column('gst_cert_url', sa.Text()),
        sa.Column('fssai_cert_url', sa.Text()),
        sa.Column('documents_submitted_at', sa.DateTime(timezone=True)),
        sa.Column('documents_verified', sa.Boolean(), server_default='false'),
        sa.Column('documents_verified_by', postgresql.UUID(as_uuid=True)),
        sa.Column('documents_verified_at', sa.DateTime(timezone=True)),
        sa.Column('rejection_reason', sa.Text()),
        sa.Column('restaurant_account_created', sa.Boolean(), server_default='false'),
        sa.Column('restaurant_user_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id']),
        sa.ForeignKeyConstraint(['documents_verified_by'], ['users.id']),
        sa.ForeignKeyConstraint(['restaurant_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_onboarding_link', 'onboarding', ['onboarding_link'])

    # Create customers table
    op.create_table(
        'customers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True)),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('org_code', sa.String(20), nullable=False, unique=True),
        sa.Column('restaurant_name', sa.String(200), nullable=False),
        sa.Column('owner_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(15), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('address', sa.Text()),
        sa.Column('city', sa.String(100)),
        sa.Column('gstin', sa.String(20)),
        sa.Column('fssai_number', sa.String(20)),
        sa.Column('logo_url', sa.Text()),
        sa.Column('plan', sa.String(50), server_default='Basic'),
        sa.Column('status', sa.String(50), server_default='ACTIVE'),
        sa.Column('trial_ends_at', sa.DateTime(timezone=True)),
        sa.Column('subscription_started_at', sa.DateTime(timezone=True)),
        sa.Column('next_billing_date', sa.Date()),
        sa.Column('billing_cycle', sa.String(20), server_default='monthly'),
        sa.Column('amount_per_cycle', sa.Integer()),
        sa.Column('relationship_manager_id', postgresql.UUID(as_uuid=True)),
        sa.Column('health_score', sa.String(20)),
        sa.Column('last_login', sa.DateTime(timezone=True)),
        sa.Column('last_activity', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id']),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id']),
        sa.ForeignKeyConstraint(['relationship_manager_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_customers_status', 'customers', ['status'])
    op.create_index('idx_customers_plan', 'customers', ['plan'])

    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('module_name', sa.String(100), nullable=False),
        sa.Column('enabled', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_subscriptions_customer', 'subscriptions', ['customer_id'])

    # Create payments table
    op.create_table(
        'payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('payment_date', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(50), server_default='PENDING'),
        sa.Column('payment_method', sa.String(50)),
        sa.Column('razorpay_payment_id', sa.String(100)),
        sa.Column('razorpay_order_id', sa.String(100)),
        sa.Column('invoice_number', sa.String(50)),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_payments_customer', 'payments', ['customer_id'])
    op.create_index('idx_payments_status', 'payments', ['status'])


def downgrade():
    op.drop_index('idx_payments_status', table_name='payments')
    op.drop_index('idx_payments_customer', table_name='payments')
    op.drop_table('payments')
    op.drop_index('idx_subscriptions_customer', table_name='subscriptions')
    op.drop_table('subscriptions')
    op.drop_index('idx_customers_plan', table_name='customers')
    op.drop_index('idx_customers_status', table_name='customers')
    op.drop_table('customers')
    op.drop_index('idx_onboarding_link', table_name='onboarding')
    op.drop_table('onboarding')
    op.drop_index('idx_comm_lead', table_name='communication_log')
    op.drop_table('communication_log')
    op.drop_index('idx_trial_email', table_name='trial_accounts')
    op.drop_index('idx_trial_phone', table_name='trial_accounts')
    op.drop_table('trial_accounts')
    op.drop_index('idx_leads_city', table_name='leads')
    op.drop_index('idx_leads_assigned_to', table_name='leads')
    op.drop_index('idx_leads_status', table_name='leads')
    op.drop_table('leads')
```

**Run migration:**
```bash
cd backend
alembic upgrade head
```

## 2.2 Backend Models (SQLAlchemy)

**File:** `backend/app/models/lead.py`

```python
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Date, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.models.user import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_name = Column(String(200), nullable=False)
    owner_name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    city = Column(String(100), nullable=False)
    plan = Column(String(50), default="Basic")  # Basic, Pro, Enterprise
    message = Column(Text)
    status = Column(String(50), default="NEW")
    assigned_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    follow_up_date = Column(Date)
    rejection_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id])
    communication_logs = relationship("CommunicationLog", back_populates="lead", cascade="all, delete-orphan")
    onboarding = relationship("Onboarding", back_populates="lead", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "restaurant_name": self.restaurant_name,
            "owner_name": self.owner_name,
            "phone": self.phone,
            "email": self.email,
            "city": self.city,
            "plan": self.plan,
            "status": self.status,
            "assigned_to_user_id": str(self.assigned_to_user_id) if self.assigned_to_user_id else None,
            "follow_up_date": self.follow_up_date.isoformat() if self.follow_up_date else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
```

**File:** `backend/app/models/trial_account.py`

```python
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timedelta
from app.models.user import Base

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
    trial_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    trial_starts_at = Column(DateTime(timezone=True))
    trial_expires_at = Column(DateTime(timezone=True), default=lambda: datetime.utcnow() + timedelta(days=30))
    status = Column(String(50), default="OTP_PENDING")  # OTP_PENDING, VERIFIED, ACCOUNT_CREATED, EXPIRED
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
            "trial_expires_at": self.trial_expires_at.isoformat() if self.trial_expires_at else None
        }
```

**File:** `backend/app/models/communication_log.py`

```python
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.models.user import Base

class CommunicationLog(Base):
    __tablename__ = "communication_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)  # CALL, EMAIL, VISIT, STATUS_CHANGE, NOTE_ADDED, DEMO_SCHEDULED, DEMO_GIVEN, ASSIGNED
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
            "user_name": self.user.username if self.user else None,
            "action": self.action,
            "notes": self.notes,
            "status_change_from": self.status_change_from,
            "status_change_to": self.status_change_to,
            "created_at": self.created_at.isoformat()
        }
```

**File:** `backend/app/models/onboarding.py`

```python
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timedelta
from app.models.user import Base

class Onboarding(Base):
    __tablename__ = "onboarding"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False, unique=True)
    onboarding_link = Column(UUID(as_uuid=True), unique=True, default=uuid.uuid4)
    link_expires_at = Column(DateTime(timezone=True), default=lambda: datetime.utcnow() + timedelta(hours=72))
    step = Column(String(50), default="DETAILS")  # DETAILS, DOCUMENTS, PAYMENT, VERIFIED
    restaurant_details_filled = Column(Boolean, default=False)
    owner_id_url = Column(Text)
    gst_cert_url = Column(Text)
    fssai_cert_url = Column(Text)
    documents_submitted_at = Column(DateTime(timezone=True))
    documents_verified = Column(Boolean, default=False)
    documents_verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    documents_verified_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)
    restaurant_account_created = Column(Boolean, default=False)
    restaurant_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    lead = relationship("Lead", back_populates="onboarding")
    verified_by = relationship("User", foreign_keys=[documents_verified_by])
    restaurant_user = relationship("User", foreign_keys=[restaurant_user_id])

    def to_dict(self):
        return {
            "id": str(self.id),
            "onboarding_link": str(self.onboarding_link),
            "link_expires_at": self.link_expires_at.isoformat() if self.link_expires_at else None,
            "step": self.step,
            "documents_verified": self.documents_verified,
            "restaurant_account_created": self.restaurant_account_created
        }
```

## 2.3 Backend API Routes

**File:** `backend/app/api/v1/landing.py` (NEW - Public APIs)

```python
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
import uuid
import random
import smtplib
from datetime import datetime, timedelta
from app.models.lead import Lead
from app.models.trial_account import TrialAccount
from app.models.user import User
from app.core.security import get_password_hash

router = APIRouter()

# ==================== SCHEMAS ====================

class LeadSubmitRequest(BaseModel):
    restaurant_name: str
    owner_name: str
    phone: str
    email: str
    city: str
    plan: str  # Basic, Pro, Enterprise
    message: str = None

class LeadSubmitResponse(BaseModel):
    status: str
    message: str
    lead_id: str

class TrialOtpRequest(BaseModel):
    owner_name: str
    phone: str
    email: str

class TrialOtpVerifyRequest(BaseModel):
    phone: str
    otp_code: str

class PricingPlan(BaseModel):
    name: str
    price: int  # in paise
    monthly_price_display: str
    features: list[str]
    popular: bool = False

# ==================== HELPER FUNCTIONS ====================

def send_otp_sms(phone: str, otp: str):
    """Send OTP via SMS (integrate with Twilio or AWS SNS)"""
    print(f"[SMS] Sending OTP {otp} to {phone}")
    # TODO: Integrate actual SMS provider
    pass

def send_otp_email(email: str, otp: str, name: str):
    """Send OTP via Email"""
    subject = "Vayu POS - Verify Your Email"
    body = f"""
    Hi {name},
    
    Your OTP for Vayu POS free trial is: {otp}
    
    This OTP will expire in 10 minutes.
    
    Best regards,
    Vayu POS Team
    """
    print(f"[EMAIL] Sending OTP to {email}")
    # TODO: Integrate email service
    pass

def send_lead_notification(lead_data: dict):
    """Notify superadmin about new lead"""
    print(f"[NOTIFICATION] New lead: {lead_data['restaurant_name']} from {lead_data['city']}")
    # TODO: Send notification to superadmin dashboard

# ==================== ENDPOINTS ====================

@router.get("/public/plans")
async def get_pricing_plans():
    """Get all available pricing plans (public endpoint)"""
    plans = [
        PricingPlan(
            name="Basic",
            price=99900,  # ₹999/month in paise
            monthly_price_display="₹999/month",
            features=["POS Billing", "KOT", "Customers", "1 Device"],
            popular=False
        ),
        PricingPlan(
            name="Pro",
            price=249900,  # ₹2,499/month in paise
            monthly_price_display="₹2,499/month",
            features=["All from Basic", "Stock Management", "Advanced Reports", "3 Devices"],
            popular=True
        ),
        PricingPlan(
            name="Enterprise",
            price=0,  # Custom pricing
            monthly_price_display="Custom",
            features=["All Features", "Unlimited Devices", "Custom Modules", "Dedicated Support"],
            popular=False
        )
    ]
    return {"plans": plans}

@router.post("/leads")
async def submit_lead(request: LeadSubmitRequest, background_tasks: BackgroundTasks):
    """Submit a lead from landing page contact form"""
    db = SessionLocal()
    try:
        # Check if phone already exists
        existing = db.execute(select(Lead).where(Lead.phone == request.phone)).scalars().first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")

        # Create lead
        lead = Lead(
            restaurant_name=request.restaurant_name,
            owner_name=request.owner_name,
            phone=request.phone,
            email=request.email,
            city=request.city,
            plan=request.plan,
            message=request.message,
            status="NEW"
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)

        # Send notification to superadmin in background
        background_tasks.add_task(send_lead_notification, lead.to_dict())

        return LeadSubmitResponse(
            status="success",
            message="Lead submitted successfully. Our team will contact you soon.",
            lead_id=str(lead.id)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.post("/trials/request-otp")
async def request_trial_otp(request: TrialOtpRequest, background_tasks: BackgroundTasks):
    """Request OTP for free trial"""
    db = SessionLocal()
    try:
        # Check if already exists
        existing = db.execute(
            select(TrialAccount).where(
                (TrialAccount.phone == request.phone) | (TrialAccount.email == request.email)
            )
        ).scalars().first()

        if existing:
            raise HTTPException(status_code=400, detail="Phone or email already registered")

        # Generate OTP
        otp = str(random.randint(100000, 999999))

        # Create trial account
        trial = TrialAccount(
            owner_name=request.owner_name,
            phone=request.phone,
            email=request.email,
            otp_code=otp,
            otp_expires_at=datetime.utcnow() + timedelta(minutes=10),
            status="OTP_PENDING"
        )
        db.add(trial)
        db.commit()

        # Send OTP in background
        background_tasks.add_task(send_otp_sms, request.phone, otp)
        background_tasks.add_task(send_otp_email, request.email, otp, request.owner_name)

        return {
            "status": "success",
            "message": "OTP sent to your phone and email",
            "trial_id": str(trial.id)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.post("/trials/verify-otp")
async def verify_trial_otp(request: TrialOtpVerifyRequest):
    """Verify OTP and create trial account"""
    db = SessionLocal()
    try:
        trial = db.execute(
            select(TrialAccount).where(TrialAccount.phone == request.phone)
        ).scalars().first()

        if not trial:
            raise HTTPException(status_code=404, detail="Trial account not found")

        if trial.otp_verified:
            raise HTTPException(status_code=400, detail="OTP already verified")

        if datetime.utcnow() > trial.otp_expires_at:
            raise HTTPException(status_code=400, detail="OTP expired")

        if trial.otp_code != request.otp_code:
            trial.otp_attempts += 1
            db.commit()
            if trial.otp_attempts >= trial.otp_max_attempts:
                raise HTTPException(status_code=400, detail="Maximum OTP attempts exceeded")
            raise HTTPException(status_code=400, detail=f"Invalid OTP. Attempts left: {trial.otp_max_attempts - trial.otp_attempts}")

        # Mark as verified
        trial.otp_verified = True
        trial.otp_verified_at = datetime.utcnow()
        trial.status = "VERIFIED"
        db.commit()

        return {
            "status": "success",
            "message": "OTP verified successfully",
            "next_step": "create_account"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
```

**File:** `backend/app/api/v1/superadmin/leads.py` (NEW - Superadmin Leads Management)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from uuid import UUID
from app.core.database import get_db
from app.models.lead import Lead
from app.models.communication_log import CommunicationLog
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/admin/leads", tags=["Superadmin - Leads"])

# ==================== SCHEMAS ====================

class LeadDetailResponse(BaseModel):
    id: str
    restaurant_name: str
    owner_name: str
    phone: str
    email: str
    city: str
    plan: str
    status: str
    assigned_to_user_id: str = None
    follow_up_date: str = None
    communication_log: list = []
    created_at: str

    class Config:
        from_attributes = True

class LeadListResponse(BaseModel):
    leads: list[LeadDetailResponse]
    total: int
    page: int
    limit: int

class LeadStatusChangeRequest(BaseModel):
    status: str
    notes: str = None

class LeadAssignRequest(BaseModel):
    assigned_to_user_id: UUID

# ==================== HELPERS ====================

def verify_superadmin(user: User):
    """Verify user is superadmin"""
    if user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Only superadmin can access this endpoint")
    return user

# ==================== ENDPOINTS ====================

@router.get("")
async def list_leads(
    status: str = None,
    city: str = None,
    plan: str = None,
    assigned_to: UUID = None,
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all leads with filtering"""
    verify_superadmin(current_user)

    query = select(Lead)
    if status:
        query = query.where(Lead.status == status)
    if city:
        query = query.where(Lead.city == city)
    if plan:
        query = query.where(Lead.plan == plan)
    if assigned_to:
        query = query.where(Lead.assigned_to_user_id == assigned_to)

    # Get total count
    total = db.execute(select(Lead)).scalars().all()
    total = len(total)

    # Get paginated results
    leads = db.execute(query.offset((page - 1) * limit).limit(limit)).scalars().all()

    return LeadListResponse(
        leads=[l.to_dict() for l in leads],
        total=total,
        page=page,
        limit=limit
    )

@router.get("/{lead_id}")
async def get_lead_detail(
    lead_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get lead detail with communication history"""
    verify_superadmin(current_user)

    lead = db.execute(select(Lead).where(Lead.id == lead_id)).scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    comm_logs = db.execute(
        select(CommunicationLog).where(CommunicationLog.lead_id == lead_id).order_by(CommunicationLog.created_at.desc())
    ).scalars().all()

    lead_dict = lead.to_dict()
    lead_dict["communication_log"] = [log.to_dict() for log in comm_logs]

    return lead_dict

@router.put("/{lead_id}/status")
async def change_lead_status(
    lead_id: UUID,
    request: LeadStatusChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change lead status and log communication"""
    verify_superadmin(current_user)

    lead = db.execute(select(Lead).where(Lead.id == lead_id)).scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_status = lead.status
    lead.status = request.status
    lead.updated_at = datetime.utcnow()

    # Log communication
    log = CommunicationLog(
        lead_id=lead_id,
        user_id=current_user.id,
        action="STATUS_CHANGE",
        notes=request.notes,
        status_change_from=old_status,
        status_change_to=request.status
    )
    db.add(log)
    db.commit()

    return {
        "status": "success",
        "message": f"Status changed from {old_status} to {request.status}",
        "lead": lead.to_dict()
    }

@router.post("/{lead_id}/assign")
async def assign_lead(
    lead_id: UUID,
    request: LeadAssignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign lead to a salesperson"""
    verify_superadmin(current_user)

    lead = db.execute(select(Lead).where(Lead.id == lead_id)).scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Verify assigned user exists
    assigned_user = db.execute(select(User).where(User.id == request.assigned_to_user_id)).scalars().first()
    if not assigned_user:
        raise HTTPException(status_code=404, detail="User not found")

    old_assigned = lead.assigned_to_user_id
    lead.assigned_to_user_id = request.assigned_to_user_id
    lead.updated_at = datetime.utcnow()

    # Log communication
    log = CommunicationLog(
        lead_id=lead_id,
        user_id=current_user.id,
        action="ASSIGNED",
        notes=f"Assigned to {assigned_user.username}"
    )
    db.add(log)
    db.commit()

    return {
        "status": "success",
        "message": f"Lead assigned to {assigned_user.username}",
        "lead": lead.to_dict()
    }

@router.post("/{lead_id}/follow-up")
async def set_follow_up(
    lead_id: UUID,
    follow_up_date: str,  # Format: YYYY-MM-DD
    notes: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set follow-up date for a lead"""
    verify_superadmin(current_user)

    lead = db.execute(select(Lead).where(Lead.id == lead_id)).scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.follow_up_date = datetime.strptime(follow_up_date, "%Y-%m-%d").date()
    lead.status = "FOLLOW_UP"
    lead.updated_at = datetime.utcnow()

    log = CommunicationLog(
        lead_id=lead_id,
        user_id=current_user.id,
        action="FOLLOW_UP",
        notes=notes or f"Follow-up scheduled for {follow_up_date}",
        status_change_to="FOLLOW_UP"
    )
    db.add(log)
    db.commit()

    return {
        "status": "success",
        "message": "Follow-up date set",
        "lead": lead.to_dict()
    }
```

## 2.4 Register Routes in Main App

**File:** `backend/app/main.py` (Add to existing app)

```python
# Add after existing router includes:
from app.api.v1 import landing
from app.api.v1.superadmin import leads

# Register public landing page routes
app.include_router(landing.router, prefix="/api/v1", tags=["Landing Page"])

# Register superadmin routes
app.include_router(leads.router, prefix="/api/v1", tags=["Superadmin"])
```

---

# PHASE 3: FRONTEND IMPLEMENTATION (React + Vite)

## 3.1 Landing Page Components

**File:** `frontend/src/pages/LandingPage.jsx` (NEW)

```jsx
import React, { useState } from 'react';
import { Mail, Phone, Zap, BarChart3, Box } from 'lucide-react';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Pricing from '../components/landing/Pricing';
import ContactFormModal from '../components/landing/ContactFormModal';
import TrialSignupModal from '../components/landing/TrialSignupModal';

export default function LandingPage() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [showTrialSignup, setShowTrialSignup] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-orange-600">Vayu POS</div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowContactForm(true)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Contact
            </button>
            <button
              onClick={() => setShowTrialSignup(true)}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero onTrialClick={() => setShowTrialSignup(true)} />

      {/* Features Section */}
      <Features />

      {/* Pricing Section */}
      <Pricing />

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Restaurant?</h2>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowTrialSignup(true)}
              className="px-8 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100"
            >
              Start Free Trial (30 Days)
            </button>
            <button
              onClick={() => setShowContactForm(true)}
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      {showContactForm && (
        <ContactFormModal onClose={() => setShowContactForm(false)} />
      )}
      {showTrialSignup && (
        <TrialSignupModal onClose={() => setShowTrialSignup(false)} />
      )}
    </div>
  );
}
```

**File:** `frontend/src/components/landing/Hero.jsx` (NEW)

```jsx
import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function Hero({ onTrialClick }) {
  return (
    <section className="relative bg-gradient-to-br from-orange-50 via-white to-gray-50 pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Smart POS for <span className="text-orange-600">Smart Restaurants</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          All-in-one billing, KOT, inventory, and reporting solution. Used by 500+ restaurants across India.
        </p>
        <div className="flex gap-4 justify-center mb-12">
          <button
            onClick={onTrialClick}
            className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            Start Free Trial <ArrowRight size={20} />
          </button>
          <button className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400">
            Watch Demo
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div>
            <div className="text-3xl font-bold text-orange-600">500+</div>
            <div className="text-gray-600">Active Restaurants</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">₹50Cr+</div>
            <div className="text-gray-600">Billed Monthly</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">99.9%</div>
            <div className="text-gray-600">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**File:** `frontend/src/components/landing/Features.jsx` (NEW)

```jsx
import React from 'react';
import { ReceiptText, Clock, Package, BarChart3, Users, Tag } from 'lucide-react';

const features = [
  {
    icon: ReceiptText,
    title: 'POS Billing',
    description: 'Fast, accurate billing. Dine-in, takeaway, delivery. Auto token numbering.'
  },
  {
    icon: Clock,
    title: 'Kitchen Order Tickets (KOT)',
    description: 'Real-time kitchen display. Track order status from cooking to serving.'
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock in real-time. Get alerts for low inventory. Reduce wastage.'
  },
  {
    icon: BarChart3,
    title: 'Smart Reports',
    description: 'Detailed sales analysis. Top selling items. Customer insights.'
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Build loyalty. Track repeat customers. Manage coupons and offers.'
  },
  {
    icon: Tag,
    title: 'Offers & Coupons',
    description: 'Create promotional coupons. Set discounts. Track coupon usage.'
  }
];

export default function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Powerful Features</h2>
        <p className="text-center text-gray-600 mb-12">Everything you need to run your restaurant efficiently</p>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
                <Icon className="text-orange-600 mb-4" size={32} />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

**File:** `frontend/src/components/landing/Pricing.jsx` (NEW)

```jsx
import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../../api/axios';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get('/public/plans');
        setPlans(response.data.plans);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Simple, Transparent Pricing</h2>
        <p className="text-center text-gray-600 mb-12">Start free. Upgrade as you grow.</p>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-8 ${
                plan.popular
                  ? 'bg-orange-600 text-white shadow-2xl scale-105'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold mb-6">{plan.monthly_price_display}</div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check size={20} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-semibold ${
                  plan.popular
                    ? 'bg-white text-orange-600 hover:bg-gray-100'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**File:** `frontend/src/components/landing/ContactFormModal.jsx` (NEW)

```jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api/axios';

export default function ContactFormModal({ onClose }) {
  const [formData, setFormData] = useState({
    restaurant_name: '',
    owner_name: '',
    phone: '',
    email: '',
    city: '',
    plan: 'Basic',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leads', formData);
      setSuccess(true);
      setTimeout(onClose, 3000);
    } catch (error) {
      alert('Error submitting lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-green-600">✓ Success!</h2>
          <p className="text-gray-600 mb-4">Your inquiry has been submitted. Our team will contact you soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Contact Us</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              name="restaurant_name"
              value={formData.restaurant_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
            <input
              type="text"
              name="owner_name"
              value={formData.owner_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            >
              <option>Basic</option>
              <option>Pro</option>
              <option>Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**File:** `frontend/src/components/landing/TrialSignupModal.jsx` (NEW)

```jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api/axios';
import TrialOtpVerify from './TrialOtpVerify';

export default function TrialSignupModal({ onClose }) {
  const [step, setStep] = useState('signup'); // signup, otp_verify, success
  const [formData, setFormData] = useState({
    owner_name: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [trialId, setTrialId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/trials/request-otp', formData);
      setTrialId(response.data.trial_id);
      setStep('otp_verify');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error requesting OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = () => {
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-3xl font-bold mb-4 text-green-600">🎉 Welcome!</h2>
          <p className="text-gray-600 mb-4">Your trial account is active for 30 days.</p>
          <p className="text-sm text-gray-500 mb-6">Login credentials have been sent to your email.</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (step === 'otp_verify') {
    return (
      <TrialOtpVerify
        phone={formData.phone}
        onClose={onClose}
        onVerified={handleOtpVerified}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Start Your Free Trial</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-600 mb-6">30 days free. No credit card required.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              name="owner_name"
              value={formData.owner_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**File:** `frontend/src/components/landing/TrialOtpVerify.jsx` (NEW)

```jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api/axios';

export default function TrialOtpVerify({ phone, onClose, onVerified }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/trials/verify-otp', {
        phone,
        otp_code: otp
      });
      onVerified();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Verify OTP</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-600 mb-6">Enter the OTP sent to {phone}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OTP (6 digits)</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              required
              className="w-full px-4 py-2 text-center text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 tracking-widest"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## 3.2 Superadmin Pages

**File:** `frontend/src/pages/admin/LoginPage.jsx` (NEW - Superadmin login)

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/admin/auth/login', credentials);
      localStorage.setItem('superadmin_token', response.data.access_token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Vayu POS Admin</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**(Continue with Superadmin Dashboard, Leads List, Lead Detail pages...)**

---

# PHASE 4: IMPLEMENTATION TIMELINE

## Day 1: Database + Backend Setup
- [ ] Create and run alembic migration
- [ ] Create all SQLAlchemy models
- [ ] Create landing page APIs (leads, trials, OTP)
- [ ] Create superadmin leads APIs
- [ ] Test all APIs with Postman

## Day 2: Landing Page Frontend
- [ ] Build landing page components
- [ ] Create contact form + trial signup modals
- [ ] Connect to backend APIs
- [ ] Test end-to-end: form submission → email notifications

## Day 3: Superadmin Frontend
- [ ] Build superadmin login page
- [ ] Build leads list page with filtering
- [ ] Build lead detail page with communication log
- [ ] Create modals for status change, assign, follow-up

## Day 4: Integration + Testing
- [ ] Test multi-tenancy isolation
- [ ] Test OTP flow
- [ ] Test lead creation and superadmin access
- [ ] Bug fixes and polish

## Day 5-6: Deployment + Documentation
- [ ] Deploy to AWS/Cloudflare
- [ ] Create user documentation
- [ ] Test with 5 beta restaurants

---

# NEXT STEPS

1. **Create the alembic migration** and run it on your local database
2. **Create the SQLAlchemy models** in appropriate files
3. **Create the FastAPI routes** for landing page and superadmin
4. **Build the React components** for landing page and superadmin
5. **Test end-to-end** before beta launch

Should I provide:
- [ ] Full superadmin dashboard page code?
- [ ] Complete API testing examples (curl commands)?
- [ ] Email/SMS integration examples?
- [ ] Docker setup for quick deployment?

---

*Document Complete: System 1 + System 2 Implementation*  
*Ready to Implement: April 22, 2026*
