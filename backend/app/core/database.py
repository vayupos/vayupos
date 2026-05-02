from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

# Get settings which loads .env file
settings = get_settings()

# Database URL from settings
DATABASE_URL = settings.DATABASE_URL

# Clean the URL from whitespace
DATABASE_URL = DATABASE_URL.strip()

# Create sync engine only (avoid async greenlet issues)
# Convert asyncpg URL to sync if necessary for the synchronous engine
sync_url = DATABASE_URL
if "postgresql+asyncpg://" in sync_url:
    sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql://")

engine = create_engine(
    sync_url,
    connect_args={"check_same_thread": False} if "sqlite" in sync_url else {},
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Create SessionLocal class for existing sync logic
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import Base from models (models.user creates it to avoid circular dependency)
from app.models.user import Base, User
from app.models.category import Category
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.models.inventory_log import InventoryLog
from app.models.notification import Notification
from app.models.coupon import Coupon
from app.models.coupon_category import CouponCategory
from app.models.dish_template import DishTemplate
from app.models.expense import Expense
from app.models.order_coupon import OrderCoupon
from app.models.staff import Staff
from app.models.password_reset_token import PasswordResetToken
from app.models.invite_token import InviteToken
from app.models.client import Client
from app.models.kot import KOT, KOTItem
from app.models.ingredient import Ingredient, ProductIngredient, Stock

# Dependency to get DB session (Sync)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database by creating all tables (Sync)"""
    Base.metadata.create_all(bind=engine)
