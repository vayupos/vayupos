# VayuPos — Deployment Reference

Infrastructure already provisioned:
- **Database**: Neon PostgreSQL
- **Backend**: AWS EC2 (Ubuntu)
- **Frontend**: Cloudflare Pages → `app.vayupos.com`
- **API domain**: `api.vayupos.com` → EC2

---

## Environment Variables

### Backend — `backend/.env` (on EC2)

Sourced from actual code — every line maps to a real import:

| Variable | Required | Code location |
|---|---|---|
| `DATABASE_URL` | YES | `app/core/database.py:10` |
| `SECRET_KEY` | YES | `app/core/security.py:91` — signs every JWT |
| `ADMIN_SECRET_KEY` | YES | `app/api/v1/admin.py:23`, `app/api/v1/superadmin.py:79` |
| `ALLOWED_ORIGINS` | YES | `app/main.py:74` (CORS) + `app/services/auth_service.py:149` (reset email base URL) |
| `JWT_EXPIRATION` | no | `app/core/security.py:85` — defaults to `86400` (24h) |
| `R2_ACCESS_KEY` | no | `app/api/v1/upload.py:13` — if blank, images save to local disk |
| `R2_SECRET_KEY` | no | `app/api/v1/upload.py:14` |
| `R2_ENDPOINT` | no | `app/api/v1/upload.py:15` |
| `R2_BUCKET_NAME` | no | `app/api/v1/upload.py:16` |
| `R2_PUBLIC_URL` | no | `app/api/v1/upload.py:17` |
| `SMTP_HOST` | no | `app/utils/auth_email.py:22` — if blank, reset link prints to logs |
| `SMTP_PORT` | no | `app/utils/auth_email.py:45` — defaults to `587` |
| `SMTP_USER` | no | `app/utils/auth_email.py:47` |
| `SMTP_PASSWORD` | no | `app/utils/auth_email.py:47` |
| `EMAILS_FROM_EMAIL` | no | `app/utils/auth_email.py:25` — defaults to `info@vayupos.com` |
| `EMAILS_FROM_NAME` | no | `app/utils/auth_email.py:25` — defaults to `VayuPos Support` |

> `DEFAULT_PRINTER_IP` and `DEFAULT_PRINTER_PORT` are in config.py but read nowhere — skip them.
> `redis` is in requirements.txt but imported nowhere — EC2 does not need Redis.

**Minimum working `.env`:**
```env
DATABASE_URL=postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
SECRET_KEY=<64-char random string>
ADMIN_SECRET_KEY=<64-char random string>
ALLOWED_ORIGINS=https://app.vayupos.com,https://vayupos.com,http://localhost:8080

R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_ENDPOINT=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

Generate `SECRET_KEY` and `ADMIN_SECRET_KEY`:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
# run twice — one for each key
```

---

### Frontend — Cloudflare Pages environment variables

Set these in: Cloudflare Dashboard → Pages → your project → Settings → Environment variables

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://api.vayupos.com/api/v1` |
| `VITE_API_HOST` | `https://api.vayupos.com` |

These are baked into the build at build time by Vite. They are NOT read at runtime.
Any time you change them you must trigger a new build.

---

## Phase 1 — Local Migrations (run this first before deploying)

This verifies migrations work before they hit production.

```bash
# 1. Enter backend
cd backend

# 2. Activate venv (create if first time)
python3 -m venv venv
source venv/bin/activate          # Linux/Mac
# venv\Scripts\activate           # Windows

# 3. Install deps
pip install -r requirements.txt

# 4. Create local .env pointing at Neon (never local DB for migrations)
cp .env.example .env
# Edit .env — set DATABASE_URL to the Neon connection string
# Set SECRET_KEY and ADMIN_SECRET_KEY to anything (local testing only)

# 5. Check current migration state
alembic heads       # should show 1 head: b0c1d2e3f4a5
alembic current     # shows what revision Neon DB is currently at

# 6. Run migrations
alembic upgrade head

# 7. Verify
alembic current     # should now match alembic heads
```

If `alembic heads` shows more than 1 revision:
```bash
# Get the head IDs
alembic heads

# Merge them into one
alembic merge <rev1> <rev2> -m "merge heads"

# Then upgrade
alembic upgrade head
```

---

## Phase 2 — Backend Redeploy (EC2)

Every time you push new code to `main`:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@<ec2-ip>

# Run the redeploy script
cd ~/vayupos/backend/deploy
bash redeploy.sh
```

What `redeploy.sh` does:
1. `git reset --hard origin/main` — pulls latest
2. `pip install -r requirements.txt` — installs new deps if any
3. Checks for multiple alembic heads, auto-merges if found, then runs `alembic upgrade head`
4. Restarts the backend service (systemd or nohup depending on `USE_SYSTEMD` flag)
5. Hits `/health` and reports status

**First time you run `redeploy.sh`** — edit the path at the top:
```bash
APP_DIR=~/vayupos/backend    # adjust to match where your repo is cloned
USE_SYSTEMD=true              # false if using nohup (old setup)
```

If the old developer cloned to `~/Vayupos_frontend`:
```bash
APP_DIR=~/Vayupos_frontend/backend
USE_SYSTEMD=false   # old setup used nohup
```

**Watch live logs:**
```bash
# systemd
sudo journalctl -u vayupos-backend -f

# nohup (old style)
tail -f ~/vayupos-output.log
```

---

## Phase 3 — Frontend Redeploy (Cloudflare Pages)

Cloudflare Pages auto-deploys every time you push to `main`. Nothing to do manually.

To trigger manually (e.g. env vars changed):
- Cloudflare Dashboard → Pages → your project → **Deployments** → **Retry deployment**

Build settings (set once in Cloudflare dashboard, never needs to change):
```
Build command:   npm run build
Build output:    dist
Root directory:  frontend
Node version:    20
```

---

## The Full Deploy Flow (every time)

```
1. Make code changes locally
2. cd backend && source venv/bin/activate
3. alembic upgrade head          ← run against Neon, verify migrations work
4. git add . && git commit -m "..." && git push origin main
5. SSH into EC2 → bash redeploy.sh
6. Cloudflare Pages auto-deploys frontend
```

---

## Rotate Credentials

Changing `SECRET_KEY` logs out every user (their JWT becomes invalid). Do this intentionally.

| What | Where | After rotating |
|---|---|---|
| Neon password | Neon → Settings → Reset password | Update `DATABASE_URL` in EC2 `.env`, restart backend |
| `SECRET_KEY` | generate new → update EC2 `.env` | Restart backend — all users forced to re-login |
| `ADMIN_SECRET_KEY` | generate new → update EC2 `.env` | Restart backend |
| R2 API token | Cloudflare → R2 → Manage API Tokens | Update `R2_ACCESS_KEY` + `R2_SECRET_KEY` in EC2 `.env`, restart |

After any `.env` change on EC2:
```bash
sudo systemctl restart vayupos-backend
# or (old nohup style):
pkill -f uvicorn && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/output.log 2>&1 &
```

---

## Database Reset (Neon SQL Editor)

**Wipe data, keep accounts:**
```sql
TRUNCATE TABLE
  order_items, order_coupons, orders, payments,
  kot_items, kots,
  inventory_log, ingredients, product_ingredients,
  coupon_categories, coupons,
  dish_templates, notifications,
  customers, expenses, staff, products, categories,
  password_reset_tokens, invite_tokens
CASCADE;
```

**Full wipe (drops schema, rebuilds from alembic):**
```bash
# On EC2, in backend/ with venv active
alembic downgrade base
alembic upgrade head
```
