# VayuPOS - Restaurant POS SaaS

## 🧾 Project Overview
VayuPOS is a comprehensive Point of Sale (POS) Software as a Service (SaaS) designed specifically for restaurants. The system is built with multi-tenant architecture, ensuring data isolation and security for each restaurant client.

**Key Features:**
- **POS Operations**: Seamless processing of restaurant orders and billing.
- **Order Management**: Real-time tracking and handling of customer orders.
- **KOT (Kitchen Order Ticket)**: Automated routing of orders to the kitchen for efficient preparation.
- **Inventory Management**: Tracking of raw ingredients, stock levels, and expenses.
- **Multi-tenant Architecture**: Robust support for multiple distinct restaurant clients on a single deployed instance.

---

## ⚙️ Tech Stack
- **Backend**: FastAPI (Python), SQLAlchemy ORM, Alembic
- **Frontend**: React.js with Vite
- **Database**: PostgreSQL (Hosted on Neon DB)
- **Hosting & Infrastructure**:
  - AWS EC2 (Backend Server)
  - Nginx (Reverse Proxy)
  - Cloudflare Pages (Frontend Deployment)

---

## 🧑‍💻 Local Development Setup

### Backend Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/vayu-pos.git
   cd vayu-pos/backend
   ```
2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables Configuration**
   Copy the example environment file and fill in your connection details.
   ```bash
   cp .env.example .env
   ```
5. **Run Database Migrations**
   ```bash
   alembic upgrade head
   ```
6. **Start the FastAPI Server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup
1. **Navigate to the frontend directory**
   ```bash
   cd ../frontend
   ```
2. **Install Node Modules**
   ```bash
   npm install
   ```
3. **Environment Variables Configuration**
   Copy the example environment file.
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL` points to your running backend (e.g., `http://localhost:8000`).
4. **Run the Development Server**
   ```bash
   npm run dev
   ```

---

## 🌍 Environment Variables

### Backend (`.env`)
Required variables for the backend to function:
- `DATABASE_URL` (Connection string to PostgreSQL)
- `SECRET_KEY` (Used for generating JWTs)
- `ALGORITHM` (JWT hashing algorithm, e.g., HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (Token expiration duration)

### Frontend (`.env`)
- `VITE_API_URL` (The base URL for the FastAPI backend API)

---

## 🚀 Production Deployment

### Backend (AWS EC2)
1. **SSH into your EC2 Instance** and clone the repository.
2. **Setup Python environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```
4. **Run Uvicorn** (Preferably as a systemd service):
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
5. **Setup Nginx Reverse Proxy** to forward traffic to port 8000.
6. **Setup SSL** using Certbot.

**Nginx Config Example:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Restart Commands:**
```bash
sudo systemctl restart nginx
sudo systemctl restart your-uvicorn-service
```

---

### ☁️ Frontend (Cloudflare Pages)
1. Log into your Cloudflare dashboard and go to **Pages**.
2. **Connect to your GitHub Repository** containing VayuPOS.
3. Configure the build settings:
   - **Root Directory**: `/frontend`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
4. **Environment Variables**:
   Add `VITE_API_URL` pointing to your production backend URL (e.g., `https://api.yourdomain.com`).
5. Save and deploy.

---

### 🗄️ Database (Neon PostgreSQL)
VayuPOS uses PostgreSQL for data persistence. Neon DB is recommended for serverless scalable hosting.
- **Connection String Format**: `postgresql+psycopg2://<user>:<password>@<host>/<dbname>?sslmode=require`
- Make sure to run `alembic upgrade head` after connecting to a fresh database to generate the necessary tables.

---

### 🔐 Authentication & Multi-Tenancy
- **JWT Authentication**: User sessions and API requests are secured using JSON Web Tokens.
- **Multi-tenant Support**: The system differentiates restaurant instances using a `client_id` associated with each authenticated user. 
- **Data Isolation**: Database queries automatically filter records based on the user's `client_id`, guaranteeing that one restaurant cannot access another's data.

---

### 🧪 Testing

- **Swagger Documentation**: Accessible at `/docs` (e.g., `http://localhost:8000/docs`). This provides an interactive interface for API testing.
- **API Testing Steps**:
  1. Login via the `/api/v1/auth/login` endpoint to receive your JWT.
  2. Use the "Authorize" button in Swagger to input your token.
  3. Test endpoints.
- **Multi-Tenant Testing**: Create multiple users belonging to different clients. Test queries to verify that user A can only view user A's data.

---

### ⚠️ Common Issues & Fixes

- **CORS Errors**: Ensure your frontend domain is added to the `ALLOWED_ORIGINS` list in `backend/app/main.py`.
- **Database Connection Issues**: Verify that your `DATABASE_URL` is correctly formatted and that IP restrictions on your DB host (like Neon) allow your machine/server to connect.
- **Migrations Not Applied**: If tables are missing, ensure you run `alembic upgrade head` from the `backend` directory.
- **Frontend API Mismatch**: If the frontend isn't fetching data, double-check that `VITE_API_URL` is correctly set and pointing to the backend.

---

### 📌 Future Improvements
- **Landing Page**: A beautiful public-facing site to market the VayuPOS SaaS to restaurants.
- **Superadmin Dashboard**: Centralized management portal for viewing SaaS metrics and managing tenant subscriptions.
- **Inventory Module Expansion**: Deepening the recipe management and raw ingredient tracking capabilities.
- **Advanced Reports**: Comprehensive analytics for sales trends and employee performance.