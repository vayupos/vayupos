# VAYU POS — Complete Requirements Analysis
## System 1 (Landing Page) + System 2 (Superadmin) + System 3 (Restaurant POS)

**Analysis Date:** April 22, 2026  
**Status:** Pre-Implementation Planning

---

# EXECUTIVE SUMMARY

Your flow is **70% correct**, but has critical gaps:

✅ **CORRECT:**
- Landing page → Lead generation workflow
- Superadmin lead management pipeline
- Document verification flow
- Restaurant account auto-creation

⚠️ **GAPS / CHANGES NEEDED:**
- Multi-plan architecture not clearly defined (Basic/Pro/Enterprise)
- Module access control missing from flow
- No mention of Payment Gateway integration (Razorpay)
- Trial vs Paid account difference not explicit
- Superadmin dashboard analytics not detailed
- Restaurant onboarding link flow incomplete

🔴 **CRITICAL FOR BETA (April 30):**
- Landing page can be **MINIMAL** (hero + contact form only)
- Superadmin can be **MINIMAL** (leads + manual approval only)
- **Priority: Get System 3 (Restaurant POS) 100% working first**

---

# STAGE-BY-STAGE BREAKDOWN

## STAGE 1: LANDING PAGE (System 1)

### What You Need to Build:

#### 1.1 Landing Page URL: `vayupos.com`

```
Homepage Sections (Required for Beta):
├── Hero Section
│   ├── Headline: "Smart POS for Smart Restaurants"
│   ├── Subheading: "Billing, KOT, Inventory — All-in-One"
│   ├── CTA Button: "Start Free Trial" (goes to modal)
│   └── Hero Image (restaurant scene)
│
├── Key Features (Brief)
│   ├── "POS Billing in Seconds"
│   ├── "Kitchen Order Tickets (KOT)"
│   ├── "Stock Management"
│   ├── "Reports & Analytics"
│   └── Each with 1-line description
│
├── Pricing Plans (Table or Cards)
│   ├── Basic: ₹999/month
│   │   ├── POS Billing ✓
│   │   ├── KOT ✓
│   │   ├── Customers ✓
│   │   └── 1 Device
│   │
│   ├── Pro: ₹2,499/month
│   │   ├── All from Basic +
│   │   ├── Stock Management ✓
│   │   ├── Advanced Reports ✓
│   │   └── 3 Devices
│   │
│   └── Enterprise: Custom
│       └── Custom modules + pricing
│
├── Contact Form Modal
│   ├── Name (required)
│   ├── Restaurant Name (required)
│   ├── Phone (required)
│   ├── Email (required)
│   ├── City (required)
│   ├── Plan (dropdown: Basic/Pro/Enterprise)
│   ├── Message (optional)
│   └── Submit Button
│       ↓
│       POST /api/leads
│       ↓
│       Creates Lead with status: NEW
│
└── Free Trial Modal
    ├── Name (required)
    ├── Phone (required)
    ├── Email (required)
    └── "Get Free Trial" Button
        ↓
        POST /api/trials
        ↓
        Sends OTP to phone + email
        ↓
        Creates trial_account with status: TRIAL_ACTIVE
```

#### 1.2 Database Tables Needed:

```sql
-- Leads (from contact form)
CREATE TABLE leads (
    id UUID PRIMARY KEY,
    restaurant_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    plan VARCHAR(50) DEFAULT 'Basic', -- Basic/Pro/Enterprise
    message TEXT,
    status VARCHAR(50) DEFAULT 'NEW', -- NEW, CONTACTED, DEMO_SCHEDULED, DEMO_SHOWN, FOLLOW_UP, READY_TO_PAY, ONBOARDING, ACTIVE, REJECTED, CHURNED
    assigned_to_salesperson UUID, -- FK to users (superadmin only)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trial Accounts
CREATE TABLE trial_accounts (
    id UUID PRIMARY KEY,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    owner_name VARCHAR(100) NOT NULL,
    otp_code VARCHAR(6),
    otp_verified BOOLEAN DEFAULT FALSE,
    otp_expires_at TIMESTAMPTZ,
    trial_user_id UUID, -- FK to users (created after OTP verification)
    trial_starts_at TIMESTAMPTZ,
    trial_expires_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'OTP_PENDING', -- OTP_PENDING, VERIFIED, ACCOUNT_CREATED, EXPIRED
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.3 APIs Required:

```python
# Landing Page APIs

POST /api/leads
# Input: { name, restaurant_name, phone, email, city, plan, message }
# Returns: { status: "success", message: "Lead created", lead_id }
# Effect: Creates lead, sends notification to superadmin

POST /api/trials/request-otp
# Input: { name, phone, email }
# Returns: { status: "success", message: "OTP sent to phone" }
# Effect: Generates OTP, stores in trial_accounts, sends SMS + Email

POST /api/trials/verify-otp
# Input: { phone, otp_code }
# Returns: { status: "success", trial_account_id, next_step: "complete_profile" }
# Effect: If valid, creates account, generates temp password, sends email

GET /api/public/plans
# Returns: [{ name: "Basic", price: 999, features: [...] }, ...]
# Effect: Frontend loads pricing dynamically
```

#### 1.4 Frontend Structure:

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx (NEW)
│   │   ├── TrialSignup.jsx (NEW)
│   │   └── TrialOtpVerify.jsx (NEW)
│   ├── components/
│   │   ├── Hero.jsx (NEW)
│   │   ├── Features.jsx (NEW)
│   │   ├── Pricing.jsx (NEW)
│   │   ├── ContactFormModal.jsx (NEW)
│   │   └── TrialModal.jsx (NEW)
│   └── api/
│       └── landing.js (NEW)
│           ├── submitLead()
│           ├── requestTrialOtp()
│           ├── verifyTrialOtp()
│           └── getPublicPlans()
```

---

## STAGE 2: SUPERADMIN PORTAL (System 2)

### What You Need to Build:

#### 2.1 Superadmin URLs

```
Main URL: admin.vayupos.com

Routes Needed:
├── /login (superadmin login page)
├── /dashboard (shows KPIs + notifications)
├── /leads (lead management)
├── /leads/{id} (lead detail + actions)
├── /customers (converted customers/restaurants)
├── /customers/{id} (customer detail + billing history)
├── /salespeople (manage sales team)
├── /payments (payment tracking)
├── /website-settings (landing page content editor) — Phase 2
└── /reports (business analytics)
```

#### 2.2 Superadmin Login

```
URL: admin.vayupos.com/login

Who logs in?
├── Superadmin (you)
├── Sales Team Members (assigned to leads)
└── Admin Staff (operations)

Credentials stored in `users` table with role = 'superadmin' or 'salesperson'

POST /api/admin/auth/login
# Input: { username, password }
# Returns: { access_token, user: { id, name, role } }
# JWT includes: { sub, username, role: "superadmin", exp }
```

#### 2.3 Dashboard (Superadmin View)

```
URL: admin.vayupos.com/dashboard

Widgets Required:
├── New Leads Count
│   └── Data: leads where status = 'NEW'
│
├── Lead Conversion Rate
│   └── Data: (leads with status='ACTIVE' / total_leads) * 100
│
├── Revenue This Month
│   └── Data: Sum of all customers' active subscriptions * plan_price
│
├── Active Restaurants (Customers)
│   └── Data: customers with status = 'ACTIVE'
│
├── Trial to Paid Conversion
│   └── Data: (trial_accounts converted to paid) / total_trial_accounts
│
├── Recent Leads (Table)
│   ├── Columns: Name, Restaurant, City, Plan, Status, Date
│   └── Shows latest 10 leads
│
└── Recent Notifications
    ├── "New lead from Mumbai"
    ├── "Payment received from XYZ Restaurant"
    ├── "Trial expiring in 3 days: ABC Restaurant"
    └── Real-time updates
```

#### 2.4 Leads Management Page

```
URL: admin.vayupos.com/leads

Features:
├── Leads List (Table)
│   ├── Columns: Name, Restaurant, Phone, City, Plan, Status, Assigned To, Date
│   ├── Filters: Status, City, Plan, Assigned To
│   ├── Sort: By date, name, city
│   └── Actions per row:
│       ├── View Detail
│       ├── Assign to Salesperson
│       └── Delete (if NEW)
│
├── Bulk Actions
│   ├── Select multiple leads
│   ├── Bulk assign to salesperson
│   └── Bulk change status
│
└── Each Lead Card (detail view):
    ├── Status Badge: NEW / CONTACTED / DEMO_SCHEDULED / DEMO_SHOWN / FOLLOW_UP / READY_TO_PAY / ONBOARDING / ACTIVE / REJECTED
    ├── Restaurant Details
    │   ├── Owner Name
    │   ├── Restaurant Name
    │   ├── Phone + Email
    │   ├── City
    │   └── Selected Plan (Basic/Pro/Enterprise)
    │
    ├── Communication Log (Timeline)
    │   ├── All interactions logged
    │   ├── Date, time, user, action, notes
    │   └── "Add Note" button for salesperson
    │
    ├── Actions
    │   ├── [Assign to Me] — claim lead
    │   ├── [Change Status] — dropdown
    │   ├── [Schedule Demo] — date picker
    │   ├── [Start Onboarding] — creates onboarding link
    │   └── [Reject Lead] — with reason
    │
    └── Timeline Example:
        2026-04-22 10:30 — Kavit: Created lead from contact form
        2026-04-22 11:00 — Sameer (Salesperson): Claimed lead
        2026-04-22 14:30 — Sameer: Called owner, interested in Pro plan
        2026-04-22 15:00 — Sameer: Changed status to DEMO_SCHEDULED
        2026-04-23 10:00 — Sameer: Gave demo, owner asked for time
        2026-04-23 10:15 — Sameer: Changed status to FOLLOW_UP
        2026-04-23 10:16 — System: Set follow-up reminder for 2026-04-27
        2026-04-27 09:00 — System: Auto-reminder email sent to Sameer
        2026-04-27 15:30 — Sameer: Owner ready to pay
        2026-04-27 15:31 — Sameer: Clicked "Start Onboarding"
        2026-04-27 15:32 — System: Generated onboarding link, sent to owner
        2026-04-30 14:00 — Owner: Verified documents
        2026-05-01 09:00 — Kavit: Approved documents in superadmin
        2026-05-01 09:01 — System: Auto-created restaurant account
        2026-05-01 09:02 — Owner: Received email with login credentials
```

#### 2.5 Customers (Restaurants) Management

```
URL: admin.vayupos.com/customers

What is a "Customer"?
→ A lead that converted to ACTIVE status
→ Paying subscriber OR on trial

List View:
├── Columns: Restaurant Name, Owner, Phone, Plan, Status, Revenue/Month, Next Payment Due, Activity
├── Filters: Plan, Status, City, Payment Status, Last Activity
└── Sort options

Customer Detail View:
├── Restaurant Profile
│   ├── Name, address, phone, email, city
│   ├── Owner name, GSTIN, FSSAI number
│   ├── Logo (if uploaded)
│   └── Org Code (auto-generated: VAYU-HYD-00001)
│
├── Subscription Details
│   ├── Current Plan: [Basic / Pro / Enterprise]
│   ├── Status: [TRIAL / ACTIVE / SUSPENDED / CANCELLED]
│   ├── Modules Enabled: [POS, KOT, Stock, Reports, etc.]
│   ├── Devices Allowed: [1 / 3 / 5 / custom]
│   ├── Billing Cycle: [Monthly / Quarterly / Yearly]
│   ├── Started Date: [date]
│   ├── Next Payment Due: [date]
│   └── Action: [Upgrade Plan] [Suspend] [Cancel]
│
├── Payment History (Table)
│   ├── Columns: Date, Amount, Method, Status, Receipt
│   ├── Recent 5 payments
│   └── View All
│
├── Activity
│   ├── Last Login: [date time]
│   ├── Last Order Created: [date time]
│   ├── Total Orders This Month: [count]
│   ├── Health Score: [Green/Yellow/Red]
│   │   └── Green = Active daily, paying on time
│   │   └── Yellow = Less active, or payment delayed
│   │   └── Red = Not using, or payment overdue
│   └── Churn Risk: [Low / Medium / High]
│
├── Relationship Manager
│   ├── Assigned to: [Salesperson Name]
│   └── Change Assigned
│
└── Contact Log (Mini)
    └── Last 3 interactions
```

#### 2.6 Database Tables for Superadmin:

```sql
-- Users (superadmin, salesperson, admin)
-- (already exists, add role column if missing)
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'; -- user, owner, salesperson, superadmin, admin

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    plan VARCHAR(50) DEFAULT 'Basic',
    message TEXT,
    status VARCHAR(50) DEFAULT 'NEW',
    assigned_to_user_id UUID REFERENCES users(id),
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication Log (tracks all interactions)
CREATE TABLE communication_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100), -- 'CALLED', 'EMAILED', 'VISITED', 'NOTE_ADDED', etc.
    notes TEXT,
    status_change_from VARCHAR(50),
    status_change_to VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers (converted leads)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    restaurant_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    org_code VARCHAR(20) UNIQUE, -- VAYU-HYD-00001
    phone VARCHAR(15),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    gstin VARCHAR(20),
    fssai_number VARCHAR(20),
    logo_url TEXT,
    plan VARCHAR(50) DEFAULT 'Basic', -- Basic/Pro/Enterprise
    status VARCHAR(50) DEFAULT 'ACTIVE', -- TRIAL/ACTIVE/SUSPENDED/CANCELLED
    trial_ends_at TIMESTAMPTZ,
    subscription_started_at TIMESTAMPTZ,
    next_billing_date DATE,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly/quarterly/yearly
    amount_per_cycle INTEGER, -- paise
    relationship_manager_id UUID REFERENCES users(id),
    health_score VARCHAR(20), -- GREEN/YELLOW/RED
    last_login TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (track what modules they have access to)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    module_name VARCHAR(100), -- POS, KOT, Stock, Reports, Customers, Expenses, Coupons
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    amount INTEGER NOT NULL, -- paise
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING/COMPLETED/FAILED/REFUNDED
    payment_method VARCHAR(50), -- razorpay, bank_transfer, etc.
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    invoice_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding (tracks verification process)
CREATE TABLE onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    onboarding_link UUID UNIQUE DEFAULT gen_random_uuid(),
    link_expires_at TIMESTAMPTZ,
    step VARCHAR(50) DEFAULT 'DETAILS', -- DETAILS/DOCUMENTS/PAYMENT/VERIFIED
    documents_submitted BOOLEAN DEFAULT FALSE,
    owner_id_url TEXT,
    gst_cert_url TEXT,
    fssai_cert_url TEXT,
    documents_verified BOOLEAN DEFAULT FALSE,
    documents_verified_by UUID REFERENCES users(id),
    documents_verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    restaurant_account_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.7 Superadmin APIs:

```python
# Leads Management
GET /api/admin/leads
# Query params: status, city, plan, assigned_to, page, limit
# Returns: { leads: [...], total, page, limit }

GET /api/admin/leads/{id}
# Returns: { lead, communication_log: [...], onboarding_status }

PUT /api/admin/leads/{id}
# Input: { status, assigned_to_user_id, follow_up_date }
# Returns: { success, updated_lead }

POST /api/admin/leads/{id}/communication
# Input: { action, notes, status_from, status_to }
# Returns: { success, communication_log_entry }

POST /api/admin/leads/{id}/start-onboarding
# Input: { plan, modules: [...], billing_cycle }
# Returns: { success, onboarding_link, link_expires_at, email_sent }

# Customers Management
GET /api/admin/customers
# Returns: { customers: [...], total }

GET /api/admin/customers/{id}
# Returns: { customer, subscription_modules, payment_history, activity }

PUT /api/admin/customers/{id}/upgrade
# Input: { new_plan, new_modules }
# Returns: { success, new_pricing }

PUT /api/admin/customers/{id}/suspend
# Returns: { success, message: "Access suspended" }

# Superadmin Dashboard
GET /api/admin/dashboard/kpis
# Returns: { 
#   new_leads_count, 
#   conversion_rate, 
#   revenue_this_month, 
#   active_customers_count,
#   trial_to_paid_rate 
# }

GET /api/admin/dashboard/recent-leads
# Returns: { leads: [...] } (latest 10)

GET /api/admin/dashboard/notifications
# Returns: { notifications: [...] }
```

---

## STAGE 3: RESTAURANT POS (System 3)

✅ **Already documented in System 3 doc**

Key point: **This must work PERFECTLY before beta launch**

Multi-tenancy requirements:
- Every API filters by `client_id` from JWT
- Every restaurant sees ONLY their own data
- Test with at least 2 restaurants to verify isolation


---

## STAGE 4: ONGOING MONITORING

This is handled in Superadmin, not a separate stage.

Key monitoring features:
```
Payment Reminders:
├── Day -7: "Payment due in 7 days" email to customer
├── Day -3: "Payment due in 3 days" email
├── Day 0: "Payment due today" notification in superadmin
├── Day +4: System auto-locks restaurant account (POS shows "Account Locked")
├── Day +7: Full lock (no access at all)
└── Admin can manually unlock after payment

Referral Program (Phase 2):
├── Each customer gets referral code: REFERRAL-{org_code}
├── Share with others: gets 15% discount
├── Referred friend gets 10% discount
├── After 5 referrals: 1 month free

Reports:
├── Revenue this month (sum of all customers' paid invoices)
├── Lead conversion rate (active_customers / total_leads)
├── Trial conversion rate (trial_to_paid / total_trials)
├── Churn (customers who cancelled)
├── Admin performance (who closed most deals)
```

---

# WHAT'S NEEDED FOR BETA (April 30)?

## Critical Path for April 30 Launch:

### ✅ ALREADY DONE (System 3 - Restaurant POS):
- Login, Dashboard, POS Billing
- Menu Management, KOT, Customers
- Offers, Expenses, Reports
- Multi-tenancy architecture

### 🔴 MUST COMPLETE BY APRIL 30:

**Backend (1-2 days):**
```
- [ ] Add client_id to all tables (alembic migration)
- [ ] Update all queries to filter by client_id
- [ ] Create Leads table + APIs
- [ ] Create Trial Account flow + OTP verification
- [ ] Create Stock/Inventory APIs (if not done)
- [ ] Update JWT to include client_id
```

**Frontend (1-2 days):**
```
- [ ] Landing page with hero + pricing + contact form
- [ ] Free trial signup + OTP verification
- [ ] Stock/Inventory pages UI (if not done)
- [ ] Settings page to save restaurant details
```

**Superadmin (2-3 days) — MINIMAL for Beta:**
```
- [ ] Superadmin login page
- [ ] Leads list + detail page
- [ ] "Start Onboarding" button to generate link
- [ ] Assign leads to salespeople
- [ ] Change lead status manually
- [ ] Dashboard showing new leads
```

**Superadmin can SKIP for Beta (do in Phase 2):**
- ❌ Payment processing & Razorpay integration
- ❌ Automatic document verification
- ❌ Customer billing dashboard
- ❌ Detailed analytics & reports
- ❌ Referral program
- ❌ Website CMS editor

---

# ARCHITECTURE DECISION:

## RECOMMENDATION FOR BETA:

**Simplify Superadmin to bare minimum:**

```
Your approach (manual):
1. Receive leads from landing page form
2. Manually assign to salespeople
3. Salespeople update status in superadmin
4. When ready to pay, superadmin generates onboarding link manually
5. Customer verifies OTP, gets access to POS
6. No payment integration yet — just mark as "PAID" manually

This is 100% viable for 5 restaurants.
Does NOT require payment gateway integration.
Can be upgraded to automatic in Phase 2.
```

---

# DATABASE SCHEMA SUMMARY (What to Add)

```
NEW TABLES:
├── leads (from landing page)
├── trial_accounts (OTP verification)
├── communication_log (superadmin interactions)
├── customers (converted leads)
├── subscriptions (modules per customer)
├── payments (payment tracking)
├── onboarding (document verification)
├── stock_items (already in System 3)
├── stock_purchases (already in System 3)
└── clients (already in System 3)

MODIFICATIONS:
├── users: add role, client_id
├── products: add client_id
├── categories: add client_id
├── orders: add client_id
├── order_items: add client_id
├── customers: add client_id
├── expenses: add client_id
├── coupons: add client_id
└── All other tables: add client_id
```

---

# FINAL ANSWER TO YOUR QUESTION:

**Your flow is CORRECT, but:**

1. **Phase 1 (Beta) — Implement this:**
   - Landing page (hero + contact form + free trial)
   - Basic superadmin (leads + manual onboarding)
   - Restaurant POS with multi-tenancy
   - Manual payment tracking (no Razorpay yet)

2. **Phase 2 (After Beta) — Add this:**
   - Razorpay payment gateway
   - Automatic document verification
   - Customer analytics dashboard
   - Website CMS editor
   - Referral program
   - Detailed reports

3. **Key Change:**
   - **DO NOT** try to build full payment integration for beta
   - **DO** get multi-tenancy 100% working first
   - **DO** test with at least 2 restaurants before beta launch

---

**Ready to start implementation?**

Next steps:
1. Create database migration for all new tables
2. Build Landing page → Lead creation
3. Build Superadmin minimal version
4. Test multi-tenancy thoroughly
5. Deploy and onboard 5 beta restaurants

Should I create the specific migration SQL file + API specifications for each module?
