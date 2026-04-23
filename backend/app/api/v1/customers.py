"""Customers API routes"""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.services import CustomerService
from app.schemas import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
)

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_create: CustomerCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new customer"""
    customer = CustomerService.create_customer(db, customer_create, int(current_user["client_id"]))
    return customer


@router.get("/", response_model=Dict[str, Any])
def list_customers(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = True,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all customers with pagination"""
    customers, total = CustomerService.list_customers(
        db=db,
        client_id=int(current_user["client_id"]),
        skip=skip,
        limit=limit,
        is_active=is_active,
    )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [CustomerResponse.model_validate(c) for c in customers],
    }


@router.get("/search", response_model=List[CustomerResponse])
def search_customers(
    q: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search customers by name, email, or phone"""
    customers = CustomerService.search_customers(db, q, int(current_user["client_id"]))
    return customers


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get customer by ID"""
    customer = CustomerService.get_customer_by_id(db, customer_id, int(current_user["client_id"]))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update customer"""
    customer = CustomerService.update_customer(
        db=db,
        customer_id=customer_id,
        customer_update=customer_update,
        client_id=int(current_user["client_id"]),
    )
    return customer


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deactivate customer"""
    CustomerService.delete_customer(db, customer_id, int(current_user["client_id"]))
    return {"message": "Customer deleted successfully"}


@router.post("/{customer_id}/loyalty-points")
def add_loyalty_points(
    customer_id: int,
    points: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add loyalty points to customer"""
    customer = CustomerService.add_loyalty_points(db, customer_id, points, int(current_user["client_id"]))
    return {
        "customer_id": customer.id,
        "loyalty_points": customer.loyalty_points,
    }
