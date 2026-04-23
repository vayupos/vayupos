# 🎯 VayuPOS Flow - Quick Reference Guide

## 📋 Complete System Overview in 60 Seconds

```
🌐 LANDING PAGE (Public)
   ↓
   Contact Form → Lead Created (DB: leads table)
   ↓
   Free Trial Form → OTP Sent → OTP Verified
   ↓
   User + Client Created → JWT Token → Trial POS Access
   ↓
👔 SUPERADMIN MANAGEMENT
   ↓
   Dashboard → View All Leads → Assign Salesperson
   ↓
   Track Communication → Schedule Demo → Verify Documents
   ↓
   Approve → Create Restaurant Account → Send Credentials
   ↓
🍽️ RESTAURANT POS (Multi-tenant)
   ↓
   Owner Logs In → JWT with client_id
   ↓
   All data filtered by client_id (complete isolation)
   ↓
   Billing, KOT, Menu, Reports, etc.
   ↓
💳 REVENUE
   ↓
   Monthly Subscription Billing
```

---

## 🔄 The 4 Flows Explained (Simple)

### Flow 1️⃣: Contact Form → Lead

**What happens:**
- Visitor fills contact form on landing page
- Backend receives: restaurant_name, owner_name, phone, email, city, plan, message
- Database: `INSERT INTO leads (status='NEW')`
- Superadmin gets notification

**API Endpoint:**
```
POST /api/v1/leads
{
  "restaurant_name": "ABC Restaurant",
  "owner_name": "John",
  "phone": "+91-98765-43210",
  "email": "john@abc.com",
  "city": "Hyderabad",
  "plan": "Pro",
  "message": "Interested in POS system"
}
```

**Database:**
```
leads table:
- id: UUID
- restaurant_name: "ABC Restaurant"
- owner_name: "John"
- phone: "+91-98765-43210"
- email: "john@abc.com"
- city: "Hyderabad"
- plan: "Pro"
- status: "NEW"
- created_at: NOW()
```

---

### Flow 2️⃣: OTP Trial → User Created

**What happens:**
1. Visitor clicks "Free Trial"
2. Enters: owner_name, phone, email, plan
3. Backend sends OTP via SMS to phone
4. Visitor enters OTP
5. Backend creates: User, Client, TrialAccount
6. JWT token generated
7. Visitor redirected to POS dashboard

**API Endpoints:**
```
Step 1: Send OTP
POST /api/v1/trials/request-otp
{
  "owner_name": "John",
  "phone": "+91-98765-43210",
  "email": "john@abc.com",
  "plan": "Pro"
}
→ SMS sent: "Your OTP is 123456"

Step 2: Verify OTP
POST /api/v1/trials/verify-otp
{
  "phone": "+91-98765-43210",
  "otp_code": "123456"
}
→ Response: { "token": "jwt_token...", "redirect": "/trial-dashboard" }
```

**What gets created:**
```
1. users table:
   - id: UUID
   - username: "+91-98765-43210"
   - email: "john@abc.com"
   - role: "owner"
   - password: auto-generated (hashed)

2. clients table:
   - id: UUID
   - org_code: "VAYU-TRIAL-1234"
   - name: "ABC Restaurant"
   - plan: "Pro"
   - status: "TRIAL"

3. trial_accounts table:
   - id: UUID
   - phone: "+91-98765-43210"
   - email: "john@abc.com"
   - otp_verified: true
   - trial_user_id: (references users.id)
   - trial_starts_at: NOW()
   - trial_expires_at: NOW() + 30 days
```

**Result:** User can log in and use POS for 30 days free!

---

### Flow 3️⃣: Lead Management (Superadmin)

**What Superadmin sees:**
1. Dashboard with all leads
2. Status badges: NEW, CONTACTED, DEMO_SCHEDULED, etc.
3. For each lead, can:
   - Assign to salesperson
   - Add notes
   - Change status
   - Schedule demo
   - Send onboarding link
   - View communication history

**Status Progression:**
```
NEW
  ↓ (Salesperson calls)
CONTACTED
  ↓ (Schedule demo)
DEMO_SCHEDULED
  ↓ (Complete demo)
DEMO_SHOWN
  ↓ (Follow-up)
FOLLOW_UP
  ↓ (Owner agrees)
READY_TO_PAY
  ↓ (Owner submits docs)
ONBOARDING
  ↓ (Superadmin approves docs)
ACTIVE ✅
```

**Communication Log** (audit trail):
- Every action logged: who, when, what, why
- Example:
  ```
  2026-04-20 10:30 AM - CREATED - Contact form submitted
  2026-04-21 2:00 PM - CONTACTED - Salesperson called, interested
  2026-04-21 3:00 PM - STATUS_CHANGE - NEW → CONTACTED
  2026-04-22 10:00 AM - DEMO_SCHEDULED - Demo set for Apr 25
  ```

---

### Flow 4️⃣: Account Creation → Multi-tenant

**What Superadmin does:**
1. After documents approved, clicks "Create Account"
2. Backend automatically:
   - Creates Client (org_code: VAYU-HYD-00001)
   - Creates User (username=phone)
   - Creates Customer record
   - Sends login credentials to owner

**What gets created:**
```
1. clients table:
   - org_code: "VAYU-HYD-00001"
   - name: "ABC Restaurant"
   - status: "ACTIVE"

2. users table:
   - username: "+91-98765-43210"
   - client_id: (same as clients.id)
   - role: "owner"

3. customers table:
   - client_id: (same)
   - restaurant_name: "ABC Restaurant"
   - plan: "Pro"
   - status: "ACTIVE"

4. subscriptions table:
   - customer_id: (same)
   - modules: POS, KOT, REPORTS, etc.
```

**Multi-tenancy in action:**
```
When owner logs in:
1. Enter: phone + password
2. Backend queries: SELECT user WHERE username = phone
3. Extracts: client_id from user record
4. Generates JWT: { user_id, client_id, role }
5. Frontend stores JWT

Every API call:
- Request: GET /api/v1/orders
- JWT decoded → client_id = "ABCD-1234"
- Query: SELECT * FROM orders WHERE client_id = 'ABCD-1234'
- Result: ONLY orders from THIS restaurant

Result: 100 restaurants can use same database!
Each sees ONLY their own data.
```

---

## 📊 Database Tables at a Glance

### Public Tables (Superadmin sees all)
```
leads
├─ id, restaurant_name, owner_name, phone, email, city
├─ status: NEW → CONTACTED → ... → ACTIVE
└─ assigned_to_user_id, follow_up_date

trial_accounts
├─ id, owner_name, phone, email
├─ otp_code, otp_verified, otp_expires_at
├─ trial_user_id, trial_starts_at, trial_expires_at
└─ status: OTP_PENDING → VERIFIED → ACCOUNT_CREATED

communication_log
├─ id, lead_id, user_id, action
├─ notes, status_change_from, status_change_to
└─ created_at

onboarding
├─ id, lead_id, onboarding_link
├─ step: DETAILS → DOCUMENTS → PAYMENT → VERIFIED
├─ owner_id_url, gst_cert_url, fssai_cert_url
├─ documents_verified, restaurant_user_id
└─ created_at
```

### Multi-tenant Tables (Filtered by client_id)
```
products (client_id)
orders (client_id)
customers (client_id)
expenses (client_id)
coupons (client_id)
kot (client_id)
inventory_logs (client_id)
... (all business tables)
```

---

## ✅ Step-by-Step: How to Test Each Flow

### Test 1: Contact Form
```
1. Visit: http://localhost:3000/ (frontend)
2. Scroll to "Contact Form"
3. Fill: Restaurant Name, Owner, Phone, Email, City, Plan
4. Click: Submit
5. Verify: Check database → leads table (status=NEW)
6. In Superadmin: Check if lead appears in dashboard
```

### Test 2: Free Trial (with manual OTP)
```
1. Visit: http://localhost:3000/
2. Click: "Start Free Trial"
3. Fill: Owner Name, Phone, Email, Plan
4. Click: "Send OTP"
5. Verify: Check database → trial_accounts (status=OTP_PENDING)
6. Manually copy OTP from database (otp_code column)
7. Paste OTP in frontend modal
8. Click: "Verify"
9. Verify: 
   - JWT token generated
   - users table has new user
   - Redirected to POS dashboard
   - Can see demo data
```

### Test 3: Lead Management
```
1. Login as superadmin: /admin/login
2. Go to: Leads Dashboard
3. See: List of all leads (from contact forms)
4. Click: One lead to view details
5. Try: Change status, add note, assign salesperson
6. Verify: Communication log updated
```

### Test 4: Multi-tenancy
```
1. Create 2 trial accounts (different phones)
2. Each gets own user + client
3. Login as Restaurant 1 owner
4. Create product: "Pizza"
5. Create order: 1 Pizza
6. Logout
7. Login as Restaurant 2 owner
8. Check: 
   - Cannot see Pizza from Restaurant 1
   - Cannot see order from Restaurant 1
   - Each sees only own data ✅
```

---

## 🔧 API Endpoints Summary

### Public Endpoints (No Auth)
```
POST /api/v1/leads                          - Submit contact form
POST /api/v1/trials/request-otp            - Send OTP
POST /api/v1/trials/verify-otp             - Verify OTP
GET /api/v1/public/plans                   - Get pricing
```

### Auth Endpoints
```
POST /api/v1/auth/login                    - Login (any user)
POST /api/v1/auth/logout                   - Logout
POST /api/v1/auth/refresh                  - Refresh JWT
```

### Superadmin Endpoints (Role: superadmin)
```
GET /api/v1/admin/leads                    - List all leads
GET /api/v1/admin/leads/{id}               - Lead detail + history
PUT /api/v1/admin/leads/{id}/status        - Update status
POST /api/v1/admin/leads/{id}/assign       - Assign to salesperson
POST /api/v1/admin/leads/{id}/follow-up    - Set follow-up date
POST /api/v1/admin/leads/{id}/onboarding   - Send onboarding link
GET /api/v1/admin/onboarding/{id}          - View onboarding progress
PUT /api/v1/admin/onboarding/{id}/approve  - Approve documents
PUT /api/v1/admin/onboarding/{id}/reject   - Reject documents
POST /api/v1/admin/leads/{id}/create-account - Create restaurant account
```

### Restaurant POS Endpoints (Role: owner, client_id extracted)
```
GET /api/v1/dashboard                      - Dashboard KPIs
GET /api/v1/products                       - Get menu
POST /api/v1/products                      - Add product
PUT /api/v1/products/{id}                  - Edit product
DELETE /api/v1/products/{id}               - Delete product

GET /api/v1/orders                         - Get orders
POST /api/v1/orders                        - Create order
GET /api/v1/orders/{id}/print              - Print bill

GET /api/v1/customers                      - Get customers
POST /api/v1/customers                     - Add customer

GET /api/v1/reports/daily-sales            - Daily sales report
GET /api/v1/reports/export                 - Export reports

... (and more)
```

---

## 🚀 Implementation Sequence

**Day 1: Database**
1. Run Alembic migration (creates all tables)
2. Add sample data (Superadmin users, plans)

**Day 2: Backend APIs**
1. Create models: Lead, TrialAccount, CommunicationLog, Onboarding
2. Create routes: /leads, /trials/*, /admin/leads, /admin/onboarding, /admin/create-account
3. Test all endpoints with Postman

**Day 3: Frontend - Landing Page**
1. Create Hero + Features + Pricing sections
2. Create Contact Form modal
3. Create Trial Signup + OTP modal
4. Connect to backend APIs
5. Test complete flow

**Day 4: Frontend - Superadmin**
1. Create Login page
2. Create Leads Dashboard (list + KPIs)
3. Create Lead Detail page (communication history)
4. Create modals (status change, assign, etc.)
5. Test complete flow

**Day 5: Integration & Testing**
1. Test all 4 flows end-to-end
2. Test multi-tenancy isolation
3. Fix bugs
4. Deploy to AWS

---

## 📞 Support Resources

**For detailed information, see:**
- [SYSTEM_FLOW_DIAGRAM.md](SYSTEM_FLOW_DIAGRAM.md) - Detailed explanations
- [SYSTEM_FLOW_MERMAID.md](SYSTEM_FLOW_MERMAID.md) - Visual diagrams
- [SUPERADMIN_LANDING_IMPLEMENTATION.md](SUPERADMIN_LANDING_IMPLEMENTATION.md) - Code specifications
- [IMPLEMENTATION_REQUIREMENTS.md](IMPLEMENTATION_REQUIREMENTS.md) - Database schema & API specs

**Key Concepts:**
- **Tenant Isolation**: Every query filtered by client_id
- **Communication Log**: Audit trail for all lead actions
- **Status Progression**: Carefully designed states for leads
- **Multi-tenancy**: 1 database, N restaurants, each sees only own data
- **JWT with client_id**: Enables automatic tenant filtering
