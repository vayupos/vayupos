# VayuPOS Complete System Flow Diagram

## 🎯 Overview: 4-Stage Customer Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLETE VAYUPOS ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Stage 1: PUBLIC                                                    │
│  Landing Page → Contact Form → Free Trial Signup                    │
│  ├─ Lead Created in Database                                        │
│  ├─ OTP Verification                                                │
│  └─ Trial Account Activated                                         │
│                                                                       │
│  Stage 2: SUPERADMIN MANAGEMENT                                    │
│  Superadmin Dashboard → Lead Management & Onboarding                │
│  ├─ Assign Salesperson                                              │
│  ├─ Track Communication                                             │
│  ├─ Document Verification                                           │
│  └─ Create Restaurant Account                                       │
│                                                                       │
│  Stage 3: RESTAURANT POS (Multi-tenant)                            │
│  Restaurant Owner → Login → Dashboard → POS Operations              │
│  ├─ Billing & KOT                                                   │
│  ├─ Menu Management                                                 │
│  ├─ Reports                                                         │
│  └─ Multi-location Support                                          │
│                                                                       │
│  Stage 4: MONITORING & ANALYTICS (Future)                          │
│  Admin Dashboard → Business Intelligence & Insights                 │
│  ├─ Revenue Tracking                                                │
│  ├─ Usage Analytics                                                 │
│  └─ Customer Health Scores                                          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📱 STAGE 1: PUBLIC LANDING PAGE FLOW

### 1.1 Visitor → Contact Form → Lead Creation

```
┌──────────────────────────────────────────────────────────────────┐
│                      LANDING PAGE                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Visitor arrives at: https://app.vayupos.com                  │
│     ├─ Hero Section (CTA: "Start Free Trial")                    │
│     ├─ Features Section (6 key features)                         │
│     ├─ Pricing Section (3 plans)                                 │
│     └─ Contact Section (Contact form modal)                      │
│                                                                   │
│  2. Visitor fills Contact Form:                                  │
│     ├─ Restaurant Name                                           │
│     ├─ Owner Name                                                │
│     ├─ Phone Number                                              │
│     ├─ Email                                                     │
│     ├─ City                                                      │
│     ├─ Plan Selection (Basic/Pro/Enterprise)                     │
│     └─ Message                                                   │
│                                                                   │
│  3. Frontend sends POST /api/v1/leads                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
         │
         │ HTTP POST with JSON payload
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND - CREATE LEAD                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Backend Route: POST /api/v1/leads                               │
│  ├─ Validate form data (Pydantic)                                │
│  ├─ Check phone/email uniqueness                                 │
│  ├─ Create Lead record in database                               │
│  └─ Return lead_id + success message                             │
│                                                                   │
│  Database Action:                                                │
│  INSERT INTO leads (restaurant_name, owner_name, phone,          │
│                     email, city, plan, message, status)          │
│  VALUES ('ABC Restaurant', 'John', '+91999...', ...)             │
│  status = 'NEW'                                                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Free Trial Signup → OTP Verification

```
┌──────────────────────────────────────────────────────────────────┐
│              FREE TRIAL SIGNUP MODAL (Step 1)                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User clicks "Start Free Trial" button                            │
│  ├─ Modal shows: Contact Info + Plan Selection                   │
│  ├─ Owner Name                                                   │
│  ├─ Phone Number                                                 │
│  ├─ Email                                                        │
│  ├─ Select Plan (radio buttons)                                  │
│  └─ Button: "Send OTP"                                           │
│                                                                   │
│  User clicks "Send OTP"                                          │
│  ├─ Frontend POST /api/v1/trials/request-otp                    │
│  ├─ Backend validates data                                       │
│  ├─ Backend generates random 6-digit OTP                         │
│  ├─ Sends OTP via SMS (Twilio/AWS SNS)                          │
│  ├─ Creates TrialAccount record                                  │
│  │  status = 'OTP_PENDING'                                       │
│  │  otp_expires_at = NOW() + 10 minutes                          │
│  │  otp_max_attempts = 3                                         │
│  └─ Frontend shows: OTP input field + Resend button              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
         │
         │ User receives SMS with OTP
         ▼
┌──────────────────────────────────────────────────────────────────┐
│              OTP VERIFICATION MODAL (Step 2)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User enters 6-digit OTP                                          │
│  ├─ Frontend POST /api/v1/trials/verify-otp                     │
│  ├─ payload: { phone, otp_code }                                │
│                                                                   │
│  Backend validates:                                              │
│  ├─ Find TrialAccount by phone                                   │
│  ├─ Check OTP matches                                            │
│  ├─ Check OTP not expired                                        │
│  ├─ Check attempts < max_attempts                                │
│  │                                                               │
│  ├─ If valid:                                                    │
│  │  ├─ UPDATE trial_accounts SET otp_verified = true            │
│  │  ├─ status = 'VERIFIED'                                       │
│  │  ├─ Create User account (username=phone, auto-pwd)           │
│  │  ├─ UPDATE trial_accounts SET trial_user_id = new_user_id    │
│  │  ├─ trial_starts_at = NOW()                                  │
│  │  ├─ trial_expires_at = NOW() + 30 days                       │
│  │  ├─ Generate JWT token                                        │
│  │  └─ Return { success, token, redirect_to: '/trial-dashboard' }│
│  │                                                               │
│  └─ If invalid:                                                  │
│     ├─ Increment otp_attempts                                    │
│     ├─ If attempts >= 3, mark as 'EXPIRED'                       │
│     └─ Return error message                                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 Trial Account Activated → Restaurant POS Access

```
┌──────────────────────────────────────────────────────────────────┐
│              TRIAL ACCOUNT CREATED - WHAT HAPPENS                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Backend Auto-Creates:                                           │
│                                                                   │
│  1. User Account                                                 │
│     CREATE users (                                               │
│       username = phone                                           │
│       role = 'owner'                                             │
│       is_active = true                                           │
│     )                                                            │
│                                                                   │
│  2. Client (Multi-tenant Database)                               │
│     CREATE clients (                                             │
│       org_code = 'VAYU-TRIAL-' + random                          │
│       plan = selected_plan                                       │
│       status = 'TRIAL'                                           │
│     )                                                            │
│                                                                   │
│  3. Trial Dashboard Access:                                      │
│     ├─ User logs in with JWT token                               │
│     ├─ Can access System 3 (Restaurant POS)                      │
│     ├─ See demo data (sample products, orders)                   │
│     ├─ Trial countdown timer (30 days)                           │
│     ├─ Upgrade button (redirect to superadmin contact)           │
│     └─ Limited features (read-only reports)                      │
│                                                                   │
│  4. Database Setup for Trial:                                    │
│     ├─ products (demo menu)                                      │
│     ├─ categories (demo categories)                              │
│     ├─ customers (empty)                                         │
│     ├─ orders (empty)                                            │
│     └─ expenses (empty)                                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
         │
         │ User explores trial for 30 days
         │ (Option 1: Wants to upgrade)
         │ (Option 2: Trial expires)
         ▼
┌──────────────────────────────────────────────────────────────────┐
│              TRIAL EXPIRY OR UPGRADE REQUEST                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  When trial_expires_at < NOW():                                  │
│  ├─ User cannot login                                            │
│  ├─ Redirected to: Contact superadmin to upgrade                 │
│  └─ Message: "Your trial has ended. Contact us to continue"     │
│                                                                   │
│  OR When user clicks "Upgrade Now":                              │
│  ├─ Superadmin creates Lead from trial account                  │
│  ├─ Status = 'VERIFIED'                                          │
│  ├─ Assigned to salesperson for demo                             │
│  └─ Lead is managed in Superadmin Dashboard (Stage 2)            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 👔 STAGE 2: SUPERADMIN LEAD MANAGEMENT FLOW

### 2.1 Superadmin Dashboard - Lead Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                   SUPERADMIN PORTAL HOME                         │
│                  (Role: superadmin/admin only)                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  URL: https://app.vayupos.com/admin/login                        │
│  ├─ Superadmin login (username + password)                       │
│  ├─ 2FA optional (SMS/Email)                                     │
│  └─ Creates JWT token with role='superadmin'                     │
│                                                                   │
│  Superadmin Dashboard shows:                                     │
│  ├─ KPIs:                                                        │
│  │  ├─ Total Leads (all time)                                    │
│  │  ├─ Leads This Month                                          │
│  │  ├─ Conversion Rate (Active/Total)                            │
│  │  ├─ Revenue (subscriptions)                                   │
│  │  ├─ Active Restaurants                                        │
│  │  └─ Trial Expiring Soon (warning)                             │
│  │                                                               │
│  ├─ Recent Leads (table, sortable):                              │
│  │  ├─ Status badge (NEW, CONTACTED, DEMO_SCHEDULED, etc)       │
│  │  ├─ Restaurant name                                          │
│  │  ├─ Owner name                                                │
│  │  ├─ City                                                      │
│  │  ├─ Date                                                      │
│  │  ├─ Assigned salesperson                                      │
│  │  └─ Action: View Details                                      │
│  │                                                               │
│  └─ Navigation:                                                  │
│     ├─ [All Leads]  [Demo]  [Onboarding]  [Active]              │
│     ├─ [City Filter] [Status Filter] [Date Range]                │
│     └─ [Export CSV] [Analytics]                                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Lead Status Progression

```
NEW → CONTACTED → DEMO_SCHEDULED → DEMO_SHOWN → FOLLOW_UP → READY_TO_PAY → ONBOARDING → ACTIVE
 │
 └─ REJECTED (anytime)
 └─ CHURNED (from ACTIVE)

Status Transitions:

┌─────────────────────────────────────────────────────────────────────────────┐
│ Status        │ Triggered By          │ Action                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ NEW           │ Form submission       │ Lead created, awaiting contact      │
│ CONTACTED     │ Salesperson calls     │ Note: "Initial call - interested"   │
│ DEMO_SCHED.   │ Demo scheduled        │ Calendar invite sent to owner       │
│ DEMO_SHOWN    │ Demo completed        │ Feedback: "Liked features X, Y"     │
│ FOLLOW_UP     │ Demo shown            │ Follow-up date set (e.g., 3 days)   │
│ READY_TO_PAY  │ Owner agrees          │ Send payment link / onboarding form │
│ ONBOARDING    │ Docs uploaded         │ Verify documents (GST, FSSAI)       │
│ ACTIVE        │ Docs verified         │ Create restaurant account + login   │
│ REJECTED      │ Manual rejection      │ Reason stored for analytics         │
│ CHURNED       │ From ACTIVE lead      │ Trial/subscription cancelled        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Lead Detail Page - Full Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                    LEAD DETAIL PAGE                              │
│              Click on any lead in the table                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LEFT PANEL: Lead Information                                    │
│  ├─ Restaurant Name: ABC Restaurant                              │
│  ├─ Owner: John Doe                                              │
│  ├─ Phone: +91-98765-43210                                       │
│  ├─ Email: john@abc.com                                          │
│  ├─ City: Hyderabad                                              │
│  ├─ Plan: Pro                                                    │
│  ├─ Message: "Looking for modern POS system"                     │
│  ├─ Status: [DEMO_SHOWN] [Dropdown to change]                   │
│  ├─ Assigned To: [Salesperson Name] [Change]                    │
│  ├─ Follow-up Date: 2026-04-25 [Edit]                           │
│  └─ Created: 2026-04-20                                          │
│                                                                   │
│  RIGHT PANEL: Communication Timeline (Activity Log)              │
│  ├─ 2026-04-20 10:30 AM                                          │
│  │  User: Auto System                                            │
│  │  Action: [CREATED] Contact form submitted                     │
│  │                                                               │
│  ├─ 2026-04-21 2:00 PM                                           │
│  │  User: Salesperson (Rajesh)                                   │
│  │  Action: [CONTACTED] Initial call made                        │
│  │  Note: "Owner very interested, wants demo"                    │
│  │                                                               │
│  ├─ 2026-04-22 3:30 PM                                           │
│  │  User: Salesperson (Rajesh)                                   │
│  │  Action: [STATUS_CHANGE] NEW → CONTACTED                     │
│  │                                                               │
│  ├─ 2026-04-22 4:00 PM                                           │
│  │  User: Salesperson (Rajesh)                                   │
│  │  Action: [DEMO_SCHEDULED] Demo scheduled for 2026-04-25      │
│  │  Note: "Meeting at restaurant 5 PM"                          │
│  │                                                               │
│  └─ 2026-04-23 10:30 AM                                          │
│     User: Salesperson (Rajesh)                                   │
│     Action: [DEMO_SHOWN]                                         │
│     Note: "Demo went well! Owner wants to proceed"               │
│                                                                   │
│  BOTTOM SECTION: Action Buttons                                  │
│  ├─ [Call Owner] → Opens dial or contact form                    │
│  ├─ [Send Email] → Email template                                │
│  ├─ [Schedule Demo] → Calendar picker                            │
│  ├─ [Add Note] → Text field + save                               │
│  ├─ [Change Status] → Dropdown with transitions                  │
│  ├─ [Assign To] → Select salesperson                             │
│  ├─ [Set Follow-up] → Date picker                                │
│  ├─ [Send Onboarding Link] → Auto-generates link + SMS           │
│  ├─ [Reject] → Reason required                                   │
│  └─ [View Document Upload] → See submitted docs (if any)         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.4 Document Upload & Verification Flow

```
┌──────────────────────────────────────────────────────────────────┐
│           STEP 1: SEND ONBOARDING LINK TO OWNER                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Superadmin clicks [Send Onboarding Link]                        │
│  ├─ Backend generates unique onboarding_link (UUID)              │
│  ├─ Creates Onboarding record:                                   │
│  │  INSERT INTO onboarding (lead_id, onboarding_link,            │
│  │                          link_expires_at, step)               │
│  │  VALUES (lead_id, UUID, NOW() + 7 days, 'DETAILS')           │
│  │                                                               │
│  ├─ Sends SMS to owner's phone:                                  │
│  │  "Complete your restaurant setup here:                        │
│  │   https://app.vayupos.com/onboard/{onboarding_link}"          │
│  │                                                               │
│  └─ Superadmin sees: ✅ "Onboarding link sent"                   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
         │
         │ Owner receives SMS
         │ Clicks link
         ▼
┌──────────────────────────────────────────────────────────────────┐
│           STEP 2: OWNER FILLS RESTAURANT DETAILS                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Onboarding Page (Step 1: DETAILS)                               │
│  ├─ Pre-filled from Lead:                                        │
│  │  ├─ Restaurant Name                                           │
│  │  ├─ Owner Name                                                │
│  │  ├─ Phone                                                     │
│  │  └─ Email                                                     │
│  │                                                               │
│  ├─ Additional fields to fill:                                   │
│  │  ├─ Restaurant Address                                        │
│  │  ├─ City (if not filled)                                      │
│  │  ├─ GST Number (optional)                                     │
│  │  ├─ FSSAI License Number                                      │
│  │  └─ Opening Hours                                             │
│  │                                                               │
│  └─ Button: [Continue to Documents]                              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│           STEP 3: OWNER UPLOADS DOCUMENTS                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Onboarding Page (Step 2: DOCUMENTS)                             │
│  ├─ Upload fields:                                               │
│  │  ├─ Owner ID (required): [Drag/click to upload]               │
│  │  │   ├─ Accepted: JPG, PNG, PDF                               │
│  │  │   ├─ Max size: 5 MB                                        │
│  │  │   └─ Stores in S3: /onboarding/{lead_id}/owner_id/         │
│  │  │                                                            │
│  │  ├─ GST Certificate (required): [Drag/click]                  │
│  │  │   └─ Stores in S3: /onboarding/{lead_id}/gst_cert/        │
│  │  │                                                            │
│  │  ├─ FSSAI Certificate (optional): [Drag/click]                │
│  │  │   └─ Stores in S3: /onboarding/{lead_id}/fssai_cert/      │
│  │  │                                                            │
│  │  └─ Additional Notes: [Text area]                             │
│  │      └─ "Need 3 POS terminals, opening in 2 locations"        │
│  │                                                               │
│  ├─ After upload:                                                │
│  │  ├─ Update Onboarding record:                                 │
│  │  │  owner_id_url = s3_url                                     │
│  │  │  gst_cert_url = s3_url                                     │
│  │  │  documents_submitted_at = NOW()                            │
│  │  │  step = 'PAYMENT'                                          │
│  │  │                                                            │
│  │  └─ Notify Superadmin: "New documents ready for review"       │
│  │                                                               │
│  └─ Button: [Submit for Review]                                  │
│     ├─ Changes status → Lead: ONBOARDING                         │
│     ├─ Creates communication log entry                           │
│     └─ Sends notification to superadmin                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
         │
         │ Superadmin gets notification
         │ Reviews documents
         ▼
┌──────────────────────────────────────────────────────────────────┐
│           STEP 4: SUPERADMIN VERIFIES DOCUMENTS                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  In Lead Detail Page → [View Documents] button                   │
│  ├─ Shows document URLs (clickable)                              │
│  ├─ Preview: Owner ID (image)                                    │
│  ├─ Preview: GST Certificate (PDF)                               │
│  ├─ Preview: FSSAI (if submitted)                                │
│  ├─ Owner notes: "Need 3 POS terminals..."                       │
│  │                                                               │
│  ├─ APPROVE:                                                     │
│  │  ├─ Superadmin clicks [Approve Documents]                     │
│  │  ├─ Backend updates Onboarding:                               │
│  │  │  documents_verified = true                                 │
│  │  │  documents_verified_by = superadmin_user_id                │
│  │  │  documents_verified_at = NOW()                             │
│  │  │  step = 'VERIFIED'                                         │
│  │  │                                                            │
│  │  ├─ Lead status → READY_TO_PAY                                │
│  │  ├─ Send SMS to owner: "Documents approved! Proceed to setup" │
│  │  └─ Communication log: [DOCUMENTS_VERIFIED]                   │
│  │                                                               │
│  └─ REJECT:                                                      │
│     ├─ Superadmin clicks [Reject Documents]                      │
│     ├─ Fills reason: "GST certificate unclear/expired"           │
│     ├─ Backend updates:                                          │
│     │  rejection_reason = reason                                 │
│     │  step = 'DETAILS' (go back)                                │
│     │  onboarding_link = regenerated                             │
│     │                                                            │
│     ├─ Send SMS: "Please resubmit documents - {reason}"          │
│     ├─ Communication log: [DOCUMENTS_REJECTED]                   │
│     └─ Lead stays in ONBOARDING                                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.5 Account Creation & Restaurant Activation

```
┌──────────────────────────────────────────────────────────────────┐
│        STEP 5: CREATE RESTAURANT ACCOUNT (After Approval)        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Superadmin clicks [Create Restaurant Account]                   │
│  (Available after documents_verified = true)                     │
│                                                                   │
│  Backend performs:                                               │
│  ├─ CREATE Client (multi-tenant base):                           │
│  │  INSERT INTO clients (org_code, name, status, plan)           │
│  │  VALUES ('VAYU-HYD-00001', 'ABC Restaurant', 'ACTIVE', 'Pro') │
│  │  → Returns: client_id = UUID                                  │
│  │                                                               │
│  ├─ CREATE Customer:                                             │
│  │  INSERT INTO customers (                                      │
│  │    lead_id = lead.id                                          │
│  │    client_id = generated_client_id                            │
│  │    org_code = 'VAYU-HYD-00001'                                │
│  │    restaurant_name = lead.restaurant_name                     │
│  │    owner_name = lead.owner_name                               │
│  │    phone = lead.phone                                         │
│  │    email = lead.email                                         │
│  │    plan = lead.plan                                           │
│  │    status = 'ACTIVE'                                          │
│  │    subscription_started_at = NOW()                            │
│  │    relationship_manager_id = assigned_salesperson_id          │
│  │  )                                                            │
│  │  → Returns: customer_id                                       │
│  │                                                               │
│  ├─ CREATE User (Restaurant Owner):                              │
│  │  INSERT INTO users (                                          │
│  │    username = lead.phone (or email)                           │
│  │    email = lead.email                                         │
│  │    hashed_password = generate_temp_password()                 │
│  │    role = 'owner'                                             │
│  │    client_id = generated_client_id                            │
│  │    is_active = true                                           │
│  │  )                                                            │
│  │  → Returns: user_id                                           │
│  │                                                               │
│  ├─ UPDATE Onboarding:                                           │
│  │  UPDATE onboarding SET                                        │
│  │    restaurant_account_created = true                          │
│  │    restaurant_user_id = new_user_id                           │
│  │    step = 'VERIFIED'                                          │
│  │                                                               │
│  ├─ UPDATE Lead:                                                 │
│  │  UPDATE leads SET status = 'ACTIVE'                           │
│  │                                                               │
│  ├─ CREATE Default Subscriptions:                                │
│  │  INSERT INTO subscriptions (customer_id, module_name)         │
│  │  For each module in plan: POS, KOT, STOCK, REPORTS            │
│  │  (Enterprise gets all, Pro gets most, Basic limited)          │
│  │                                                               │
│  ├─ SEED Demo Data (optional):                                   │
│  │  ├─ Insert sample menu items                                  │
│  │  ├─ Insert categories                                         │
│  │  └─ Create KOT stations                                       │
│  │                                                               │
│  └─ SEND CREDENTIALS:                                            │
│     ├─ Email to owner:                                           │
│     │  "Welcome! Your account is ready                           │
│     │   Login: https://app.vayupos.com                           │
│     │   Username: {phone}                                        │
│     │   Temporary Password: {temp_pwd}                           │
│     │   Please change password on first login                    │
│     │   Support: support@vayupos.com"                            │
│     │                                                            │
│     └─ SMS to owner:                                             │
│        "VayuPOS activated! Login with {phone}, pwd sent to email"│
│                                                                   │
│  Superadmin sees: ✅ "Account created - VAYU-HYD-00001"         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
         │
         │ Owner receives credentials
         │ Logs in to Restaurant POS
         ▼
```

---

## 🍽️ STAGE 3: RESTAURANT POS MULTI-TENANT FLOW

### 3.1 Tenant Isolation & Multi-tenancy

```
┌──────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANCY ARCHITECTURE                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Flow:                                                            │
│  1. Owner logs in with phone + password                          │
│  2. Backend validates credentials                                │
│  3. Backend retrieves User record:                               │
│     SELECT * FROM users WHERE username = phone                   │
│     → Returns: user_id, client_id, role                          │
│                                                                   │
│  4. Backend creates JWT token:                                   │
│     {                                                            │
│       sub: user_id                                               │
│       client_id: client_id                                       │
│       role: 'owner'                                              │
│       exp: NOW() + 7 days                                        │
│     }                                                            │
│                                                                   │
│  5. Frontend stores JWT in localStorage/sessionStorage           │
│                                                                   │
│  6. All subsequent requests include JWT in Authorization header: │
│     Authorization: Bearer {jwt_token}                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Tenant Filtering in All Queries

```
┌──────────────────────────────────────────────────────────────────┐
│                  DATA ISOLATION PER TENANT                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Every database query includes WHERE client_id = $1:              │
│                                                                   │
│  Example: Get all products for logged-in restaurant              │
│  ├─ Request: GET /api/v1/products                                │
│  ├─ JWT decoded → extract client_id                              │
│  ├─ Query:                                                       │
│  │  SELECT * FROM products                                       │
│  │  WHERE client_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'     │
│  │  (Only products belonging to THIS restaurant)                 │
│  │                                                               │
│  └─ Response: Products list                                      │
│                                                                   │
│  Example: Get all orders                                         │
│  ├─ Request: GET /api/v1/orders?date=2026-04-22                 │
│  ├─ Query:                                                       │
│  │  SELECT * FROM orders                                         │
│  │  WHERE client_id = extracted_client_id                        │
│  │    AND DATE(created_at) = '2026-04-22'                        │
│  │                                                               │
│  └─ Response: Only orders from THIS restaurant on THIS date      │
│                                                                   │
│  Example: Create new product                                     │
│  ├─ Request: POST /api/v1/products                               │
│  │  { name: 'Pizza', price: 250 }                                │
│  ├─ Backend:                                                     │
│  │  INSERT INTO products (name, price, client_id, ...)           │
│  │  VALUES ('Pizza', 250, extracted_client_id, ...)              │
│  │  (Automatically attaches to restaurant's client_id)           │
│  │                                                               │
│  └─ Product created in isolation                                 │
│                                                                   │
│  Database Tables with client_id column:                          │
│  ├─ products                                                     │
│  ├─ categories                                                   │
│  ├─ orders                                                       │
│  ├─ order_items                                                  │
│  ├─ customers                                                    │
│  ├─ expenses                                                     │
│  ├─ coupons                                                      │
│  ├─ kot                                                          │
│  ├─ kot_items                                                    │
│  ├─ inventory_logs                                               │
│  ├─ users (each user assigned to 1 client_id)                    │
│  └─ ... (all business data tables)                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Restaurant Owner Dashboard Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  RESTAURANT OWNER DASHBOARD                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Owner logs in → Dashboard shows (all data isolated to their     │
│                   restaurant via client_id filter):              │
│                                                                   │
│  KPI Cards (Top):                                                │
│  ├─ Today's Sales: ₹45,200 (SUM of orders TODAY)                 │
│  ├─ Active Orders: 8 (COUNT of active orders)                    │
│  ├─ Customers: 2,340 (COUNT total customers)                     │
│  └─ Expenses Today: ₹5,200                                       │
│                                                                   │
│  Quick Actions (Middle):                                         │
│  ├─ [+ New Order] → Open POS Billing screen                      │
│  ├─ [View Menu] → Products Management                            │
│  ├─ [Kitchen Display] → KOT system                               │
│  └─ [Customers] → Customer list                                  │
│                                                                   │
│  Navigation Tabs (Left Sidebar):                                 │
│  ├─ 📊 Dashboard (Current)                                       │
│  ├─ 🛒 POS / Billing                                             │
│  ├─📋 Menu Management                                           │
│  ├─ 👥 Customers                                                 │
│  ├─ 🧾 Orders                                                    │
│  ├─ 💰 Expenses                                                  │
│  ├─ 🏷️ Offers & Coupons                                          │
│  ├─ 🍳 Kitchen Display (KOT)                                     │
│  ├─ 📈 Reports                                                   │
│  └─ ⚙️ Settings                                                  │
│                                                                   │
│  Data shown: ALL filtered by client_id from JWT                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 STAGE 4: MONITORING & ANALYTICS (Future)

```
┌──────────────────────────────────────────────────────────────────┐
│            ADMIN MONITORING DASHBOARD (Phase 2)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  URL: /admin/monitoring (superadmin only)                        │
│                                                                   │
│  Real-time KPIs:                                                 │
│  ├─ Total Active Restaurants: 50                                 │
│  ├─ Monthly Revenue: ₹2.4L                                       │
│  ├─ Avg Orders/Restaurant: 120                                   │
│  ├─ System Uptime: 99.8%                                         │
│  └─ API Response Time: 145ms                                     │
│                                                                   │
│  Restaurant Health:                                              │
│  ├─ Last 30 days activity chart                                  │
│  ├─ Restaurants at risk (red): No activity > 7 days              │
│  ├─ Restaurants healthy (green): Daily activity                  │
│  └─ [Intervene] button to contact restaurant                     │
│                                                                   │
│  Features:                                                       │
│  ├─ Export reports (PDF, CSV)                                    │
│  ├─ Alerts: Server down, API errors, Payment failures            │
│  └─ Bulk actions: Send broadcast SMS/Email to restaurants        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          VAYUPOS COMPLETE FLOW                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│     PUBLIC (Landing Page)                                                    │
│     ├─ Visitor → Contact Form → POST /api/v1/leads                          │
│     │  └─ Database: leads table (status=NEW)                                 │
│     │                                                                        │
│     └─ Visitor → Free Trial Form → POST /api/v1/trials/request-otp          │
│        └─ Send OTP via SMS                                                   │
│           └─ Database: trial_accounts (status=OTP_PENDING)                   │
│              └─ Visitor enters OTP → POST /api/v1/trials/verify-otp         │
│                 ├─ Create User account                                       │
│                 ├─ Create Client (multi-tenant)                              │
│                 ├─ JWT token generated                                       │
│                 └─ Redirect to Trial POS Dashboard                           │
│                                                                               │
│     SUPERADMIN (Lead Management)                                             │
│     ├─ Login: POST /api/v1/auth/login (admin account)                       │
│     │  └─ JWT token with role='superadmin'                                   │
│     │                                                                        │
│     ├─ Dashboard: GET /api/v1/admin/leads                                    │
│     │  └─ Database: SELECT * FROM leads (all)                                │
│     │                                                                        │
│     ├─ View Lead Detail: GET /api/v1/admin/leads/{id}                       │
│     │  ├─ Database: SELECT FROM leads WHERE id = $1                          │
│     │  └─ Database: SELECT FROM communication_log WHERE lead_id = $1         │
│     │                                                                        │
│     ├─ Update Lead Status: PUT /api/v1/admin/leads/{id}/status              │
│     │  ├─ Database: UPDATE leads SET status = 'CONTACTED'                    │
│     │  └─ Database: INSERT INTO communication_log (action='STATUS_CHANGE')   │
│     │                                                                        │
│     ├─ Send Onboarding Link: POST /api/v1/admin/leads/{id}/onboarding-link  │
│     │  ├─ Database: INSERT INTO onboarding (onboarding_link)                 │
│     │  ├─ Generate unique link                                               │
│     │  └─ Send SMS to owner                                                  │
│     │                                                                        │
│     └─ Owner completes onboarding:                                           │
│        ├─ GET /onboard/{link}                                                │
│        ├─ POST /api/v1/onboarding/upload-documents                           │
│        │  └─ Database: UPDATE onboarding (owner_id_url, gst_cert_url)        │
│        │                                                                     │
│        └─ Superadmin verifies docs:                                          │
│           ├─ PUT /api/v1/admin/onboarding/{id}/approve                       │
│           │  ├─ Database: UPDATE onboarding (documents_verified=true)        │
│           │  └─ Database: UPDATE leads (status='READY_TO_PAY')               │
│           │                                                                  │
│           └─ Create Restaurant Account:                                      │
│              ├─ POST /api/v1/admin/leads/{id}/create-account                 │
│              ├─ Database: INSERT INTO clients                                │
│              ├─ Database: INSERT INTO customers                              │
│              ├─ Database: INSERT INTO users                                  │
│              ├─ Database: INSERT INTO subscriptions                          │
│              └─ Send login credentials to owner                              │
│                                                                               │
│     RESTAURANT POS (Multi-tenant)                                            │
│     ├─ Owner Login: POST /api/v1/auth/login                                  │
│     │  ├─ Database: SELECT user WHERE username = phone                       │
│     │  ├─ Extract client_id from user record                                 │
│     │  └─ Generate JWT with client_id                                        │
│     │                                                                        │
│     ├─ Dashboard: GET /api/v1/dashboard (with JWT)                           │
│     │  ├─ Decode JWT → extract client_id                                     │
│     │  ├─ Database: SELECT * FROM products WHERE client_id = $1              │
│     │  ├─ Database: SELECT * FROM orders WHERE client_id = $1                │
│     │  └─ Return only data for this restaurant                               │
│     │                                                                        │
│     ├─ Create Order: POST /api/v1/orders                                     │
│     │  ├─ Extract client_id from JWT                                         │
│     │  ├─ Database: INSERT INTO orders (client_id, ...)                      │
│     │  ├─ Database: INSERT INTO order_items (...)                            │
│     │  ├─ Database: INSERT INTO kot (client_id, ...)                         │
│     │  └─ Trigger: Update daily sales, KOT display                           │
│     │                                                                        │
│     ├─ Print Bill: GET /api/v1/orders/{id}/print                             │
│     │  ├─ Database: SELECT FROM orders WHERE id=$1 AND client_id=$2          │
│     │  └─ Generate PDF/Thermal print format                                  │
│     │                                                                        │
│     ├─ Manage Menu: POST/PUT/DELETE /api/v1/products                         │
│     │  └─ All operations filtered by client_id                               │
│     │                                                                        │
│     ├─ View Reports: GET /api/v1/reports/daily-sales?date=2026-04-22        │
│     │  ├─ Database: SELECT SUM(total_amount) FROM orders                     │
│     │  │            WHERE client_id=$1 AND DATE(created_at)='2026-04-22'     │
│     │  └─ Return aggregated data for this restaurant only                    │
│     │                                                                        │
│     └─ Export Reports: GET /api/v1/reports/export?format=xlsx                │
│        └─ Generate file with all data filtered by client_id                  │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Integration Points

### 1. Landing Page ↔ Trial Account
- **Trigger**: Visitor submits trial form
- **Backend creates**: User + Client + Trial Account
- **Result**: User redirected to POS dashboard

### 2. Trial Account ↔ Lead Management
- **Trigger**: Owner decides to upgrade OR trial expires
- **Backend creates**: Lead from trial account data
- **Superadmin**: Takes over from onboarding link stage

### 3. Lead ↔ Restaurant Account
- **Trigger**: Documents approved by superadmin
- **Backend creates**: Restaurant account (User, Client, Customer)
- **Result**: Owner gets credentials, logs into POS

### 4. POS ↔ Multi-tenancy
- **Trigger**: Owner logs in
- **Backend**: Extracts client_id from user
- **All queries**: Automatically filtered by client_id
- **Result**: Complete data isolation

---

## ✅ Validation Checklist

- [ ] Landing page loads (hero, features, pricing, contact modal)
- [ ] Contact form submission → lead created in database
- [ ] OTP sent to phone (manual verification for now)
- [ ] OTP verified → trial account + user + client created
- [ ] Trial user can login and access POS
- [ ] Superadmin can view leads list
- [ ] Superadmin can view lead detail + communication history
- [ ] Superadmin can send onboarding link
- [ ] Owner receives SMS with onboarding link
- [ ] Owner fills details + uploads documents
- [ ] Superadmin can approve/reject documents
- [ ] After approval, superadmin creates account
- [ ] Owner receives login credentials
- [ ] Owner logs in → sees data isolated to their restaurant
- [ ] Multi-tenancy working: 2 restaurants see different data
- [ ] End-to-end: Contact form → POS access (full flow)

---

## 📝 Notes

- **JWT Token**: Must include client_id so all queries know which restaurant
- **Tenant Filtering**: Every query has WHERE client_id = $1
- **Database**: All shared tables (leads, trial_accounts) have superadmin access
- **Communication Log**: Tracks all actions on a lead (audit trail)
- **Onboarding Link**: Unique, expires after 7 days, can be regenerated
- **Status Transitions**: Carefully designed to prevent invalid states
