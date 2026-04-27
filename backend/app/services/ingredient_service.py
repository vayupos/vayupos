from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Ingredient, ProductIngredient, Stock, Product
from app.schemas.ingredient import IngredientCreate, IngredientUpdate, AddStockRequest
from app.core.exceptions import not_found_exception, conflict_exception

class IngredientService:
    @staticmethod
    def create_ingredient(db: Session, client_id: int, ingredient_in: IngredientCreate) -> Ingredient:
        # Check if ingredient name already exists for this client
        existing = db.query(Ingredient).filter(
            Ingredient.client_id == client_id,
            func.lower(Ingredient.name) == ingredient_in.name.lower().strip()
        ).first()
        if existing:
            raise conflict_exception("Ingredient already exists")
        
        db_obj = Ingredient(
            client_id=client_id,
            name=ingredient_in.name.strip(),
            unit=ingredient_in.unit
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Also create a stock entry
        stock_obj = Stock(
            client_id=client_id,
            ingredient_id=db_obj.id,
            available_quantity=ingredient_in.initial_stock,
            total_added=ingredient_in.initial_stock,
            total_used=0
        )
        db.add(stock_obj)
        db.commit()
        
        return db_obj

    @staticmethod
    def get_ingredient(db: Session, client_id: int, ingredient_id: int) -> Ingredient:
        ingredient = db.query(Ingredient).filter(
            Ingredient.id == ingredient_id,
            Ingredient.client_id == client_id
        ).first()
        if not ingredient:
            raise not_found_exception("Ingredient not found")
        return ingredient

    @staticmethod
    def list_ingredients(db: Session, client_id: int, skip: int = 0, limit: int = 100) -> Tuple[List[Ingredient], int]:
        query = db.query(Ingredient).filter(Ingredient.client_id == client_id)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def update_ingredient(db: Session, client_id: int, ingredient_id: int, ingredient_in: IngredientUpdate) -> Ingredient:
        db_obj = IngredientService.get_ingredient(db, client_id, ingredient_id)
        
        update_data = ingredient_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete_ingredient(db: Session, client_id: int, ingredient_id: int) -> None:
        db_obj = IngredientService.get_ingredient(db, client_id, ingredient_id)
        db.delete(db_obj)
        db.commit()

class StockService:
    @staticmethod
    def get_stock(db: Session, client_id: int, ingredient_id: int) -> Stock:
        stock = db.query(Stock).filter(
            Stock.ingredient_id == ingredient_id,
            Stock.client_id == client_id
        ).first()
        if not stock:
            # Create if missing (shouldn't happen but good for robustness)
            stock = Stock(client_id=client_id, ingredient_id=ingredient_id, available_quantity=0, total_added=0, total_used=0)
            db.add(stock)
            db.commit()
            db.refresh(stock)
        return stock

    @staticmethod
    def add_stock(db: Session, client_id: int, ingredient_id: int, quantity: float) -> Stock:
        stock = StockService.get_stock(db, client_id, ingredient_id)
        stock.available_quantity += quantity
        stock.total_added += quantity
        db.commit()
        db.refresh(stock)
        return stock

    @staticmethod
    def list_stock(db: Session, client_id: int, skip: int = 0, limit: int = 100) -> List[dict]:
        # Join with Ingredient to get name, unit and threshold
        query = db.query(Stock, Ingredient.name, Ingredient.unit, Ingredient.threshold).join(
            Ingredient, Stock.ingredient_id == Ingredient.id
        ).filter(Stock.client_id == client_id)
        
        results = query.offset(skip).limit(limit).all()
        
        stock_list = []
        for stock, name, unit, threshold in results:
            stock_list.append({
                "id": stock.id,
                "ingredient_id": stock.ingredient_id,
                "ingredient_name": name,
                "ingredient_unit": unit,
                "threshold": threshold,
                "available_quantity": stock.available_quantity,
                "total_added": stock.total_added,
                "total_used": stock.total_used,
                "updated_at": stock.updated_at
            })
        return stock_list

    @staticmethod
    def deduct_stock_for_order(db: Session, client_id: int, product_id: int, quantity_ordered: int):
        # Fetch ingredients for this product
        recipe = db.query(ProductIngredient).filter(
            ProductIngredient.product_id == product_id,
            ProductIngredient.client_id == client_id
        ).all()
        
        for item in recipe:
            total_deduction = item.quantity * quantity_ordered
            stock = StockService.get_stock(db, client_id, item.ingredient_id)
            stock.available_quantity -= total_deduction
            stock.total_used += total_deduction
            # We don't block here if stock goes negative, but we could add a check
            db.add(stock)
        
        db.commit()

    @staticmethod
    def get_low_stock_ingredients(db: Session, client_id: int) -> List[dict]:
        """Fetch ingredients where available_quantity <= threshold"""
        query = db.query(Stock, Ingredient.name, Ingredient.unit, Ingredient.threshold).join(
            Ingredient, Stock.ingredient_id == Ingredient.id
        ).filter(
            Stock.client_id == client_id,
            Stock.available_quantity <= Ingredient.threshold
        )
        
        results = query.all()
        stock_list = []
        for stock, name, unit, threshold in results:
            stock_list.append({
                "id": stock.id,
                "ingredient_id": stock.ingredient_id,
                "ingredient_name": name,
                "ingredient_unit": unit,
                "threshold": threshold,
                "available_quantity": stock.available_quantity,
                "total_added": stock.total_added,
                "total_used": stock.total_used,
                "updated_at": stock.updated_at
            })
        return stock_list
