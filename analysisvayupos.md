# VayuPos POS System - WORKING FEATURES ONLY
**Analysis Date:** April 19, 2026

---

## 1️⃣ DASHBOARD — What's Working

✅ **Real-time Metrics:**
- Today's Total Sales (₹ amount)
- Total Orders Count (today)
- Average Ticket Value (avg order amount)
- Total Expenses (today)

✅ **Recent Activity:**
- Last 5 orders (with status & amount)
- Recent customers
- Available offers/coupons
- Recent staff activity
- Daily expenses
- Activity feed

✅ **Features:**
- Data fetches on page load via API: `/reports/daily-summary?date={today}`
- Refresh button to reload all data
- Staff access control (shows message if access denied)
- Real-time data from backend
- Error handling for failed API calls

---

## 2️⃣ POS — What's Working

**Core Features:**
✅ **Customer Selection**
- Select existing customers from dropdown
- Quick "Guest" option for walk-ins
- Search customers by name
- Pre-select customer from Customers page → POS page

✅ **Menu & Item Selection**
- Browse products by category (All, or specific category)
- Search menu items (real-time search)
- Group items by size variants (Small/Medium/Large)
- Add items to cart with quantity
- Load pagination for menu (shows 3 rows initially, load more button)

✅ **Shopping Cart**
- Add items with different sizes
- Adjust quantities (Increase/Decrease buttons)
- Remove items from cart
- Display subtotal per item
- Real-time total calculation

✅ **Discounts & Coupons**
- Apply coupon codes
- View available coupons
- Show ineligible coupons (grayed out)
- Manual discount entry (₹ amount)
- Coupon validation before applying

✅ **Create Order**
- Customer selection (with add new customer modal)
- Add order notes
- Submit complete order to backend
- Auto-generates KOT (Kitchen Order Ticket)
- Creates notification on order creation
- Stock deduction happens automatically

✅ **Order Metadata**
- Order notes (table number, special requests)
- Customer information pre-population
- Payment method selection (optional at POS stage)
- Order status tracking

### Full Order Flow:
```
Customer Selection → Menu Browsing → Add Items → Coupon Application → Create Order → KOT Generation → Payment
```

---

## 3️⃣ KOT — How It Works

**Auto-Generated on Order Creation:**
- When order is created in POS, `OrderService.create_order()` automatically calls `PrintService.create_kot_for_order()`
- No manual KOT creation needed

**Smart Grouping by Printer:**
- Items grouped by category
- Each category can have different printer (IP/Port)
- Multiple KOTs created if multiple printers needed
- Example: Food items → Kitchen Printer, Drinks → Bar Printer

**Content Generation:**
- Formats order items for 80mm thermal printer (42 chars wide)
- Includes:
  - Header (Restaurant name)
  - KOT Number
  - Table Number (extracted from notes)
  - Date/Time
  - Item list (Qty + Name)
  - Special notes
  - ESC/POS cut command (`\x1dV\x01`)

**Kitchen Display System:**
- `/print-jobs/pending` endpoint shows unprinted KOTs
- Staff can mark as printed: POST `/print-jobs/{id}/mark-printed`
- Tracks printing status (pending/printed)

**Database Storage:**
- All KOT data stored in `print_jobs` table
- Linked to orders
- Contains printer IP/Port, content, status

### KOT Example Output:
```
                MY RESTAURANT
==========================================
KOT #: ORD-2026-001
Table: A5
Date: 19-04-2026 14:30
------------------------------------------
QTY ITEM
------------------------------------------
2   Paneer Roll
1   Masala Chai
3   Veg Manchurian
------------------------------------------
Notes:
No onion, Extra salt
------------------------------------------
[Paper feed + cut command]
```

---

## 4️⃣ PRINTING — What's Implemented

**KOT Printing (Backend Ready)**
- ESC/POS formatted output ready for 80mm thermal printers
- Default settings: 192.168.1.150:9100 (TCP socket)
- Content generated for Bixby P58, RPP02, POS-58 models
- Paper width: 58mm or 80mm configurable
- Cut commands included

**Bill Printing (Browser Print)**
- Bill format: HTML page render
- Route: `/print-bill/{orderId}` 
- Uses browser's `window.print()` function
- User can print to any connected printer (USB, network, PDF)
- Includes order details, items, total, date, time
- Print styling with page breaks and layout

**KOT Printer Settings Page**
- UI to configure printer settings
- Search for Bluetooth printers (BT-P58A, RPP02, POS-58)
- Save settings to localStorage
- Configure paper width, font size, header/footer text
- ESC/POS density settings

---

## 5️⃣ EXPENSES — What's Working

**Available Fields:**
- `amount` - Expense amount (₹)
- `category` - Expense type (Utilities, Rent, etc.)
- `description` - Details about expense
- `date` - Expense date
- `due_date` - When payment is due (optional)
- `staff_id` - Employee associated (optional)

**Current Features:**
- ✅ Create Expense - POST `/expenses` with amount, category, description, date
- ✅ Read Expenses - GET `/expenses?skip=0&limit=100` with pagination
- ✅ Get Single Expense - GET `/expenses/{id}`
- ✅ Update Expense - PUT `/expenses/{id}` to modify details
- ✅ Delete Expense - DELETE `/expenses/{id}`
- ✅ Filter by date range
- ✅ Dashboard Integration - Fetch upcoming salaries, link staff salary to expenses
- ✅ Auto-create expense when salary paid
- ✅ Export to Excel (XLSX)
- ✅ Export to PDF
- ✅ Filter by category
- ✅ Calculate totals
- ✅ Daily Expenses Dashboard - Show today's expenses, total calculation, staff salary tracking

---

## 6️⃣ OFFERS — What's Working

**Discount Types Supported:**
- Percentage Discount - 10%, 20%, 50% off (max 100%)
- Fixed Amount - ₹100, ₹500 off (flat discount)

**Coupon Features:**
- Unique coupon codes
- Expiration Date - Auto-disable after date
- Usage Limits - Track uses, prevent over-use
- Minimum Order Amount - e.g., "Min ₹500 order"
- Category-Specific - Apply to specific product categories
- Status - Active/Inactive toggle

**Capabilities:**
- Create coupon with code, discount type, discount value
- Set applicable categories (link to product categories)
- Limit usage count
- Set expiration date
- Apply multiple coupon validations:
  - Check if expired
  - Check if usage limit exceeded
  - Check minimum order amount
  - Check applicable categories
  - Prevent duplicate application

**In POS:**
- Search and apply coupons by code
- Show available coupons list
- Mark ineligible coupons (grayed out)
- Calculate final discount
- Display on bill

**Reporting:**
- View all offers/coupons
- Search by code/category
- Export to Excel/PDF
- Filter by status/expiration
- Track coupon usage

**Example Coupons:**
- "WELCOME10" - 10% off, min ₹300
- "FESTIVE50" - ₹50 off, expires Dec 31
- "PIZZA20" - 20% off, category=Pizza, valid 5 times

---

## 7️⃣ CUSTOMERS — What's Working

**Customer Fields:**
- `id` - Primary key
- `first_name` - Customer first name
- `last_name` - Customer last name
- `phone` - Phone number (unique)
- `email` - Email (unique)
- `address` - Street address
- `city` - City
- `state` - State
- `zip_code` - Postal code
- `country` - Country (default: India)
- `loyalty_points` - Reward points balance
- `total_spent` - Lifetime spending (calculated)
- `created_at` - Registration date

**Features:**
- ✅ Add Customer - Quick add from POS page
- ✅ Full details form (name, phone, email, address, city, state, zip, country)
- ✅ Phone number validation
- ✅ Email validation
- ✅ View Customer - List with search
- ✅ Customer profile card (name, phone, email, address)
- ✅ Order history (past orders linked)
- ✅ Total spent calculation
- ✅ Loyalty points display
- ✅ Initials avatar
- ✅ Edit Customer - Update all customer fields, save changes, sync with backend
- ✅ Search & Filter by name, phone, email
- ✅ Filter by order date range
- ✅ Pagination support
- ✅ Orders Tracking - View all customer orders with order number, date, total, status, items count
- ✅ Export customer list to Excel
- ✅ Export to PDF
- ✅ View customer statistics

---

## 8️⃣ MENU — What's Working

**Product/Menu Structure:**
- Products stored in `products` table with fields:
  - `name` - Product name
  - `price` - Price
  - `category_id` - Product category link
  - `sku` - Stock keeping unit
  - `image_url` - Product image URL
  - `description` - Product description
  - `is_active` - Enable/disable product

**How Items Are Added:**

- ✅ Manual Add via Menu Page - Click "+ Add Item" button
- ✅ Form opens with fields: Product name, Category (dropdown), Price (₹), SKU, Description, Image upload, Status (Active/Inactive)
- ✅ POST `/products` sends to backend
- ✅ Image stored locally in `/static/uploads/products/`
- ✅ Via CSV Import - Export template → Fill with products → Import CSV
- ✅ Batch add multiple items at once
- ✅ Map columns (name, price, category, sku, etc.)

**Size/Variant Handling:**
- Manual approach: Add as separate products with naming pattern
- Example: "Tea (Small)", "Tea (Medium)", "Tea (Large)"
- Frontend groups by base name automatically

---

## 9️⃣ REPORTS — What's Working

**Available Report Endpoints:**
1. ✅ **Sales Report** - GET `/reports/sales`
   - Date range filtering
   - Group by: day/week/month
   - Returns: revenue data

2. ✅ **Product Sales Report** - GET `/reports/products-sales`
   - Top selling products
   - Configurable limit
   - Returns: product name, quantity sold

3. ✅ **Daily Summary** - GET `/reports/daily-summary?date=YYYY-MM-DD`
   - Today's sales total
   - Order count
   - Average order value
   - Total expenses

**Frontend Report Capabilities:**
- ✅ See daily sales total
- ✅ See order count
- ✅ See top products
- ✅ See daily expenses

---

## 🔟 LOGIN/AUTH — How It Works

**Login Method:**
✅ **Username + Password**
- Username (not email) - Required
- Password - Required (min 6 characters)

**Auth Flow:**
1. User enters username & password
2. Frontend POST `/auth/login` with `{ username, password }`
3. Backend validates:
   - User exists
   - Password matches (bcrypt)
   - User is active (is_active = true)
4. Returns:
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refresh_token": "...",
     "token_type": "bearer"
   }
   ```
5. Frontend stores:
   - `access_token` in localStorage
   - `isAuthenticated: true` flag
6. All subsequent requests include: `Authorization: Bearer {access_token}`

**Features:**
✅ Register new user - POST `/auth/register`
✅ Get current user - GET `/auth/me`
✅ Change password - POST `/auth/change-password`
✅ JWT token validation on every request
✅ Protected routes check `isAuthenticated` flag
✅ Automatic redirect to login if token missing

**Security:**
✅ Passwords hashed with bcrypt
✅ JWT tokens with 1-hour expiration
✅ Refresh token support
✅ HS256 algorithm for signing

---

## 1️⃣1️⃣ TECH STACK CONFIRMED

**Frontend Stack:**
- Framework: React 18+ (with hooks)
- Build Tool: Vite
- Styling: TailwindCSS
- UI State: Redux (store, slices, selectors)
- Router: React Router v6 (BrowserRouter, Routes, Navigate)
- HTTP Client: Axios (wrapped in custom `/api/axios`)
- Charts: Recharts (LineChart, PieChart, BarChart)
- Export: XLSX (Excel), jsPDF + autoTable (PDF)
- UI Components: shadcn/ui, Lucide Icons
- Environment: Vite with `import.meta.env` variables

**Backend Stack:**
- Framework: FastAPI (Python)
- ORM: SQLAlchemy 2.0
- Database Driver: psycopg2-binary (PostgreSQL)
- Authentication: python-jose + JWT
- Password Hashing: bcrypt (via passlib)
- Database Migrations: Alembic
- Task Queue: Redis
- File Upload: boto3 (AWS S3) + local fallback
- PDF/Barcode: reportlab, python-barcode
- API Validation: Pydantic v2
- CORS: fastapi CORSMiddleware
- Async: asyncpg (async PostgreSQL driver)

**Database:**
- Type: PostgreSQL (on AWS RDS)
- Host: `database-1.cr8c6ywmy5p3.ap-south-1.rds.amazonaws.com`
- Port: 5432
- Database: `postgres`
- User: `postgres`
- Tables (16 total): users, products, categories, customers, orders, order_items, payments, coupons, coupon_category, order_coupon, staff, inventory_logs, expenses, notifications, print_jobs, dish_templates

**Architecture:**
- Single Restaurant Instance (not multi-tenant)
- No `client_id` or `tenant_id` fields
- All data in single database/tables

---

## 1️⃣2️⃣ SUMMARY — WHAT'S OPERATIONAL

| Feature | Status | 
|---------|--------|
| **Dashboard** | ✅ Basic metrics working |
| **POS** | ✅ Full order creation |
| **KOT** | ✅ Auto-generated & stored |
| **Bill Printing** | ✅ Browser print working |
| **Expenses** | ✅ Full CRUD + reporting |
| **Offers/Coupons** | ✅ All types working |
| **Customers** | ✅ Full CRUD + history |
| **Menu** | ✅ Manual & CSV add |
| **Reports** | ✅ 3 data endpoints |
| **Login** | ✅ Username/password working |
| **Frontend** | ✅ React + Vite + Tailwind |
| **Backend** | ✅ FastAPI + SQLAlchemy |
| **Database** | ✅ PostgreSQL on AWS RDS |

