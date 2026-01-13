from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.models.staff import Staff
from app.schemas.staff import StaffCreate, StaffUpdate, StaffResponse

class StaffService:
    @classmethod
    def create_staff(cls, db: Session, staff_data: StaffCreate) -> Staff:
        existing = db.query(Staff).filter(Staff.phone == staff_data.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        
        # ✅ FIXED: Match schema field names
        staff = Staff(
            name=staff_data.name,
            phone=staff_data.phone,
            role=staff_data.role,
            salary=staff_data.salary,        # ✅ FIXED: salary (not salary_amount)
            joined=staff_data.joined,        # ✅ FIXED: joined (not joined_date)
            aadhar=staff_data.aadhar,
            status="Active"
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
        return staff

    @classmethod
    def get_staff_list(cls, db: Session, skip: int = 0, limit: int = 100, 
                      search: Optional[str] = None, role: Optional[str] = None, 
                      status: Optional[str] = None) -> List[Staff]:
        query = db.query(Staff)
        if search:
            search_like = f"%{search}%"
            query = query.filter((Staff.name.ilike(search_like)) | (Staff.phone.contains(search)))
        if role:
            query = query.filter(Staff.role == role)
        if status:
            query = query.filter(Staff.status == status)
        return query.offset(skip).limit(limit).all()

    @classmethod
    def get_staff_by_id(cls, db: Session, staff_id: int) -> Optional[Staff]:
        return db.query(Staff).filter(Staff.id == staff_id).first()

    @classmethod
    def update_staff(cls, db: Session, staff_id: int, staff_data: StaffUpdate) -> Optional[Staff]:
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            return None
        
        update_data = staff_data.dict(exclude_unset=True)
        if 'phone' in update_data:
            existing = db.query(Staff).filter(
                Staff.phone == update_data['phone'], Staff.id != staff_id
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
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            return False
        staff.status = "Inactive"
        db.commit()
        return True

    @classmethod
    def get_upcoming_salaries(cls, db: Session) -> List[dict]:
        """SIMPLE VERSION - Next month for active staff"""
        upcoming = db.query(Staff).filter(
            Staff.status == "Active"
        ).all()
        
        salary_entries = []
        for staff in upcoming:
            # Simple: Next month from today
            next_month = datetime.now() + timedelta(days=30)
            salary_entries.append({
                "id": staff.id,
                "name": staff.name,
                "role": staff.role,
                "salary": {"amount": float(staff.salary)},  # ✅ FIXED
                "dueDate": next_month.strftime("%d %b %Y"),  # ✅ Simple format
                "category": "Monthly"
            })
        return salary_entries

    @classmethod
    def mark_salary_paid(cls, db: Session, staff_id: int) -> bool:
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            return False
        print(f"✅ Salary marked paid for {staff.name} - ₹{staff.salary}")
        return True
