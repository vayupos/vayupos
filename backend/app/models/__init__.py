"""Database models for POS application"""
from app.models.client import Client
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
from app.models.ingredient import Ingredient, ProductIngredient, Stock
from app.models.expense import Expense  # ← ADD THIS
from app.models.notification import Notification  # ← ADD THIS
from app.models.print_job import PrintJob
from app.models.password_reset_token import PasswordResetToken
from app.models.kot import KOT, KOTItem


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
     "DishTemplate",
     "Ingredient",
     "ProductIngredient",
     "Stock",
      "Expense",
      "Notification",
      "PrintJob",
      "PasswordResetToken",
      "KOT",
      "KOTItem",
      "Client",
]
