from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from fastapi import HTTPException
from app.models.staff import Staff
from app.models.expense import Expense as ExpenseModel
from app.schemas.staff import StaffCreate, StaffUpdate, StaffResponse

class StaffService:
    @classmethod
    def create_staff(cls, db: Session, staff_data: StaffCreate, client_id: int) -> Staff:
        existing = db.query(Staff).filter(
            Staff.phone == staff_data.phone,
            Staff.client_id == client_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        
        staff = Staff(
            client_id=client_id,
            name=staff_data.name,
            phone=staff_data.phone,
            role=staff_data.role,
            salary=staff_data.salary,
            joined=staff_data.joined,
            aadhar=staff_data.aadhar,
            is_active=True
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
        return staff

    @classmethod
    def get_staff_list(cls, db: Session, client_id: int, skip: int = 0, limit: int = 100, 
                      search: Optional[str] = None, role: Optional[str] = None, 
                      status: Optional[str] = None) -> List[Staff]:
        query = db.query(Staff).filter(Staff.client_id == client_id)
        if search:
            search_like = f"%{search}%"
            query = query.filter((Staff.name.ilike(search_like)) | (Staff.phone.contains(search)))
        if role:
            query = query.filter(Staff.role == role)
        if status:
            is_active = status.lower() == "active"
            query = query.filter(Staff.is_active == is_active)
        return query.offset(skip).limit(limit).all()

    @classmethod
    def get_staff_by_id(cls, db: Session, staff_id: int, client_id: int) -> Optional[Staff]:
        return db.query(Staff).filter(Staff.id == staff_id, Staff.client_id == client_id).first()

    @classmethod
    def update_staff(cls, db: Session, staff_id: int, staff_data: StaffUpdate, client_id: int) -> Optional[Staff]:
        staff = cls.get_staff_by_id(db, staff_id, client_id)
        if not staff:
            return None
        
        update_data = staff_data.dict(exclude_unset=True)
        if 'phone' in update_data:
            existing = db.query(Staff).filter(
                Staff.phone == update_data['phone'], 
                Staff.id != staff_id,
                Staff.client_id == client_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Phone number already registered")
        
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
    def delete_staff(cls, db: Session, staff_id: int, client_id: int) -> bool:
        try:
            staff = cls.get_staff_by_id(db, staff_id, client_id)
            if not staff:
                return False
            staff.is_active = False
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"❌ Error in delete_staff: {str(e)}")
            raise

    @classmethod
    def get_upcoming_salaries(cls, db: Session, client_id: int) -> List[dict]:
        """
        Returns staff members whose salary is due within the next 30 days
        (including overdue, due today, and upcoming)
        """
        try:
            active_staff = db.query(Staff).filter(
                Staff.is_active == True,
                Staff.client_id == client_id
            ).all()
            
            salary_entries = []
            today = datetime.now().date()
            future_threshold = today + timedelta(days=30)
            
            print(f"📊 Checking {len(active_staff)} active staff members")
            print(f"📅 Today: {today}, Showing salaries due by: {future_threshold}")
            
            for staff in active_staff:
                try:
                    if staff.joined is None:
                        print(f"⚠️ {staff.name} has no joined date, skipping")
                        continue
                    
                    # Get joined date
                    joined_date = staff.joined.date() if isinstance(staff.joined, datetime) else staff.joined
                    print(f"👤 {staff.name}: Joined on {joined_date}")
                    
                    # Calculate the next salary date efficiently
                    # Find how many complete months have passed
                    months_passed = (today.year - joined_date.year) * 12 + (today.month - joined_date.month)
                    
                    # Add those months to get a candidate date
                    candidate_date = joined_date + relativedelta(months=months_passed)
                    
                    # If candidate is in the past, add one more month
                    if candidate_date < today:
                        next_due_date = candidate_date + relativedelta(months=1)
                    elif candidate_date == today:
                        # If today is the exact due date, next payment is in 1 month
                        next_due_date = candidate_date + relativedelta(months=1)
                    else:
                        next_due_date = candidate_date
                    
                    print(f"   → Next salary due: {next_due_date}")
                    
                    # Show if due within the threshold (next 30 days)
                    if next_due_date <= future_threshold:
                        days_until = (next_due_date - today).days
                        
                        if days_until < 0:
                            status = "overdue"
                            print(f"   ⚠️ OVERDUE by {abs(days_until)} days!")
                        elif days_until == 0:
                            status = "due_today"
                            print(f"   🔔 DUE TODAY!")
                        else:
                            status = "upcoming"
                            print(f"   ✅ Due in {days_until} days")
                        
                        salary_entries.append({
                            "id": staff.id,
                            "staff_id": staff.id,
                            "name": staff.name,
                            "role": staff.role,
                            "salary": float(staff.salary) if staff.salary else 0.0,
                            "dueDate": next_due_date.strftime("%d %b %Y"),
                            "days_until": days_until,
                            "days_overdue": abs(days_until) if days_until < 0 else 0,
                            "status": status
                        })
                    else:
                        days_until = (next_due_date - today).days
                        print(f"   ❌ Not in range. Due in {days_until} days")
                
                except Exception as e:
                    print(f"❌ Error processing staff {staff.name}: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    continue
            
            # Sort by urgency: overdue first (negative days), then due_today, then upcoming
            salary_entries.sort(key=lambda x: x['days_until'])
            
            print(f"✅ Returning {len(salary_entries)} upcoming salary entries")
            for entry in salary_entries:
                print(f"   - {entry['name']}: {entry['status']} ({entry['dueDate']})")  # ✅ FIXED: Changed from due_date to dueDate
            
            return salary_entries
        
        except Exception as e:
            print(f"❌ CRITICAL ERROR in get_upcoming_salaries: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    @classmethod
    def mark_salary_paid(cls, db: Session, staff_id: int, client_id: int) -> bool:
        staff = cls.get_staff_by_id(db, staff_id, client_id)
        if not staff:
            return False
        
        # Calculate the due date (same logic as in get_upcoming_salaries)
        today = datetime.now().date()
        joined_date = staff.joined.date() if isinstance(staff.joined, datetime) else staff.joined
        months_passed = (today.year - joined_date.year) * 12 + (today.month - joined_date.month)
        candidate_date = joined_date + relativedelta(months=months_passed)
        
        if candidate_date < today:
            next_due_date = candidate_date + relativedelta(months=1)
        elif candidate_date == today:
            next_due_date = candidate_date + relativedelta(months=1)
        else:
            next_due_date = candidate_date
        
        due_date_str = next_due_date.strftime("%d %b %Y")

        # Create the expense record
        expense = ExpenseModel(
            client_id=client_id,
            title=f"Salary: {staff.name}",
            category="Salaries & Wages",
            amount=float(staff.salary),
            date=datetime.now().strftime("%Y-%m-%d"),
            subtitle=f"Auto-added by Staff Payroll - {staff.role}",
            type="auto",
            account="Cashbook",
            tax=0.0,
            payment_mode="Cash",
            due_date=due_date_str,
            notes=f"Monthly salary payment for {staff.name} ({staff.role})"
        )
        db.add(expense)
        db.commit()
        
        print(f"✅ Salary marked paid and expense created for {staff.name} - ₹{staff.salary}")
        return True