"""Reports API routes"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.api.dependencies import get_current_user, get_db
from app.services import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/sales")
def get_sales_report(
    days: int = 30,
    group_by: str = "day",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get sales report"""
    start_date = datetime.utcnow() - timedelta(days=days)
    end_date = datetime.utcnow()
    sales = ReportService.get_sales_report(
        db,
        int(current_user["client_id"]),
        start_date,
        end_date,
        group_by,
    )
    return {"data": sales, "days": days, "group_by": group_by}


@router.get("/products-sales")
def get_product_sales_report(
    days: int = 30,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get top selling products"""
    products = ReportService.get_product_sales_report(db, int(current_user["client_id"]), days, limit)
    return {"data": products, "days": days}


@router.get("/payment-methods")
def get_payment_method_report(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get payment methods breakdown"""
    methods = ReportService.get_payment_method_report(db, int(current_user["client_id"]), days)
    return {"data": methods, "days": days}


@router.get("/inventory")
def get_inventory_report(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get inventory report"""
    inventory = ReportService.get_inventory_report(db, int(current_user["client_id"]))
    return {"data": inventory}


@router.get("/daily-summary")
def get_daily_summary(
    date: str = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get daily sales summary"""
    if date:
        date = datetime.strptime(date, "%Y-%m-%d").date()
    summary = ReportService.get_daily_summary(db, int(current_user["client_id"]), date)
    return {"data": summary}


@router.get("/customers")
def get_customer_report(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get top customers"""
    customers = ReportService.get_customer_report(db, int(current_user["client_id"]), limit)
    return {"data": customers}
@router.get("/order-type-stats")
def get_order_type_stats(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get order type breakdown (dine-in vs takeaway)"""
    stats = ReportService.get_order_type_stats(db, int(current_user["client_id"]), days)
    return stats
