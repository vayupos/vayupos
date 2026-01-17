from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import traceback

from app.core.database import get_db
from app.services.expense_service import ExpenseService
from app.schemas import expense as schemas

router = APIRouter(prefix="/expenses", tags=["Expense"])
service = ExpenseService()

# GET all expenses with error handling
@router.get("", response_model=List[schemas.Expense])
@router.get("/", response_model=List[schemas.Expense])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        print(f"📊 Fetching expenses with skip={skip}, limit={limit}")
        expenses = service.get_expenses(db=db, skip=skip, limit=limit)
        print(f"✅ Found {len(expenses)} expenses")
        return expenses
    except Exception as e:
        print(f"❌ Error fetching expenses: {str(e)}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching expenses: {str(e)}"
        )

# POST create expense with error handling
@router.post("", response_model=schemas.Expense, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.Expense, status_code=status.HTTP_201_CREATED)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    try:
        return service.create_expense(db=db, expense=expense)
    except Exception as e:
        print(f"❌ Error creating expense: {str(e)}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating expense: {str(e)}"
        )

# GET single expense by ID
@router.get("/{expense_id}", response_model=schemas.Expense)
def read_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = service.get_expense(db=db, expense_id=expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

# PUT update expense
@router.put("/{expense_id}", response_model=schemas.Expense)
def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    updated = service.update_expense(db=db, expense_id=expense_id, expense=expense)
    if updated is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated

# DELETE expense
@router.delete("/{expense_id}", response_model=dict)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    success = service.delete_expense(db=db, expense_id=expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}