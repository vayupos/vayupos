# VayuPOS System Flow - Visual Diagrams

## 1️⃣ Complete User Journey (4 Stages)

```mermaid
graph TD
    A["👤 PUBLIC USER"] --> B["🌐 Landing Page"]
    B --> C{User Action?}
    C -->|"Contact Form"| D["📧 Lead Form"]
    D --> E["💾 Lead Created<br/>status: NEW"]
    C -->|"Free Trial"| F["🆓 Trial Signup"]
    F --> G["📱 OTP Verification"]
    G --> H["✅ Trial Account<br/>Auto User + Client Created"]
    H --> I["🍽️ Trial POS<br/>30-day access"]
    
    I --> J{30 Days?}
    J -->|Expires| K["❌ Access Blocked"]
    J -->|Wants Upgrade| L["📞 Upgrade Request"]
    K --> L
    L --> M["👔 SUPERADMIN<br/>Lead Management"]
    
    E --> M
    M --> N["📋 Lead Status<br/>NEW→CONTACTED→DEMO..."]
    N --> O["✅ Documents<br/>Verified"]
    O --> P["🎫 Account Created<br/>Restaurant Setup"]
    P --> Q["🎁 Restaurant Owner<br/>Gets Credentials"]
    Q --> R["🍽️ RESTAURANT POS<br/>Multi-tenant"]
    R --> S["💳 Active Subscription"]
    S --> T["🚀 Full Features<br/>POS, KOT, Reports, etc"]
```

## 2️⃣ Lead Management Status Workflow

```mermaid
stateDiagram-v2
    [*] --> NEW: Contact Form
    NEW --> CONTACTED: Call Owner
    CONTACTED --> DEMO_SCHEDULED: Schedule Demo
    DEMO_SCHEDULED --> DEMO_SHOWN: Complete Demo
    DEMO_SHOWN --> FOLLOW_UP: Follow-up Set
    FOLLOW_UP --> READY_TO_PAY: Owner Agrees
    READY_TO_PAY --> ONBOARDING: Docs Submitted
    ONBOARDING --> ACTIVE: Verified ✅
    
    NEW --> REJECTED: Manual Reject
    CONTACTED --> REJECTED: Not Interested
    DEMO_SHOWN --> REJECTED: Not Convinced
    ONBOARDING --> REJECTED: Docs Invalid
    
    ACTIVE --> CHURNED: Subscription Ends
    REJECTED --> [*]
    CHURNED --> [*]
    ACTIVE --> [*]: Success ✅
```

## 3️⃣ Landing Page → Lead → Superadmin Loop

```mermaid
graph LR
    A["🌐 app.vayupos.com<br/>Landing Page"]
    B["📝 Contact Form<br/>Restaurant Name,<br/>Owner, Phone, Email"]
    C["💾 INSERT leads<br/>status=NEW"]
    D["👔 Superadmin<br/>Dashboard"]
    E["📞 Assign Salesperson<br/>Schedule Demo"]
    F["📋 Track Communication<br/>Add Notes"]
    G["✅ Documents<br/>Verify"]
    H["🎫 Create<br/>Restaurant Account"]
    I["🍽️ POS Access<br/>Login Creds Sent"]
    
    A -->|Submit| B
    B -->|POST /api/v1/leads| C
    C -->|Notification| D
    D -->|Manage Lead| E
    E --> F
    F --> G
    G --> H
    H -->|SMS| I
```

## 4️⃣ OTP Trial Account Flow

```mermaid
sequenceDiagram
    participant User
    participant Landing
    participant Backend
    participant SMS
    participant Database
    
    User->>Landing: 1. Click "Free Trial"
    Landing->>Backend: 2. POST /trials/request-otp
    Backend->>Database: 3. Generate OTP + Create trial_accounts
    Backend->>SMS: 4. Send OTP (6 digits)
    SMS->>User: 5. SMS: "Your OTP is 123456"
    User->>Landing: 6. Enter OTP
    Landing->>Backend: 7. POST /trials/verify-otp
    Backend->>Database: 8. Verify OTP + Create User + Client
    Backend->>Landing: 9. JWT Token + Redirect
    Landing->>User: 10. ✅ Logged in! Access POS
```

## 5️⃣ Multi-Tenant Data Isolation

```mermaid
graph TD
    A["Restaurant Owner<br/>Logs In"]
    A -->|Username + Password| B["POST /api/v1/auth/login"]
    B --> C["SELECT user WHERE<br/>username = phone"]
    C --> D["Extract client_id<br/>from user record"]
    D --> E["Generate JWT<br/>with client_id"]
    E --> F["All API Calls"]
    
    F -->|GET /products| G["WHERE client_id<br/>= $extracted"]
    F -->|GET /orders| H["WHERE client_id<br/>= $extracted"]
    F -->|POST /products| I["INSERT with client_id<br/>= $extracted"]
    
    G --> J["✅ Only show THIS<br/>restaurant's data"]
    H --> K["✅ Only show THIS<br/>restaurant's orders"]
    I --> L["✅ Only create for THIS<br/>restaurant"]
    
    M["Restaurant A<br/>client_id: ABC123"]
    N["Restaurant B<br/>client_id: XYZ789"]
    
    J --> M
    K --> M
    I --> M
```

## 6️⃣ Document Upload & Verification

```mermaid
sequenceDiagram
    participant Superadmin
    participant Backend
    participant Owner
    participant Database
    participant SMS
    
    Superadmin->>Backend: 1. Send onboarding link
    Backend->>Database: 2. CREATE onboarding record
    Backend->>SMS: 3. Send SMS with link
    SMS->>Owner: 4. "Click here: app.vayupos.com/onboard/{link}"
    
    Owner->>Backend: 5. Fill details + Upload docs
    Backend->>Database: 6. UPDATE onboarding (owner_id_url, gst_url)
    Backend->>Superadmin: 7. Notification: "Docs ready"
    
    Superadmin->>Backend: 8. APPROVE documents
    Backend->>Database: 9. UPDATE (documents_verified=true)
    Backend->>SMS: 10. Send: "Documents approved!"
    
    Superadmin->>Backend: 11. Create restaurant account
    Backend->>Database: 12. INSERT clients, customers, users
    Backend->>SMS: 13. Send login credentials
    SMS->>Owner: 14. Phone + Password (temp)
```

## 7️⃣ Complete Data Flow - API Calls

```mermaid
graph TD
    subgraph "Stage 1: Public"
        A["POST /leads<br/>Contact Form"]
        B["POST /trials/request-otp<br/>Send OTP"]
        C["POST /trials/verify-otp<br/>Verify OTP"]
    end
    
    subgraph "Stage 2: Superadmin"
        D["GET /admin/leads<br/>List all leads"]
        E["GET /admin/leads/{id}<br/>Lead detail"]
        F["PUT /admin/leads/{id}/status<br/>Update status"]
        G["POST /admin/leads/{id}/onboarding<br/>Send link"]
        H["PUT /admin/onboarding/{id}/approve<br/>Verify docs"]
        I["POST /admin/leads/{id}/create-account<br/>Create account"]
    end
    
    subgraph "Stage 3: Restaurant POS"
        J["POST /auth/login<br/>Owner login"]
        K["GET /dashboard<br/>View dashboard"]
        L["POST /orders<br/>Create order"]
        M["GET /products<br/>View menu"]
        N["GET /reports<br/>View reports"]
    end
    
    A --> D
    B --> C
    C --> K
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    K --> M
    L --> N
```

## 8️⃣ Database Schema Relationships

```mermaid
erDiagram
    LEADS ||--|| TRIAL_ACCOUNTS : "same_user"
    LEADS ||--|| ONBOARDING : "has"
    LEADS ||--o{ COMMUNICATION_LOG : "tracked_by"
    LEADS ||--|| CUSTOMERS : "converts_to"
    
    TRIAL_ACCOUNTS ||--|| USERS : "creates"
    USERS ||--|| CLIENTS : "belongs_to"
    
    ONBOARDING ||--|| USERS : "verified_by"
    ONBOARDING ||--|| USERS : "creates_restaurant_user"
    
    CUSTOMERS ||--|| CLIENTS : "represents"
    CUSTOMERS ||--|| USERS : "has_relationship_manager"
    
    CLIENTS ||--o{ PRODUCTS : "has"
    CLIENTS ||--o{ ORDERS : "has"
    CLIENTS ||--o{ USERS : "has_staff"
    CLIENTS ||--o{ SUBSCRIPTIONS : "has"
    
    SUBSCRIPTIONS ||--|| CUSTOMERS : "belongs_to"
    
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "in"
    
    KOT ||--o{ KOT_ITEMS : "contains"
    PRODUCTS ||--o{ KOT_ITEMS : "in"
    
    COMMUNICATION_LOG ||--|| USERS : "created_by"
```

## 9️⃣ Authentication & Authorization

```mermaid
graph TD
    A["User tries to access<br/>protected endpoint"]
    B["Authorization header<br/>contains JWT token?"]
    C["Decode JWT"]
    D{Valid signature<br/>& not expired?}
    E["Extract: user_id,<br/>client_id, role"]
    F{Endpoint permission<br/>matches role?}
    G["Attach user_id +<br/>client_id to request"]
    H["Execute query with<br/>WHERE client_id = $1"]
    I["Return filtered data"]
    
    J["❌ No token"]
    K["❌ Invalid/Expired"]
    L["❌ Unauthorized"]
    
    A --> B
    B -->|No| J
    B -->|Yes| C
    C --> D
    D -->|No| K
    D -->|Yes| E
    E --> F
    F -->|No| L
    F -->|Yes| G
    G --> H
    H --> I
```

## 🔟 Success Metrics

```mermaid
graph TD
    A["Lead Created"]
    B["✅ Contact Form Submitted"]
    C["✅ Lead in Database"]
    
    D["Trial Started"]
    E["✅ OTP Verified"]
    F["✅ User + Client Created"]
    G["✅ Can access POS"]
    
    H["Lead Converted"]
    I["✅ Documents Approved"]
    J["✅ Account Created"]
    K["✅ Credentials Sent"]
    L["✅ Active Subscription"]
    
    M["Revenue Generated"]
    N["✅ Monthly Billing"]
    O["✅ Report Analytics"]
    
    A --> B --> C
    D --> E --> F --> G
    H --> I --> J --> K --> L
    M --> N --> O
```
