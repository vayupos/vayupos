"""Customer service"""
from sqlalchemy.orm import Session
from app.models import Customer
from app.schemas import CustomerCreate, CustomerUpdate
from app.core.exceptions import not_found_exception, conflict_exception
from typing import Optional, Tuple
from decimal import Decimal


class CustomerService:
    """Service for customer operations"""

    @staticmethod
    def create_customer(db: Session, customer_create: CustomerCreate, client_id: int) -> Customer:
        """Create a new customer"""
        # Check if email already exists
        if customer_create.email:
            existing = db.query(Customer).filter(
                Customer.client_id == client_id,
                Customer.email == customer_create.email,
            ).first()
            if existing:
                raise conflict_exception("Customer with this email already exists")

        db_customer = Customer(
            client_id=client_id,
            first_name=customer_create.first_name,
            last_name=customer_create.last_name,
            email=customer_create.email,
            phone=customer_create.phone,
            address=customer_create.address,
            city=customer_create.city,
            state=customer_create.state,
            zip_code=customer_create.zip_code,
            country=customer_create.country,
        )

        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
        return db_customer

    @staticmethod
    def get_customer_by_id(db: Session, customer_id: int, client_id: int) -> Optional[Customer]:
        """Get customer by ID"""
        return db.query(Customer).filter(Customer.id == customer_id, Customer.client_id == client_id).first()

    @staticmethod
    def get_customer_by_email(db: Session, email: str, client_id: int) -> Optional[Customer]:
        """Get customer by email"""
        return db.query(Customer).filter(Customer.email == email, Customer.client_id == client_id).first()

    @staticmethod
    def get_customer_by_phone(db: Session, phone: str, client_id: int) -> Optional[Customer]:
        """Get customer by phone"""
        return db.query(Customer).filter(Customer.phone == phone, Customer.client_id == client_id).first()

    @staticmethod
    def update_customer(db: Session, customer_id: int, customer_update: CustomerUpdate, client_id: int) -> Customer:
        """Update customer"""
        customer = CustomerService.get_customer_by_id(db, customer_id, client_id)
        if not customer:
            raise not_found_exception("Customer not found")

        update_data = customer_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(customer, field, value)

        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def delete_customer(db: Session, customer_id: int, client_id: int) -> bool:
        """Soft delete customer (deactivate)"""
        customer = CustomerService.get_customer_by_id(db, customer_id, client_id)
        if not customer:
            raise not_found_exception("Customer not found")

        customer.is_active = False
        db.commit()
        return True

    @staticmethod
    def list_customers(
        db: Session, client_id: int, skip: int = 0, limit: int = 100, is_active: Optional[bool] = True
    ) -> Tuple[list[Customer], int]:
        """List customers"""
        query = db.query(Customer).filter(Customer.client_id == client_id)

        if is_active is not None:
            query = query.filter(Customer.is_active == is_active)

        total = query.count()
        customers = query.offset(skip).limit(limit).all()
        return customers, total

    @staticmethod
    def add_loyalty_points(db: Session, customer_id: int, points: int, client_id: int) -> Customer:
        """Add loyalty points to customer"""
        customer = CustomerService.get_customer_by_id(db, customer_id, client_id)
        if not customer:
            raise not_found_exception("Customer not found")

        customer.loyalty_points += points
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def update_total_spent(db: Session, customer_id: int, amount: Decimal, client_id: int) -> Customer:
        """Update customer total spent"""
        customer = CustomerService.get_customer_by_id(db, customer_id, client_id)
        if not customer:
            raise not_found_exception("Customer not found")

        customer.total_spent += amount
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def search_customers(db: Session, search_term: str, client_id: int) -> list[Customer]:
        """Search customers by name, email, or phone"""
        return db.query(Customer).filter(
            Customer.client_id == client_id,
            (Customer.first_name.ilike(f"%{search_term}%"))
            | (Customer.last_name.ilike(f"%{search_term}%"))
            | (Customer.email.ilike(f"%{search_term}%"))
            | (Customer.phone.ilike(f"%{search_term}%"))
        ).filter(Customer.is_active == True).all()
