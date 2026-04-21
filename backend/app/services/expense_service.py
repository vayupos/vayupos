from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from app.models import Expense
from app.schemas import expense as schemas

class ExpenseService:
    @staticmethod
    def get_expenses(db: Session, skip: int = 0, limit: int = 100) -> List[Expense]:
        return db.query(Expense).offset(skip).limit(limit).all()

    @staticmethod
    def get_expense(db: Session, expense_id: int) -> Optional[Expense]:
        return db.query(Expense).filter(Expense.id == expense_id).first()

    @staticmethod
    def create_expense(db: Session, expense: schemas.ExpenseCreate) -> Expense:
        db_expense = Expense(**expense.dict())
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        return db_expense

    @staticmethod
    def update_expense(db: Session, expense_id: int, expense: schemas.ExpenseUpdate) -> Optional[Expense]:
        db_expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if db_expense:
            update_data = expense.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_expense, field, value)
            db.commit()
            db.refresh(db_expense)
        return db_expense

    @staticmethod
    def delete_expense(db: Session, expense_id: int) -> bool:
        db_expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if db_expense:
            db.delete(db_expense)
            db.commit()
            return True
        return False

