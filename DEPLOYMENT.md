# Deploying VayuPos to Render

This guide explains how to deploy the VayuPos Restaurant POS system to Render with PostgreSQL database.

## Prerequisites

1. A Render account (https://render.com)
2. GitHub repository with your code
3. Git installed locally

## Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Step 2: Create PostgreSQL Database on Render

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `vayupos-db`
   - **Database**: `vayupos`
   - **User**: `vayupos_user`
   - **Region**: Choose closest to you
   - **Plan**: Free (or paid for production)
3. Click **Create Database**
4. Copy the **Internal Database URL** (starts with `postgresql://`)

## Step 3: Deploy Backend (FastAPI)

### Option A: Using render.yaml (Recommended)

1. Make sure `render.yaml` exists in your repository root
2. Go to Render Dashboard → **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and set up services

### Option B: Manual Setup

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `vayupos-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```

4. **Environment Variables** (Add these):
   ```
   DATABASE_URL = [Copy from your PostgreSQL database "Internal Database URL"]
   SECRET_KEY = [Generate a secure random string]
   JWT_ALGORITHM = HS256
   JWT_EXPIRATION = 3600
   DEBUG = False
   API_V1_STR = /api/v1
   PROJECT_NAME = VayuPos - POS System
   ```

5. Click **Create Web Service**

## Step 4: Run Database Migrations

After backend deployment:

1. Go to your backend service on Render
2. Click **Shell** tab
3. Run migrations:
   ```bash
   alembic upgrade head
   ```

## Step 5: Deploy Frontend (React)

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `vayupos-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL = https://vayupos-backend.onrender.com/api/v1
   VITE_API_HOST = https://vayupos-backend.onrender.com
   ```
   (Replace with your actual backend URL)

5. Click **Create Static Site**

## Step 6: Update Backend CORS

After getting your frontend URL:

1. Go to backend service → **Environment**
2. Add frontend URL to allowed origins if needed
3. The code already allows `*.onrender.com` domains

## Step 7: Test Your Deployment

1. Visit your frontend URL: `https://vayupos-frontend.onrender.com`
2. Try registering a new user
3. Login and test the POS features
4. Check backend logs for any errors

## Database Backup (Important!)

Set up automatic backups:

1. Go to your PostgreSQL database on Render
2. Click **Settings** → **Backups**
3. Enable automatic backups (paid plans)

Or manually backup:
```bash
pg_dump $DATABASE_URL > backup.sql
```

## Monitoring

- **Backend logs**: Go to backend service → **Logs**
- **Database metrics**: Go to PostgreSQL → **Metrics**
- **Frontend**: Check browser console for errors

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` environment variable
- Check if database is running
- Ensure backend is in same region as database

### CORS Errors
- Verify frontend URL is in CORS origins list
- Check `DEBUG=False` in production

### Static Files Not Loading
- Ensure `static` directory exists
- Check file upload paths
- Verify Render has write permissions

### Migration Failures
- Run migrations manually via Shell
- Check database schema
- Review migration files in `alembic/versions/`

## Cost Considerations

**Free Tier Limits:**
- Backend: Spins down after 15 min inactivity
- Database: 90 days, then deleted
- Static Site: Always on

**For Production:**
- Upgrade to paid plans for:
  - Always-on backend
  - Persistent database
  - Better performance
  - Automatic backups

## Next Steps

1. Set up custom domain
2. Enable SSL (automatic on Render)
3. Configure environment-specific settings
4. Set up monitoring and alerts
5. Create regular database backups

## Support

- Render Docs: https://render.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- PostgreSQL Docs: https://www.postgresql.org/docs/
