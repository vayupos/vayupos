from sqlalchemy.orm import Session
from typing import List
from app import models  # ← FIXED: Absolute import
from app.schemas import expense as schemas  # ← FIXED: Absolute import

class ExpenseService:
    @staticmethod
    def get_expenses(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Expense).offset(skip).limit(limit).all()

    @staticmethod
    def get_expense(db: Session, expense_id: int):
        return db.query(models.Expense).filter(models.Expense.id == expense_id).first()

    @staticmethod
    def create_expense(db: Session, expense: schemas.ExpenseCreate):
        db_expense = models.Expense(**expense.dict())
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        return db_expense

    @staticmethod
    def update_expense(db: Session, expense_id: int, expense: schemas.ExpenseUpdate):
        db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
        if db_expense:
            for field, value in expense.dict(exclude_unset=True).items():
                setattr(db_expense, field, value)
            db.commit()
            db.refresh(db_expense)
        return db_expense

    @staticmethod
    def delete_expense(db: Session, expense_id: int):
        db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
        if db_expense:
            db.delete(db_expense)
            db.commit()
            return True
        return False
