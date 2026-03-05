# Local Testing Guide - VayuPos with AWS Database

This guide helps you run and test the VayuPos application locally while connected to the AWS RDS PostgreSQL database.

## ✅ Prerequisites Verified
- Python 3.13.1 virtual environment: `.venv`
- Node.js v24.7.0 & npm 11.5.1
- Backend dependencies: ✅ Installed (FastAPI, SQLAlchemy, psycopg2, etc.)
- Frontend dependencies: ✅ Installed
- AWS Database: Configured in `backend/.env`

---

## 🚀 Quick Start (Terminal 1 - Backend)

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

The API will be available at: **http://127.0.0.1:8000**
Docs at: **http://127.0.0.1:8000/docs**

---

## 🎨 Quick Start (Terminal 2 - Frontend)

```powershell
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

The frontend will be available at: **http://localhost:5173**

---

## 🧪 Testing the Connection

### 1. **Test Backend Health**
```powershell
curl http://127.0.0.1:8000/health
```

### 2. **Test Database Connection**
```powershell
curl http://127.0.0.1:8000/api/v1/users/me -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. **View API Documentation**
Open in browser: **http://127.0.0.1:8000/docs**

### 4. **Run Backend Tests**
```powershell
cd backend
pytest -v
# Or specific test
pytest tests/test_auth.py -v
```

---

## 📝 Current Modules Available

### Backend API Endpoints (`/api/v1/`):
- ✅ **auth**: Login, registration, token refresh
- ✅ **users**: User management
- ✅ **products**: Product CRUD operations
- ✅ **categories**: Category management
- ✅ **customers**: Customer management
- ✅ **orders**: Order management
- ✅ **payments**: Payment processing
- ✅ **inventory**: Inventory tracking
- ✅ **coupons**: Coupon management
- ✅ **reports**: Reporting & analytics
- ✅ **dish_templates**: Dish template management
- ✅ **staff**: Staff management
- ✅ **expense**: Expense tracking
- ✅ **notification**: Notifications
- ✅ **search**: Global search
- ✅ **upload**: File uploads

### Frontend Pages (React + Vite):
- User authentication flows
- Dashboard
- Inventory management
- Order management
- Reporting
- And more...

---

## 🔌 Database Configuration

**Database Location:** AWS RDS PostgreSQL
- **Host:** database-1.cr8c6ywmy5p3.ap-south-1.rds.amazonaws.com
- **Port:** 5432
- **Database:** postgres
- **Region:** ap-south-1

**Configuration File:** `backend/.env`
```env
DATABASE_URL=postgresql://postgres:VayuPosDb2026@database-1.cr8c6ywmy5p3.ap-south-1.rds.amazonaws.com:5432/postgres
```

---

## 🛠️ Working on Remaining Modules

To develop new features:

1. **Backend**: Add endpoints in `app/api/v1/<module>.py`
2. **Frontend**: Add pages/components in `src/pages/` or `src/components/`
3. **Database**: Use Alembic migrations:
   ```powershell
   cd backend
   alembic revision --autogenerate -m "description of change"
   alembic upgrade head
   ```

---

## 📊 Common Development Tasks

### Add a New API Endpoint
```python
# In app/api/v1/new_module.py
from fastapi import APIRouter, Depends
from app.core.database import get_db

router = APIRouter(prefix="/new_module", tags=["new_module"])

@router.get("/")
def get_items(db = Depends(get_db)):
    return {"message": "Your response"}
```

### Add to Main App
Update `app/main.py` to include the new router:
```python
from app.api.v1 import new_module
# In app initialization:
app.include_router(new_module.router)
```

---

## ❌ Troubleshooting

### Port Already in Use
```powershell
# Kill process on port 8000 (backend)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Browser will use different port automatically for frontend
```

### Database Connection Issues
```powershell
# Test connection directly
python -c "from app.core.database import engine; print(engine.connect())"
```

### Module Import Errors
```powershell
# Ensure virtual environment is activated
.venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

---

## 📚 Project Structure
```
VayuPos/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # All API endpoints
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── core/          # Config, database, security
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # React components
│   │   ├── api/           # API client
│   │   └── redux/         # State management
│   └── .env               # Frontend env vars
└── database/              # Migrations & scripts
```

---

## ✨ Next Steps

1. **Terminal 1:** Start backend: `python -m uvicorn app.main:app --reload`
2. **Terminal 2:** Start frontend: `npm run dev`
3. **Browser:** Open http://localhost:5173
4. **API Docs:** Check http://127.0.0.1:8000/docs
5. **Start coding:** Develop your remaining modules!

Happy coding! 🚀
