from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.models.staff import Staff
from app.schemas.staff import (
    StaffCreate, StaffUpdate, StaffResponse, SalaryEntryResponse
)

class StaffService:
    @classmethod
    def create_staff(cls, db: Session, staff_data: StaffCreate) -> Staff:
        """Create new staff member"""
        existing = db.query(Staff).filter(Staff.phone == staff_data.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        
        # ✅ FIXED: Use YOUR database column names
        staff = Staff(
            name=staff_data.name,
            phone=staff_data.phone,
            role=staff_data.role,
            salary=staff_data.salary_amount,      # ✅ Changed from salary_amount
            joined=staff_data.joined_date,        # ✅ Changed from joined_date
            aadhar=staff_data.aadhar,
            status="Active"
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
        return staff

    @classmethod
    def get_staff_list(
        cls, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Staff]:
        """Get filtered staff list"""
        query = db.query(Staff)
        
        if search:
            search_like = f"%{search}%"
            query = query.filter(
                (Staff.name.ilike(search_like)) | 
                (Staff.phone.contains(search))
            )
        
        if role:
            query = query.filter(Staff.role == role)
        
        if status:
            query = query.filter(Staff.status == status)
        
        return query.offset(skip).limit(limit).all()

    @classmethod
    def get_staff_by_id(cls, db: Session, staff_id: int) -> Optional[Staff]:
        """Get staff by ID"""
        return db.query(Staff).filter(Staff.id == staff_id).first()

    @classmethod
    def update_staff(cls, db: Session, staff_id: int, staff_data: StaffUpdate) -> Optional[Staff]:
        """Update existing staff"""
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            return None
        
        update_data = staff_data.dict(exclude_unset=True)
        
        if 'phone' in update_data:
            existing = db.query(Staff).filter(
                Staff.phone == update_data['phone'],
                Staff.id != staff_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Phone number already registered")
        
        for field, value in update_data.items():
            setattr(staff, field, value)
        
        staff.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(staff)
        return staff

    @classmethod
    def delete_staff(cls, db: Session, staff_id: int) -> bool:
        """Soft delete staff (set inactive)"""
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            return False
        
        staff.status = "Inactive"
        staff.is_active = False
        staff.updated_at = datetime.utcnow()
        db.commit()
        return True

    @classmethod
    def get_upcoming_salaries(cls, db: Session) -> List[dict]:
        """Get upcoming salary entries (next 30 days)"""
        next_30_days = datetime.utcnow() + timedelta(days=30)
        
        upcoming = db.query(Staff).filter(
            Staff.is_active == True,
            Staff.status == "Active"
        ).all()
        
        salary_entries = []
        for staff in upcoming:
            # ✅ FIXED: Use YOUR database column names
            joined_day = staff.joined.day              # ✅ Changed from joined_date
            next_salary_date = datetime(
                year=datetime.utcnow().year,
                month=datetime.utcnow().month,
                day=joined_day
            )
            if next_salary_date < datetime.utcnow():
                next_salary_date = next_salary_date.replace(month=next_salary_date.month % 12 + 1)
                if next_salary_date.month == 1:
                    next_salary_date = next_salary_date.replace(year=next_salary_date.year + 1)
            
            if next_salary_date <= next_30_days:
                salary_entries.append({
                    "id": staff.id,
                    "name": staff.name,
                    "role": staff.role,
                    "avatar": staff.name[0].upper() if staff.name else "S",
                    "color": "#E74C3C",
                    "salary": {                           # ✅ Frontend expects nested
                        "amount": float(staff.salary)     # ✅ Changed from salary_amount
                    },
                    "dueDate": next_salary_date.strftime("%d %b %Y"),
                    "category": "Salaries & Wages"
                })
        
        return salary_entries

    @classmethod
    def mark_salary_paid(cls, db: Session, staff_id: int) -> bool:
        """Mark salary as paid (add to expenses table - implement later)"""
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            return False
        
        print(f"Salary marked paid for {staff.name} - ₹{staff.salary}")  # ✅ Fixed
        return True
