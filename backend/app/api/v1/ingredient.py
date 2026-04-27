from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.ingredient import (
    IngredientCreate, IngredientUpdate, IngredientResponse,
    StockResponse, AddStockRequest
)
from app.services.ingredient_service import IngredientService, StockService

router = APIRouter()

@router.post("/", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
def create_ingredient(
    ingredient_in: IngredientCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return IngredientService.create_ingredient(db, current_user["client_id"], ingredient_in)

@router.get("/", response_model=List[IngredientResponse])
def list_ingredients(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items, _ = IngredientService.list_ingredients(db, current_user["client_id"], skip, limit)
    return items

@router.get("/{ingredient_id}", response_model=IngredientResponse)
def get_ingredient(
    ingredient_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return IngredientService.get_ingredient(db, current_user["client_id"], ingredient_id)

@router.put("/{ingredient_id}", response_model=IngredientResponse)
def update_ingredient(
    ingredient_id: int,
    ingredient_in: IngredientUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return IngredientService.update_ingredient(db, current_user["client_id"], ingredient_id, ingredient_in)

@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(
    ingredient_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    IngredientService.delete_ingredient(db, current_user["client_id"], ingredient_id)
    return None

# Stock Endpoints
@router.get("/stock/all", response_model=List[dict])
def list_stock(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return StockService.list_stock(db, current_user["client_id"], skip, limit)

@router.get("/stock/low", response_model=List[dict])
def list_low_stock(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return StockService.get_low_stock_ingredients(db, current_user["client_id"])

@router.post("/{ingredient_id}/add-stock", response_model=dict)
def add_stock(
    ingredient_id: int,
    payload: AddStockRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stock = StockService.add_stock(db, current_user["client_id"], ingredient_id, payload.quantity)
    return {"message": "Stock updated", "available_quantity": stock.available_quantity}
