from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, condecimal

# Common decimal type for weights
Weight = condecimal(max_digits=10, decimal_places=2)

class IngredientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    unit: str = Field(default="grams", max_length=50)
    threshold: int = Field(default=10, ge=0)

class IngredientCreate(IngredientBase):
    initial_stock: Decimal = Field(default=0, ge=0)

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    threshold: Optional[int] = Field(default=None, ge=0)

class StockBase(BaseModel):
    ingredient_id: int
    available_quantity: Weight

class StockUpdate(BaseModel):
    available_quantity: Weight

class StockResponse(StockBase):
    id: int
    client_id: int
    ingredient_name: Optional[str] = None
    ingredient_unit: Optional[str] = None
    threshold: Optional[int] = None
    total_added: Optional[Weight] = None
    total_used: Optional[Weight] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class IngredientResponse(IngredientBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: datetime
    stock: Optional[StockResponse] = None

    class Config:
        from_attributes = True

class ProductIngredientBase(BaseModel):
    ingredient_id: int
    quantity: Weight

class ProductIngredientCreate(ProductIngredientBase):
    pass

class ProductIngredientResponse(ProductIngredientBase):
    id: int
    ingredient_name: Optional[str] = None
    ingredient_unit: Optional[str] = None

    class Config:
        from_attributes = True

class AddStockRequest(BaseModel):
    quantity: Weight
