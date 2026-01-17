from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
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
            is_active=True
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
            # Convert status string to is_active boolean
            is_active = status.lower() == "active"
            query = query.filter(Staff.is_active == is_active)
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
        
        # Convert status string to is_active boolean if provided
        if 'status' in update_data:
            status_value = update_data.pop('status')
            update_data['is_active'] = status_value.lower() == "active"
        
        for field, value in update_data.items():
            setattr(staff, field, value)
        staff.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(staff)
        return staff

    @classmethod
    def delete_staff(cls, db: Session, staff_id: int) -> bool:
        try:
            staff = db.query(Staff).filter(Staff.id == staff_id).first()
            if not staff:
                return False
            staff.is_active = False  # ✅ FIXED: Set is_active, not status (which is read-only)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"❌ Error in delete_staff: {str(e)}")
            raise

    @classmethod
    def get_upcoming_salaries(cls, db: Session) -> List[dict]:
        """
        ✅ FIXED VERSION
        Returns upcoming salary entries for all ACTIVE staff members.
        Calculates next salary due date based on when they joined.
        """
        # ✅ FIX 1: Use is_active (database column) instead of status (property)
        active_staff = db.query(Staff).filter(
            Staff.is_active == True  # ✅ CORRECT
        ).all()
        
        salary_entries = []
        today = datetime.now().date()
        
        for staff in active_staff:
            # Calculate next salary due date
            # If they joined on Dec 15, next salary is due on Jan 15, then Feb 15, etc.
            joined_date = staff.joined.date() if isinstance(staff.joined, datetime) else staff.joined
            
            # ✅ SAFE LOGIC: Keep adding months until due date is in the future
            next_due_date = joined_date
            while next_due_date <= today:
                next_due_date += relativedelta(months=1)
            
            # Only show if due within next 7 days (can adjust to 30 if you prefer)
            if next_due_date <= today + timedelta(days=7):
                # ✅ FIX 2: Match frontend expected format EXACTLY
                salary_entries.append({
                    "id": staff.id,
                    "staff_id": staff.id,  # Frontend expects this
                    "name": staff.name,
                    "role": staff.role,
                    "salary": float(staff.salary),  # ✅ Direct number, not nested object
                    "due_date": next_due_date.strftime("%d %b %Y"),  # ✅ "15 Jan 2026" format
                    "dueDate": next_due_date.strftime("%d %b %Y"),  # ✅ Also include camelCase (frontend uses both)
                })
        
        print(f"✅ Returning {len(salary_entries)} upcoming salary entries")
        return salary_entries

    @classmethod
    def mark_salary_paid(cls, db: Session, staff_id: int) -> bool:
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            return False
        print(f"✅ Salary marked paid for {staff.name} - ₹{staff.salary}")
        return True