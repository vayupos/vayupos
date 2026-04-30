# VayuPOS Deployment Guide

**Stack:** AWS EC2 (backend) · Neon PostgreSQL (database) · Cloudflare Pages (frontend) · Cloudflare R2 (file storage) · Cloudflare DNS

---

## What We're Setting Up

```
Your PC (push code)
        ↓
   GitHub repo
   ↙          ↘
EC2 Ubuntu      Cloudflare Pages
(FastAPI)       (React app)
    ↓               ↓
api.vayupos.com   app.vayupos.com
    ↓
Neon PostgreSQL  +  Cloudflare R2
(database)          (images/uploads)
```

---

## Prerequisites

- A GitHub account (your code is already pushed)
- A domain name (e.g. `vayupos.com`) — registered anywhere, DNS will be moved to Cloudflare
- Credit card for AWS (free tier eligible for first year)
- A Cloudflare account (free)
- A Neon account (free tier available at neon.tech)

---

## Step 1 — Neon PostgreSQL (Database)

### 1.1 Create account and project

1. Go to **https://neon.tech** → Sign Up (free)
2. Click **New Project**
3. Fill in:
   - **Project name**: `vayupos`
   - **Postgres version**: 16
   - **Region**: `AWS ap-southeast-1 Singapore` (closest to Mumbai EC2)
4. Click **Create project**

### 1.2 Get your connection string

1. On the project dashboard, click **Connection string** tab
2. Change the connection type dropdown to **psycopg2**
3. Copy the string — it looks like:
   ```
   postgresql+psycopg2://vayupos_owner:AbCdEf123@ep-cool-term-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this string** — you'll need it in the next step

---

## Step 2 — AWS EC2 (Backend Server)

### 2.1 Launch EC2 instance

1. Go to **https://console.aws.amazon.com** → Sign in
2. Top right corner: change region to **Asia Pacific (Mumbai) ap-south-1**
3. Go to **EC2** → **Launch Instance**
4. Configure:
   - **Name**: `vayupos-backend`
   - **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD — 64-bit x86
   - **Instance type**: `t3.small` (recommended) or `t2.micro` (free tier)
   - **Key pair**: Click **Create new key pair**
     - Name: `vayupos-key`
     - Type: RSA
     - Format: `.pem`
     - Click **Create key pair** — this downloads `vayupos-key.pem` to your PC
   - **Network settings**: Click **Edit**
     - Allow SSH from **My IP**
     - Add rule: **HTTP**, port 80, from **Anywhere**
     - Add rule: **HTTPS**, port 443, from **Anywhere**
     - Add rule: **Custom TCP**, port 8000, from **Anywhere** (temporary, for testing)
   - **Storage**: 20 GB gp3
5. Click **Launch instance**

### 2.2 Get a static IP (Elastic IP)

1. In EC2 left sidebar → **Elastic IPs**
2. Click **Allocate Elastic IP address** → **Allocate**
3. Select the new IP → **Actions** → **Associate Elastic IP address**
4. Instance: choose `vayupos-backend` → **Associate**
5. **Note down this IP address** (e.g. `13.232.45.67`) — this is your server's permanent IP

### 2.3 Connect to the server

On your PC, open a terminal (Git Bash or PowerShell):

```bash
# Move your key file somewhere safe and fix permissions
chmod 400 ~/Downloads/vayupos-key.pem

# Connect (replace 13.232.45.67 with your Elastic IP)
ssh -i ~/Downloads/vayupos-key.pem ubuntu@13.232.45.67
```

> **Windows tip**: If `chmod` doesn't work, right-click `vayupos-key.pem` → Properties → Security → Advanced → Disable inheritance → Remove all → Add yourself with Read only.

### 2.4 Install system packages

Once connected via SSH, run these commands one by one:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11, pip, venv, git, nginx
sudo apt install -y python3.11 python3.11-venv python3-pip git nginx certbot python3-certbot-nginx

# Verify Python
python3.11 --version
```

### 2.5 Clone your repository

```bash
# Go to home directory
cd ~

# Clone your repo (replace with your actual GitHub URL)
git clone https://github.com/rithin2004/vayupos.git

# Enter backend directory
cd vayupos/backend
```

### 2.6 Set up Python virtual environment

```bash
# Create virtual environment
python3.11 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2.7 Create the .env file

```bash
# Create and open the .env file
nano .env
```

Paste the following, replacing all values in `< >` brackets:

```env
# Database — paste your Neon connection string here
DATABASE_URL="postgresql+psycopg2://<neon_user>:<neon_password>@<neon_endpoint>.neon.tech/neondb?sslmode=require"

# Security — generate a strong random key (see below for how)
SECRET_KEY="<your-strong-random-key>"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION=3600
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# App
DEBUG=False
API_V1_STR="/api/v1"
PROJECT_NAME="VayuPos - POS System"
app_name="POS Backend API"
app_version="1.0.0"
FRONTEND_URL="https://app.vayupos.com"

# Admin secret — use to create superadmin and register restaurants
# Make this something only you know, like: VayuAdmin@2026!SecureKey
ADMIN_SECRET_KEY="<make-up-a-strong-secret>"

# Cloudflare R2 (fill these after Step 3)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY=""
R2_SECRET_KEY=""
R2_BUCKET_NAME="vayupos-uploads"
R2_ENDPOINT=""
R2_PUBLIC_URL=""

# SMTP (optional — leave blank for now)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASSWORD=""
EMAILS_FROM_EMAIL="info@vayupos.com"
EMAILS_FROM_NAME="VayuPos Support"
```

**To generate a SECRET_KEY**, run this in a separate terminal:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copy the output and paste it as your SECRET_KEY.

Press `Ctrl+X`, then `Y`, then `Enter` to save the file.

### 2.8 Test the application runs

```bash
# Still in ~/vayupos/backend with venv activated
uvicorn app.main:app --host 0.0.0.0 --port 8000

# You should see:
# [OK] Database migrations completed
# [OK] Database initialized
# Uvicorn running on http://0.0.0.0:8000
```

Open in browser: `http://<your-ec2-ip>:8000` — you should see `{"status": "VayuPOS Backend Live"}`

Press `Ctrl+C` to stop.

### 2.9 Create a systemd service (keeps app running forever)

```bash
# Deactivate venv first
deactivate

# Create service file
sudo nano /etc/systemd/system/vayupos.service
```

Paste this (replace `ubuntu` with your username if different, and fix the path):

```ini
[Unit]
Description=VayuPOS FastAPI Backend
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/vayupos/backend
Environment="PATH=/home/ubuntu/vayupos/backend/venv/bin"
ExecStart=/home/ubuntu/vayupos/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Press `Ctrl+X`, `Y`, `Enter` to save.

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable vayupos
sudo systemctl start vayupos

# Check it's running
sudo systemctl status vayupos
# Should show: Active: active (running)

# View logs
sudo journalctl -u vayupos -f
```

### 2.10 Set up Nginx (web server / reverse proxy)

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/vayupos
```

Paste this (replace `api.vayupos.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name api.vayupos.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/ubuntu/vayupos/backend/static/;
    }
}
```

Press `Ctrl+X`, `Y`, `Enter` to save.

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vayupos /etc/nginx/sites-enabled/

# Test config
sudo nginx -t
# Should say: syntax is ok, test is successful

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 2.11 Add SSL certificate (HTTPS)

> Do this AFTER you've set up DNS in Step 5 and the domain is pointing to this server.

```bash
sudo certbot --nginx -d api.vayupos.com
# Follow prompts — enter your email, agree to terms
# Choose option 2: Redirect HTTP to HTTPS
```

---

## Step 3 — Cloudflare R2 (File Storage for product images)

### 3.1 Create R2 bucket

1. Go to **https://dash.cloudflare.com** → Sign in
2. Left sidebar → **R2 Object Storage**
3. Click **Create bucket**
4. Name: `vayupos-uploads`, Region: `APAC` → **Create bucket**

### 3.2 Make bucket public

1. Click on `vayupos-uploads` → **Settings** tab
2. Scroll to **Public access** → **Allow Access**
3. Copy the **Public bucket URL** (looks like `https://pub-abc123.r2.dev`) — save this

### 3.3 Create API token

1. R2 page → top right **Manage R2 API Tokens** → **Create API token**
2. Token name: `vayupos-backend`
3. Permissions: **Object Read & Write**
4. Bucket: `vayupos-uploads`
5. Click **Create API Token**
6. **Copy and save** the Access Key ID and Secret Access Key (shown only once)

### 3.4 Get your Account ID

- Right side of R2 dashboard page → **Account ID** — copy it

### 3.5 Update .env on the server

```bash
ssh -i ~/Downloads/vayupos-key.pem ubuntu@<your-ec2-ip>
nano ~/vayupos/backend/.env
```

Fill in the R2 values:
```env
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY="your-access-key-id"
R2_SECRET_KEY="your-secret-access-key"
R2_BUCKET_NAME="vayupos-uploads"
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-abc123.r2.dev"
```

Then restart the service:
```bash
sudo systemctl restart vayupos
```

---

## Step 4 — Cloudflare Pages (Frontend)

### 4.1 Add your domain to Cloudflare (if not already)

1. Go to **https://dash.cloudflare.com** → **Add a site**
2. Enter `vayupos.com` → **Add site** → choose **Free plan**
3. Cloudflare will show you 2 nameservers (e.g. `dana.ns.cloudflare.com`)
4. Go to wherever you bought your domain → change nameservers to the Cloudflare ones
5. Wait 5–30 minutes for DNS to propagate

### 4.2 Deploy frontend to Cloudflare Pages

1. Cloudflare dashboard → left sidebar → **Workers & Pages** → **Pages**
2. Click **Create a project** → **Connect to Git**
3. Connect your GitHub account → select the `vayupos` repository
4. Configure the build:
   - **Project name**: `vayupos-frontend`
   - **Production branch**: `main`
   - **Framework preset**: None (or Vite)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory (advanced)**: `frontend`
5. Expand **Environment variables** → **Add variable**:
   - `VITE_API_URL` = `https://api.vayupos.com/api/v1`
   - `VITE_API_HOST` = `https://api.vayupos.com`
6. Click **Save and Deploy**

Wait 2–3 minutes for the first build. You'll get a URL like `vayupos-frontend.pages.dev`.

### 4.3 Add custom domain to Pages

1. On your Pages project → **Custom domains** tab
2. Click **Set up a custom domain**
3. Enter `app.vayupos.com` → **Continue**
4. Cloudflare will automatically add the DNS record → **Activate domain**

---

## Step 5 — Cloudflare DNS Setup

1. Cloudflare dashboard → your domain → **DNS** → **Records**
2. Add these records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `api` | `13.232.45.67` (your EC2 Elastic IP) | Proxied (orange cloud) |

> The `app.vayupos.com` record is added automatically by Cloudflare Pages in Step 4.3.

3. After adding the `api` record, wait 5 minutes, then test:
   - Open browser: `http://api.vayupos.com` → should show `{"status": "VayuPOS Backend Live"}`

---

## Step 6 — Update CORS in backend code

On your EC2 server:

```bash
nano ~/vayupos/backend/app/main.py
```

Find the `ALLOWED_ORIGINS` list and make sure it includes your production domains:

```python
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://app.vayupos.com",
    "https://vayupos-frontend.pages.dev",   # Cloudflare Pages preview URL
]
```

Remove the `"*"` wildcard entry for production security. Then:

```bash
sudo systemctl restart vayupos
```

Also update [frontend/.env.production](frontend/.env.production) in your local code and push:
```env
VITE_API_URL=https://api.vayupos.com/api/v1
VITE_API_HOST=https://api.vayupos.com
```

---

## Step 7 — Post-Deployment Setup

### 7.1 Create the superadmin account

Run this once (replace values with your actual ADMIN_SECRET_KEY and password):

```bash
curl -X POST https://api.vayupos.com/api/v1/superadmin/setup \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: <your-ADMIN_SECRET_KEY>" \
  -d '{"email": "vayupos20@gmail.com", "password": "YourStrongPassword123!", "full_name": "VayuPOS Admin"}'
```

Expected response:
```json
{"message": "Superadmin created successfully", "email": "vayupos20@gmail.com"}
```

> After this, go to `https://app.vayupos.com/superadmin/login` and log in with `vayupos20@gmail.com` and your password.

### 7.2 Register your 5 beta restaurants

For each restaurant, run (replace values):

```bash
curl -X POST https://api.vayupos.com/api/v1/admin/register-restaurant \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: <your-ADMIN_SECRET_KEY>" \
  -d '{
    "restaurant_name": "Spice Garden",
    "owner_name": "Ramesh Kumar",
    "phone": "9876543210",
    "email": "spicegarden@example.com",
    "city": "Hyderabad",
    "username": "spicegarden",
    "password": "TempPass@123",
    "trial_days": 30
  }'
```

The response includes the `client_id` — share the username+password with each restaurant owner.

> **Alternatively**, once you're logged into the superadmin dashboard at `/superadmin/dashboard`, you can use the **Add Restaurant** button to create restaurants through the UI.

---

## Step 8 — Keeping the Server Updated

When you push new code to GitHub:

```bash
# SSH into server
ssh -i ~/Downloads/vayupos-key.pem ubuntu@<your-ec2-ip>

# Pull latest code
cd ~/vayupos
git pull origin main

# Activate venv and install any new dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Restart backend (migrations run automatically on startup)
sudo systemctl restart vayupos

# Check it started OK
sudo systemctl status vayupos
```

The frontend updates automatically — every push to `main` triggers a new Cloudflare Pages build.

---

## Troubleshooting

### "502 Bad Gateway" on api.vayupos.com
```bash
# Check if the service is running
sudo systemctl status vayupos

# View recent error logs
sudo journalctl -u vayupos --since "5 minutes ago"
```

### Migration errors on first start
```bash
cd ~/vayupos/backend
source venv/bin/activate
python -m alembic upgrade head
deactivate
sudo systemctl restart vayupos
```

### "CORS error" in browser console
- Make sure your production domain is in the `ALLOWED_ORIGINS` list in `main.py`
- Restart the service after editing: `sudo systemctl restart vayupos`

### Cannot connect to database
```bash
# Test the connection string from the server
cd ~/vayupos/backend
source venv/bin/activate
python -c "from app.core.database import engine; from sqlalchemy import text; print(engine.connect().execute(text('SELECT 1')).scalar())"
```
Output should be `1`. If it errors, check your `DATABASE_URL` in `.env`.

### Frontend build fails on Cloudflare Pages
- Check the build log in Cloudflare Pages dashboard
- Common fix: make sure `VITE_API_URL` environment variable is set in Pages settings (not just in the `.env.production` file)

### SSL certificate not renewing
Certbot auto-renews. To check: `sudo certbot renew --dry-run`

---

## Security Checklist Before Going Live

- [ ] `ADMIN_SECRET_KEY` is a strong, unique value (not `change-me-in-production`)
- [ ] `SECRET_KEY` for JWT is a random 32+ character string
- [ ] `DEBUG=False` in `.env`
- [ ] Port 8000 removed from EC2 security group (Nginx handles traffic now)
- [ ] SSH key file (`vayupos-key.pem`) is stored safely and not committed to git
- [ ] `.env` file is in `.gitignore` (it is — never commit secrets)
- [ ] Superadmin password is strong and stored somewhere safe

---

## Monthly Costs (Approximate)

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| EC2 t3.small | On-demand | ~$15 USD |
| Neon PostgreSQL | Free tier | $0 (up to 0.5GB) |
| Cloudflare Pages | Free | $0 |
| Cloudflare R2 | Free tier | $0 (up to 10GB) |
| Domain name | Annual | ~$10-15/year |
| **Total** | | **~$15–20/month** |

> To reduce cost further, use EC2 t2.micro (free tier for first 12 months) but it may be slow under load.
