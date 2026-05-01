# VayuPOS — Restaurant POS SaaS

A comprehensive Point of Sale system built for restaurants, with multi-tenant architecture so multiple restaurants share one deployment.

**Tech Stack:**
- **Backend**: FastAPI (Python), SQLAlchemy ORM, Alembic migrations
- **Frontend**: React 18 + Vite 6, Tailwind CSS v4, Redux
- **Database**: PostgreSQL on Neon (serverless)
- **Hosting**: AWS EC2 (backend) · Cloudflare Pages (frontend) · Cloudflare R2 (file storage)

**Live URLs:**
- App: `https://app.vayupos.com`
- API: `https://api.vayupos.com`
- API docs: `https://api.vayupos.com/docs`

---

## Local Development

### 1. Clone the repo

```bash
git clone https://github.com/vayupos/vayupos.git
cd vayupos
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env — fill in DATABASE_URL and SECRET_KEY at minimum

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# .env already has correct localhost defaults — no changes needed for local dev

# Start dev server
npm run dev
# App available at http://localhost:8080
```

> **Quick start on Windows**: run `.\start-dev.ps1` from the repo root to open both servers in separate terminals.

---

## Environment Variables

### Backend (`backend/.env`)

See [backend/.env.example](backend/.env.example) for the full list with descriptions. Required fields:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `SECRET_KEY` | Random 32+ char string for JWT signing |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_EXPIRATION` | Token lifetime in seconds (default `3600`) |
| `FRONTEND_URL` | Your frontend origin for CORS |
| `ADMIN_SECRET_KEY` | Secret for superadmin setup and restaurant registration |

### Frontend (`frontend/.env`)

See [frontend/.env.example](frontend/.env.example). Two variables, both default to localhost:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full API URL including `/api/v1` |
| `VITE_API_HOST` | API host only — used to build absolute image URLs |

> **Production**: set these in the Cloudflare Pages dashboard, not in any file.

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full step-by-step guide covering EC2, Neon, Cloudflare Pages, R2, DNS, and SSL.

**Quick update after a code push:**

```bash
# On EC2
cd ~/vayupos
git reset --hard origin/main
cd backend && source venv/bin/activate && pip install -r requirements.txt && deactivate
sudo systemctl restart vayupos
```

Frontend deploys automatically on every push to `main` via Cloudflare Pages.

---

## Project Structure

```
vayupos/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Route handlers
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── core/            # Config, database, security
│   ├── alembic/             # Database migrations
│   ├── .env.example         # All env vars documented
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # One file per route
│   │   ├── components/      # Shared UI components
│   │   ├── api/             # Axios instances
│   │   ├── redux/           # Global state
│   │   └── utils/           # Helpers (PDF, Excel export)
│   └── .env.example
├── local_print_agent/       # Windows agent for LAN thermal printers
├── DEPLOYMENT.md
└── start-dev.ps1            # Windows: starts both servers
```

---

## Common Issues

**CORS errors** — add your frontend domain to `ALLOWED_ORIGINS` in `backend/app/main.py`, restart service.

**Database connection fails** — check `DATABASE_URL` in `backend/.env`. Test with:
```bash
python -c "from app.core.database import engine; from sqlalchemy import text; print(engine.connect().execute(text('SELECT 1')).scalar())"
```

**Migrations not applied** — run `alembic upgrade head` from the `backend/` directory with venv active.

**Frontend not hitting the API** — check `VITE_API_URL` in `frontend/.env` (local) or Cloudflare Pages environment variables (production).
