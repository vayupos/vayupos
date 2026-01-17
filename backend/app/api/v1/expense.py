from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.expense_service import ExpenseService
from app.schemas import expense as schemas

router = APIRouter(prefix="/expenses", tags=["Expense"])

service = ExpenseService()

# ✅ FIXED: Add double decorators like staff routes
@router.get("", response_model=List[schemas.Expense])
@router.get("/", response_model=List[schemas.Expense])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    expenses = service.get_expenses(db=db, skip=skip, limit=limit)
    return expenses

@router.post("", response_model=schemas.Expense)
@router.post("/", response_model=schemas.Expense)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    return service.create_expense(db=db, expense=expense)

@router.get("/{expense_id}", response_model=schemas.Expense)
def read_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = service.get_expense(db=db, expense_id=expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/{expense_id}", response_model=schemas.Expense)
def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    updated = service.update_expense(db=db, expense_id=expense_id, expense=expense)
    if updated is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated

@router.delete("/{expense_id}", response_model=dict)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    success = service.delete_expense(db=db, expense_id=expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}