ch# VayuPos - POS System Backend API

A comprehensive Point of Sale (POS) system backend built with FastAPI and SQLAlchemy. This API provides complete functionality for managing products, customers, orders, payments, inventory, and business analytics.

## Features

✅ **User Management**
- User registration and authentication with JWT
- Role-based access control (Admin, Manager, Cashier, Inventory Officer)
- User account management and password change

✅ **Product Management**
- Product CRUD operations
- Category management
- Barcode support
- Stock level tracking
- Product search functionality

✅ **Customer Management**
- Customer profiles with contact information
- Loyalty points system
- Customer search and filtering
- Purchase history tracking

✅ **Order Management**
- Order creation with multiple items
- Order status tracking (Pending, Completed, Cancelled, Refunded)
- Automatic inventory management
- Order number generation

✅ **Payment Processing**
- Multiple payment methods (Cash, Card, Mobile, etc.)
- Payment status tracking
- Refund handling
- Order payment status verification

✅ **Inventory Management**
- Real-time stock tracking
- Inventory logs for all transactions
- Low stock alerts
- Stock adjustments and audits

✅ **Business Analytics**
- Sales reports by date range
- Product sales analysis
- Payment method breakdown
- Daily sales summary
- Top customers report
- Inventory status report

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLAlchemy ORM (PostgreSQL/SQLite)
- **Authentication**: JWT with bcrypt
- **Validation**: Pydantic
- **PDF Generation**: ReportLab
- **Email**: SMTP

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd VayuPos/backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Linux/Mac
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For development
```

### 4. Environment Configuration
Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DATABASE_URL=sqlite:///./test.db
# For PostgreSQL: postgresql://user:password@localhost:5432/pos_db

# JWT
SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600

# Debug mode
DEBUG=True
```

### 5. Initialize Database
```bash
python -c "from app.core.database import init_db; init_db()"
```

### 6. Seed Database (Optional)
```bash
python scripts/seed_data.py
```

## Running the Application

### Development Server
```bash
uvicorn app.main:app --reload --port 8000
```

### Production Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register           - Register new user
POST   /api/v1/auth/login              - Login and get token
GET    /api/v1/auth/me                 - Get current user info
POST   /api/v1/auth/change-password    - Change password
```

### Users
```
GET    /api/v1/users/                  - List all users
GET    /api/v1/users/{user_id}         - Get user by ID
PUT    /api/v1/users/{user_id}         - Update user
DELETE /api/v1/users/{user_id}         - Deactivate user
POST   /api/v1/users/{user_id}/activate - Activate user
```

### Categories
```
POST   /api/v1/categories              - Create category
GET    /api/v1/categories              - List categories
GET    /api/v1/categories/{id}         - Get category
PUT    /api/v1/categories/{id}         - Update category
DELETE /api/v1/categories/{id}         - Delete category
```

### Products
```
POST   /api/v1/products                - Create product
GET    /api/v1/products                - List products
GET    /api/v1/products/{id}           - Get product
GET    /api/v1/products/search?q=      - Search products
GET    /api/v1/products/low-stock      - Get low stock products
PUT    /api/v1/products/{id}           - Update product
DELETE /api/v1/products/{id}           - Delete product
```

### Customers
```
POST   /api/v1/customers               - Create customer
GET    /api/v1/customers               - List customers
GET    /api/v1/customers/{id}          - Get customer
GET    /api/v1/customers/search?q=     - Search customers
PUT    /api/v1/customers/{id}          - Update customer
DELETE /api/v1/customers/{id}          - Delete customer
POST   /api/v1/customers/{id}/loyalty-points - Add loyalty points
```

### Orders
```
POST   /api/v1/orders                  - Create order
GET    /api/v1/orders                  - List orders
GET    /api/v1/orders/{id}             - Get order
PUT    /api/v1/orders/{id}             - Update order
POST   /api/v1/orders/{id}/cancel      - Cancel order
GET    /api/v1/orders/number/{number}  - Get by order number
GET    /api/v1/orders/customer/{id}    - Get customer orders
```

### Payments
```
POST   /api/v1/payments                - Create payment
GET    /api/v1/payments                - List payments
GET    /api/v1/payments/{id}           - Get payment
PUT    /api/v1/payments/{id}           - Update payment
POST   /api/v1/payments/{id}/refund    - Refund payment
GET    /api/v1/payments/order/{id}/status - Get payment status
```

### Inventory
```
POST   /api/v1/inventory/logs          - Create inventory log
GET    /api/v1/inventory/logs          - List inventory logs
GET    /api/v1/inventory/logs/{id}     - Get inventory log
GET    /api/v1/inventory/product/{id}/history - Product history
POST   /api/v1/inventory/product/{id}/adjust - Adjust stock
GET    /api/v1/inventory/summary       - Inventory summary
```

### Reports
```
GET    /api/v1/reports/sales           - Sales report
GET    /api/v1/reports/products-sales  - Product sales
GET    /api/v1/reports/payment-methods - Payment breakdown
GET    /api/v1/reports/inventory       - Inventory status
GET    /api/v1/reports/daily-summary   - Daily summary
GET    /api/v1/reports/customers       - Top customers
```

## Database Models

### User
- User authentication and role management
- Roles: Admin, Manager, Cashier, Inventory Officer

### Category
- Product categories for organization

### Product
- Product details including SKU, barcode, pricing
- Stock quantity and minimum stock level tracking

### Customer
- Customer information and contact details
- Loyalty points and total spending tracking

### Order
- Order header with status and totals
- Related order items and payments

### OrderItem
- Individual items in an order
- Product details at time of purchase

### Payment
- Payment records with multiple methods
- Payment status tracking

### InventoryLog
- Audit trail for all inventory movements
- Stock adjustments and sales tracking

## Testing

Run tests with pytest:
```bash
pytest tests/
pytest tests/ -v  # Verbose output
pytest tests/test_auth.py  # Specific test file
```

## Database Management

### Reset Database
```bash
python scripts/reset_db.py
```

### Backup Database
```bash
python scripts/backup_db.py
```

### Seed Test Data
```bash
python scripts/seed_data.py
```

## Default Test Credentials

After seeding, use these credentials:
- **Admin**: username: `admin`, password: `admin123`
- **Cashier**: username: `cashier1`, password: `cashier123`
- **Manager**: username: `manager1`, password: `manager123`

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── products.py
│   │   │   ├── categories.py
│   │   │   ├── customers.py
│   │   │   ├── orders.py
│   │   │   ├── inventory.py
│   │   │   ├── payment.py
│   │   │   └── reports.py
│   │   └── dependencies.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── exceptions.py
│   ├── models/
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   ├── order_item.py
│   │   ├── payment.py
│   │   └── inventory_log.py
│   ├── schemas/
│   │   ├── response.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   ├── payment.py
│   │   └── category.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── product_service.py
│   │   ├── customer_service.py
│   │   ├── order_service.py
│   │   ├── payment_service.py
│   │   ├── inventory_service.py
│   │   └── report_service.py
│   ├── utils/
│   │   ├── email.py
│   │   ├── helpers.py
│   │   ├── validators.py
│   │   ├── barcode_generator.py
│   │   └── pdf_generator.py
│   ├── middleware/
│   │   ├── auth_middleware.py
│   │   ├── cors_middleware.py
│   │   └── error_handler.py
│   └── main.py
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_products.py
│   ├── test_customers.py
│   └── test_orders.py
├── scripts/
│   ├── seed_data.py
│   ├── reset_db.py
│   └── backup_db.py
├── alembic/
│   └── versions/
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── pytest.ini
└── README.md
```

## API Authentication

All protected endpoints require a Bearer token in the Authorization header:

```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:8000/api/v1/users/
```

## Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Create a pull request

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.
