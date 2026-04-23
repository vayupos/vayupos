"""Report service for business analytics"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Order, OrderStatus, Payment, PaymentStatus, InventoryLog, Product
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, Dict, List


class ReportService:
    """Service for generating business reports"""

    @staticmethod
    def get_sales_report(
        db: Session,
        client_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        group_by: str = "day",  # day, month, year
    ) -> List[Dict]:
        """Get sales report for a date range"""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()

        query = db.query(Order).filter(
            Order.client_id == client_id,
            (Order.created_at >= start_date) & (Order.created_at <= end_date)
        )

        # Group by date
        if group_by == "day":
            query = query.filter(Order.status.in_([OrderStatus.COMPLETED, OrderStatus.REFUNDED]))

        orders = query.all()

        # Aggregate data
        sales_data = {}
        for order in orders:
            if group_by == "day":
                key = order.created_at.date()
            elif group_by == "month":
                key = (order.created_at.year, order.created_at.month)
            else:
                key = order.created_at.year

            if key not in sales_data:
                sales_data[key] = {
                    "date": key,
                    "total_orders": 0,
                    "total_sales": Decimal(0),
                    "total_tax": Decimal(0),
                    "total_discount": Decimal(0),
                }

            sales_data[key]["total_orders"] += 1
            sales_data[key]["total_sales"] += order.total
            sales_data[key]["total_tax"] += order.tax
            sales_data[key]["total_discount"] += order.discount

        return list(sales_data.values())

    @staticmethod
    def get_product_sales_report(db: Session, client_id: int, days: int = 30, limit: int = 50) -> List[Dict]:
        """Get top selling products"""
        start_date = datetime.utcnow() - timedelta(days=days)

        products = db.query(
            Product.id,
            Product.name,
            Product.sku,
            func.sum(InventoryLog.quantity_change).label("total_sold"),
            func.count(InventoryLog.id).label("transaction_count"),
        ).join(
            InventoryLog, InventoryLog.product_id == Product.id
        ).filter(
            Product.client_id == client_id,
            InventoryLog.client_id == client_id,
            (InventoryLog.action == "sale") & (InventoryLog.created_at >= start_date)
        ).group_by(
            Product.id, Product.name, Product.sku
        ).order_by(
            func.sum(InventoryLog.quantity_change).desc()
        ).limit(limit).all()

        return [
            {
                "product_id": p[0],
                "product_name": p[1],
                "sku": p[2],
                "total_sold": abs(p[3]) if p[3] else 0,
                "transaction_count": p[4],
            }
            for p in products
        ]

    @staticmethod
    def get_payment_method_report(db: Session, client_id: int, days: int = 30) -> Dict:
        """Get payment methods breakdown"""
        start_date = datetime.utcnow() - timedelta(days=days)

        payments = db.query(
            Payment.payment_method,
            func.count(Payment.id).label("count"),
            func.sum(Payment.amount).label("total_amount"),
        ).filter(
            Payment.client_id == client_id,
            (Payment.status == PaymentStatus.COMPLETED) & (Payment.created_at >= start_date)
        ).group_by(
            Payment.payment_method
        ).all()

        return [
            {
                "payment_method": str(p[0]),
                "transaction_count": p[1],
                "total_amount": p[2] or Decimal(0),
            }
            for p in payments
        ]

    @staticmethod
    def get_inventory_report(db: Session, client_id: int) -> Dict:
        """Get current inventory status"""
        total_products = db.query(Product).filter(Product.client_id == client_id, Product.is_active == True).count()
        
        low_stock = db.query(Product).filter(
            Product.client_id == client_id,
            (Product.stock_quantity <= Product.min_stock_level) & (Product.is_active == True)
        ).count()
        
        out_of_stock = db.query(Product).filter(
            Product.client_id == client_id,
            (Product.stock_quantity == 0) & (Product.is_active == True)
        ).count()
        
        total_inventory_value = db.query(
            func.sum(Product.stock_quantity * Product.cost_price)
        ).filter(Product.client_id == client_id, Product.is_active == True).scalar() or Decimal(0)

        return {
            "total_products": total_products,
            "low_stock_count": low_stock,
            "out_of_stock_count": out_of_stock,
            "total_inventory_value": total_inventory_value,
        }

    @staticmethod
    def get_daily_summary(db: Session, client_id: int, date: Optional[datetime] = None) -> Dict:
        """Get daily sales summary"""
        from app.models.expense import Expense
        if not date:
            date = datetime.utcnow().date()

        start_of_day = datetime.combine(date, datetime.min.time())
        end_of_day = datetime.combine(date, datetime.max.time())

        orders = db.query(Order).filter(
            Order.client_id == client_id,
            (Order.created_at >= start_of_day) & (Order.created_at <= end_of_day)
        ).all()

        total_orders = len(orders)
        total_sales = sum(float(order.total) for order in orders)
        completed_orders = sum(1 for order in orders if order.status == OrderStatus.COMPLETED)

        payments = db.query(Payment).filter(
            Payment.client_id == client_id,
            (Payment.status == PaymentStatus.COMPLETED) &
            (Payment.created_at >= start_of_day) &
            (Payment.created_at <= end_of_day)
        ).all()

        total_received = sum(float(payment.amount) for payment in payments)
        average_order_value = total_sales / total_orders if total_orders > 0 else 0.0

        # Query expenses for this date
        # Expense date field is a string, so we match it format "YYYY-MM-DD" or similar, or just parse
        date_str = date.strftime("%Y-%m-%d")
        expenses = db.query(Expense).filter(Expense.client_id == client_id, Expense.date == date_str).all()
        total_expenses = sum(float(expense.amount) for expense in expenses)

        return {
            "date": date,
            "total_orders": total_orders,
            "orders_count": total_orders,
            "completed_orders": completed_orders,
            "total_sales": total_sales,
            "total_received": total_received,
            "pending_amount": total_sales - total_received,
            "average_order_value": average_order_value,
            "total_expenses": total_expenses,
        }

    @staticmethod
    def get_customer_report(db: Session, client_id: int, limit: int = 20) -> List[Dict]:
        """Get top customers by spending"""
        from app.models import Customer

        customers = db.query(
            Customer.id,
            Customer.first_name,
            Customer.last_name,
            Customer.email,
            Customer.total_spent,
            Customer.loyalty_points,
            func.count(Order.id).label("order_count"),
        ).join(
            Order, Order.customer_id == Customer.id, isouter=True
        ).filter(
            Customer.client_id == client_id
        ).group_by(
            Customer.id,
            Customer.first_name,
            Customer.last_name,
            Customer.email,
            Customer.total_spent,
            Customer.loyalty_points,
        ).order_by(
            Customer.total_spent.desc()
        ).limit(limit).all()

        return [
            {
                "customer_id": c[0],
                "name": f"{c[1]} {c[2]}",
                "email": c[3],
                "total_spent": c[4],
                "loyalty_points": c[5],
                "order_count": c[6] or 0,
            }
            for c in customers
        ]
