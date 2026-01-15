from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import traceback

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.staff import (
    StaffCreate,
    StaffUpdate,
    StaffResponse,
    SalaryEntryResponse,
)
from app.services.staff_service import StaffService

router = APIRouter(prefix="/staff", tags=["Staff"])


# =========================
# CREATE STAFF
# =========================
@router.post("", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff(
    staff_data: StaffCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return StaffService.create_staff(db, staff_data)


# =========================
# LIST STAFF (filters)
# =========================
@router.get("", response_model=List[StaffResponse])
@router.get("/", response_model=List[StaffResponse])
def list_staff(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return StaffService.get_staff_list(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        role=role,
        status=status,
    )


# =========================
# UPCOMING SALARIES (⚠ MUST BE ABOVE /{staff_id})
# =========================
@router.get("/upcoming-salaries", response_model=List[SalaryEntryResponse])
def get_upcoming_salaries(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return StaffService.get_upcoming_salaries(db)


# =========================
# GET STAFF BY ID
# =========================
@router.get("/{staff_id}", response_model=StaffResponse)
def get_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    staff = StaffService.get_staff_by_id(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff


# =========================
# UPDATE STAFF
# =========================
@router.put("/{staff_id}", response_model=StaffResponse)
def update_staff(
    staff_id: int,
    staff_data: StaffUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    updated = StaffService.update_staff(db, staff_id, staff_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Staff not found")
    return updated


# =========================
# DELETE STAFF
# =========================
@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        success = StaffService.delete_staff(db, staff_id)
        if not success:
            raise HTTPException(status_code=404, detail="Staff not found")
        return None
    except Exception as e:
        print(f"❌ Error deleting staff {staff_id}: {str(e)}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error deleting staff: {str(e)}"
        )


# =========================
# ADD / MARK SALARY PAID
# =========================
@router.post("/salaries/{staff_id}/add")
def add_salary_entry(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    success = StaffService.mark_salary_paid(db, staff_id)
    if not success:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"success": True, "message": "Salary entry added to expenses"}
