# Adding New Modules - Development Guide

This guide explains how to develop and test new modules in VayuPos while connected to the AWS database.

## 🎯 Module Architecture Overview

### Backend Structure:
```
backend/app/
├── api/v1/           # API endpoints/routes
│   ├── auth.py       # Authentication routes
│   ├── users.py      # User routes
│   ├── products.py   # Product routes
│   └── ...           # Other modules
├── models/           # SQLAlchemy ORM models
│   ├── user.py       # User model, Base setup
│   ├── product.py    # Product model
│   └── ...           # Other models
├── schemas/          # Pydantic validation schemas
│   ├── user.py       # User schemas (request/response)
│   ├── product.py    # Product schemas
│   └── ...           # Other schemas
├── services/         # Business logic layer
│   ├── auth_service.py
│   ├── user_service.py
│   └── ...           # Other services
└── core/             # Core configuration
    ├── config.py     # Settings from .env
    ├── database.py   # DB init & session
    ├── security.py   # JWT, passwords
    └── exceptions.py # Custom exceptions
```

---

## ✅ Step-by-Step: Adding a New Module

### Example: "Reviews" Module (Product Reviews)

#### Step 1: Create Database Model
**File:** `backend/app/models/review.py`

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.user import Base  # Import Base from user model

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    rating = Column(Float, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="reviews")
    customer = relationship("Customer", back_populates="reviews")
```

#### Step 2: Update Related Models
**File:** `backend/app/models/product.py` (Add relationship)

```python
# Add to Product class:
reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
```

**File:** `backend/app/models/customer.py` (Add relationship)

```python
# Add to Customer class:
reviews = relationship("Review", back_populates="customer", cascade="all, delete-orphan")
```

#### Step 3: Create Pydantic Schemas
**File:** `backend/app/schemas/review.py`

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ReviewBase(BaseModel):
    """Base review schema"""
    product_id: int = Field(..., gt=0, description="Product ID")
    customer_id: int = Field(..., gt=0, description="Customer ID")
    rating: float = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = Field(None, max_length=500, description="Review comment")

class ReviewCreate(ReviewBase):
    """Schema for creating a review"""
    pass

class ReviewUpdate(BaseModel):
    """Schema for updating a review"""
    rating: Optional[float] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)

class ReviewResponse(ReviewBase):
    """Schema for review response"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # For SQLAlchemy compatibility
```

#### Step 4: Create Service Layer
**File:** `backend/app/services/review_service.py`

```python
from sqlalchemy.orm import Session
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate
from fastapi import HTTPException

class ReviewService:
    @staticmethod
    def create_review(db: Session, review: ReviewCreate) -> Review:
        """Create a new review"""
        new_review = Review(**review.dict())
        db.add(new_review)
        db.commit()
        db.refresh(new_review)
        return new_review
    
    @staticmethod
    def get_review(db: Session, review_id: int) -> Review:
        """Get a review by ID"""
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        return review
    
    @staticmethod
    def get_product_reviews(db: Session, product_id: int, skip: int = 0, limit: int = 10):
        """Get all reviews for a product"""
        return db.query(Review)\
            .filter(Review.product_id == product_id)\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    @staticmethod
    def update_review(db: Session, review_id: int, review_update: ReviewUpdate) -> Review:
        """Update a review"""
        review = ReviewService.get_review(db, review_id)
        update_data = review_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(review, field, value)
        db.commit()
        db.refresh(review)
        return review
    
    @staticmethod
    def delete_review(db: Session, review_id: int):
        """Delete a review"""
        review = ReviewService.get_review(db, review_id)
        db.delete(review)
        db.commit()
        return {"message": "Review deleted successfully"}
```

#### Step 5: Create API Routes
**File:** `backend/app/api/v1/review.py`

```python
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.services.review_service import ReviewService

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"],
    responses={404: {"description": "Not found"}}
)

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    """Create a new product review"""
    return ReviewService.create_review(db, review)

@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: int, db: Session = Depends(get_db)):
    """Get a specific review"""
    return ReviewService.get_review(db, review_id)

@router.get("/product/{product_id}", response_model=list[ReviewResponse])
def get_product_reviews(product_id: int, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Get all reviews for a product"""
    return ReviewService.get_product_reviews(db, product_id, skip, limit)

@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(review_id: int, review_update: ReviewUpdate, db: Session = Depends(get_db)):
    """Update a review"""
    return ReviewService.update_review(db, review_id, review_update)

@router.delete("/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    """Delete a review"""
    return ReviewService.delete_review(db, review_id)
```

#### Step 6: Register in Main App
**File:** `backend/app/main.py`

```python
# Add to imports:
from app.api.v1 import review

# Add to app initialization (before startup event):
app.include_router(review.router)
```

Update the imports at the top:
```python
from app.api.v1 import (
    auth, users, products, categories,
    customers, orders, inventory, payment, reports,
    coupons, dish_templates, upload, staff, expense, notification, search,
    review  # Add this
)
```

#### Step 7: Create Database Migration
```powershell
cd backend
alembic revision --autogenerate -m "Add reviews table"
alembic upgrade head
```

#### Step 8: Write Tests
**File:** `backend/tests/test_reviews.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db

client = TestClient(app)

@pytest.fixture
def test_review_data():
    return {
        "product_id": 1,
        "customer_id": 1,
        "rating": 4.5,
        "comment": "Great product!"
    }

def test_create_review(test_review_data):
    response = client.post("/api/v1/reviews/", json=test_review_data)
    assert response.status_code == 201
    assert response.json()["rating"] == 4.5

def test_get_review():
    response = client.get("/api/v1/reviews/1")
    assert response.status_code in [200, 404]  # Might not exist

def test_get_product_reviews():
    response = client.get("/api/v1/reviews/product/1")
    assert response.status_code == 200

def test_update_review(test_review_data):
    # First create one
    create_response = client.post("/api/v1/reviews/", json=test_review_data)
    review_id = create_response.json()["id"]
    
    # Then update
    update_data = {"rating": 3.0}
    response = client.put(f"/api/v1/reviews/{review_id}", json=update_data)
    assert response.status_code == 200
```

#### Step 9: Test Locally
```powershell
# In backend directory
pytest tests/test_reviews.py -v

# Or test manually via API docs:
# http://127.0.0.1:8000/docs
# Try the POST /api/v1/reviews/ endpoint
```

---

## 🔄 Common Patterns

### Authentication-Protected Endpoint
```python
from app.core.security import get_current_user

@router.post("/", response_model=ReviewResponse)
def create_review(
    review: ReviewCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a review (requires authentication)"""
    review_data = review.dict()
    review_data["customer_id"] = current_user["id"]
    return ReviewService.create_review(db, ReviewCreate(**review_data))
```

### Pagination
```python
from fastapi import Query

@router.get("/", response_model=list[ReviewResponse])
def get_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get reviews with pagination"""
    return db.query(Review).offset(skip).limit(limit).all()
```

### Filtering
```python
@router.get("/product/{product_id}")
def get_product_reviews(
    product_id: int,
    min_rating: float = Query(None, ge=1, le=5),
    db: Session = Depends(get_db)
):
    """Get reviews filtered by rating"""
    query = db.query(Review).filter(Review.product_id == product_id)
    if min_rating:
        query = query.filter(Review.rating >= min_rating)
    return query.all()
```

---

## 🧪 Testing Module

### Run All Tests
```powershell
cd backend
pytest
```

### Run Specific Test File
```powershell
pytest tests/test_reviews.py -v
```

### Run with Coverage
```powershell
pytest --cov=app tests/
```

### Test Database Connection
```powershell
python -c "from app.core.database import SessionLocal; db = SessionLocal(); print('✅ DB Connected'); db.close()"
```

---

## 📋 Development Checklist

For each new module:
- [ ] Create model in `models/`
- [ ] Create schemas in `schemas/`
- [ ] Create service in `services/`
- [ ] Create routes in `api/v1/`
- [ ] Register routes in `main.py`
- [ ] Create database migration
- [ ] Write tests in `tests/`
- [ ] Test locally with AWS database
- [ ] Update this documentation

---

## 🐛 Debugging Tips

### View Database Changes
```powershell
# Connect to AWS database
psql -h database-1.cr8c6ywmy5p3.ap-south-1.rds.amazonaws.com -U postgres -d postgres

# List tables
\dt

# Check reviews table
SELECT * FROM reviews;

# Exit
\q
```

### Check FastAPI Docs
Navigate to: **http://127.0.0.1:8000/docs**
All endpoints will be listed with interactive testing!

### Backend Logs
Check the terminal where you ran `uvicorn` for detailed request logs and errors.

---

## ✨ Ready to Code!

You now have everything you need to:
1. Add new database models
2. Create API endpoints
3. Write business logic
4. Test everything locally
5. Deploy to AWS

Good luck! 🚀
