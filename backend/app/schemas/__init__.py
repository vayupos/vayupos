"""Pydantic schemas for API request/response validation"""
from app.schemas.response import *
from app.schemas.ingredient import (
    IngredientBase, IngredientCreate, IngredientUpdate, IngredientResponse,
    ProductIngredientBase, ProductIngredientCreate, ProductIngredientResponse,
    StockBase, StockUpdate, StockResponse, AddStockRequest
)
from app.schemas.dish_template import (    # ← ADD THIS
    DishTemplateBase,
    DishTemplateCreate,
    DishTemplateUpdate,
    DishTemplateOut,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    # Category
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    # Product
    "ProductBase",
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    # Customer
    "CustomerBase",
    "CustomerCreate",
    "CustomerUpdate",
    "CustomerResponse",
    # Order
    "OrderCreate",
    "OrderUpdate",
    "OrderResponse",
    "OrderItemCreate",
    "OrderItemResponse",
    # Payment
    "PaymentCreate",
    "PaymentUpdate",
    "PaymentResponse",
    # Inventory
    "InventoryLogCreate",
    "InventoryLogResponse",
     # DishTemplate  ← ADD THESE 4
    "DishTemplateBase",
    "DishTemplateCreate",
    "DishTemplateUpdate",
    "DishTemplateOut",
    # PrintJob
    "PrintJobCreate",
    "PrintJobResponse",
    # Generic
    "ResponseSchema",
    "PaginationParams",
    "LoginRequest",
    "ChangePasswordRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "TokenResponse",
    # Ingredient
    "IngredientBase", "IngredientCreate", "IngredientUpdate", "IngredientResponse",
    "ProductIngredientBase", "ProductIngredientCreate", "ProductIngredientResponse",
    "StockBase", "StockUpdate", "StockResponse", "AddStockRequest",
    # KOT
    "KOTResponse", "KOTItemUpdateStatus", "KOTItemUpdatePriority", "KOTItemCancel", "KOTItemResponse"
]
