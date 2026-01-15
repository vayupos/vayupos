"""Database models for POS application"""
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.inventory_log import InventoryLog, InventoryAction
from app.models.coupon import Coupon  # ← ADD THIS
from app.models.dish_template import DishTemplate  
#from app.models.expense import Expense  # ← ADD THIS


__all__ = [
    "User",
    "UserRole",
    "Category",
    "Product",
    "Customer",
    "Order",
    "OrderStatus",
    "OrderItem",
    "Payment",
    "PaymentMethod",
    "PaymentStatus",
    "InventoryLog",
    "InventoryAction",
    "Coupon", 
     "DishTemplate" # ← ADD THIS
]
