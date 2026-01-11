from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.staff import (  # Create these schemas below
    StaffCreate, StaffUpdate, StaffResponse, SalaryEntryResponse
)
from app.services.staff_service import StaffService

router = APIRouter(prefix="/staff", tags=["Staff"])

@router.post("", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff(
    staff_data: StaffCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Add new staff member"""
    return StaffService.create_staff(db, staff_data)

@router.get("", response_model=List[StaffResponse])
def list_staff(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all staff with filters"""
    return StaffService.get_staff_list(db, skip, limit, search, role, status)

@router.get("/{staff_id}", response_model=StaffResponse)
def get_staff(staff_id: int, db: Session = Depends(get_db)):
    """Get single staff by ID"""
    staff = StaffService.get_staff_by_id(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff

@router.put("/{staff_id}", response_model=StaffResponse)
def update_staff(
    staff_id: int,
    staff_data: StaffUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update staff member"""
    updated = StaffService.update_staff(db, staff_id, staff_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Staff not found")
    return updated

@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete staff member"""
    success = StaffService.delete_staff(db, staff_id)
    if not success:
        raise HTTPException(status_code=404, detail="Staff not found")

@router.get("/upcoming-salaries", response_model=List[SalaryEntryResponse])
def get_upcoming_salaries(db: Session = Depends(get_db)):
    """Get upcoming salary entries"""
    return StaffService.get_upcoming_salaries(db)

@router.post("/salaries/{staff_id}/add")
def add_salary_entry(staff_id: int, db: Session = Depends(get_db)):
    """Mark salary as paid (add to expenses)"""
    success = StaffService.mark_salary_paid(db, staff_id)
    if not success:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"success": True, "message": "Salary entry added to expenses"}
