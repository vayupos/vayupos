from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db  # Adjust import to your DB dependency
from app.api.dependencies import get_current_user
from app.services.expense_service import ExpenseService
from app.schemas import expense as schemas

router = APIRouter(prefix="/expenses", tags=["expenses"])

service = ExpenseService()

@router.post("/", response_model=schemas.Expense)
def create_expense(
    expense: schemas.ExpenseCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.create_expense(db=db, expense=expense, client_id=int(current_user["client_id"]))

@router.get("/", response_model=List[schemas.Expense])
def read_expenses(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expenses = service.get_expenses(db=db, client_id=int(current_user["client_id"]), skip=skip, limit=limit)
    return expenses

@router.get("/{expense_id}", response_model=schemas.Expense)
def read_expense(
    expense_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = service.get_expense(db=db, expense_id=expense_id, client_id=int(current_user["client_id"]))
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/{expense_id}", response_model=schemas.Expense)
def update_expense(
    expense_id: int,
    expense: schemas.ExpenseUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated = service.update_expense(
        db=db,
        expense_id=expense_id,
        expense=expense,
        client_id=int(current_user["client_id"]),
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated

@router.delete("/{expense_id}", response_model=dict)
def delete_expense(
    expense_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = service.delete_expense(db=db, expense_id=expense_id, client_id=int(current_user["client_id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}
