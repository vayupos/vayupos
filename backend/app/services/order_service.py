from typing import Optional, Tuple
from decimal import Decimal
from datetime import datetime
import uuid

from sqlalchemy.orm import Session

from app.models import Order, OrderItem, OrderStatus, Product, Customer, InventoryAction
from app.schemas import OrderCreate, OrderUpdate, OrderItemCreate
from app.core.exceptions import not_found_exception, bad_request_exception
from app.services.inventory_service import InventoryService
from app.services.ingredient_service import StockService


class OrderService:
    """Service for order operations"""

    @staticmethod
    def _generate_order_number() -> str:
        """Generate unique order number"""
        return f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

    @staticmethod
    def create_order(db: Session, order_create: OrderCreate, user_id: int, client_id: int) -> Order:
        """Create a new order"""
        # Validate customer if provided
        if order_create.customer_id:
            customer = db.query(Customer).filter(
                Customer.id == order_create.customer_id,
                Customer.client_id == client_id,
            ).first()
            if not customer:
                raise not_found_exception("Customer not found")

        # Validate order items
        if not order_create.order_items:
            raise bad_request_exception("Order must have at least one item")

        # Calculate order totals
        subtotal = Decimal("0")
        order_items_data = []

        for item in order_create.order_items:
            product = db.query(Product).filter(
                Product.id == item.product_id,
                Product.client_id == client_id,
            ).first()
            if not product:
                raise not_found_exception(f"Product {item.product_id} not found")

            unit_price = item.unit_price or product.price
            item_subtotal = unit_price * item.quantity - item.discount
            subtotal += item_subtotal

            order_items_data.append(
                {
                    "product": product,
                    "item": item,
                    "unit_price": unit_price,
                    "subtotal": item_subtotal,
                }
            )

        # Calculate totals
        tax = order_create.tax or Decimal("0")
        discount = order_create.discount or Decimal("0")
        
        # Handle coupon code if provided
        if order_create.coupon_code:
            from app.services.coupon_service import CouponService
            valid, eligible, message, coupon, discount_amount = CouponService.validate_coupon(
                db,
                order_create.coupon_code,
                float(subtotal),
                client_id=client_id,
                customer_id=order_create.customer_id,
                apply_discount=True # Increment usage count
            )
            if not valid or not eligible:
                raise bad_request_exception(f"Coupon error: {message}")
            
            # Override discount with coupon discount if provided, or add to it?
            # User said: "If valid, apply the discount"
            discount = Decimal(str(discount_amount))

        total = subtotal + tax - discount

        # Create order
        db_order = Order(
            client_id=client_id,
            order_number=OrderService._generate_order_number(),
            customer_id=order_create.customer_id,
            user_id=user_id,
            payment_method=order_create.payment_method or "Cash",
            subtotal=subtotal,
            tax=tax,
            discount=discount,
            total=total,
            notes=order_create.notes,
            is_quick_bill=order_create.is_quick_bill,
            order_type=order_create.order_type,
        )

        db.add(db_order)
        db.flush()  # Flush to get the order ID

        # Update customer stats if provided
        if db_order.customer_id:
            customer = db.query(Customer).filter(
                Customer.id == db_order.customer_id,
                Customer.client_id == client_id,
            ).first()
            if customer:
                customer.total_spent += total
                # ₹1 = 1 loyalty point (as per requirement)
                customer.loyalty_points += int(total)



        # Create order items and reduce inventory
        for item_data in order_items_data:
            product = item_data["product"]
            item = item_data["item"]
            unit_price = item_data["unit_price"]

            # Check stock ONLY if it's not a recipe-based product
            # If it has ingredients, we assume stock is managed at the ingredient level
            has_ingredients = len(product.ingredients) > 0
            if not has_ingredients and product.stock_quantity < item.quantity:
                raise bad_request_exception(
                    f"Insufficient stock for {product.name}. "
                    f"Available: {product.stock_quantity}, Requested: {item.quantity}"
                )

            order_item = OrderItem(
                client_id=client_id,
                order_id=db_order.id,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                quantity=item.quantity,
                unit_price=unit_price,
                discount=item.discount or Decimal("0"),
                subtotal=item_data["subtotal"],
            )

            db.add(order_item)

            # Log inventory out for product
            InventoryService.log_inventory_change(
                db=db,
                product_id=product.id,
                user_id=user_id,
                action=InventoryAction.SALE,
                quantity_change=-item.quantity,
                reference_number=db_order.order_number,
                notes=f"Sold via order {db_order.order_number}",
                client_id=client_id,
            )

            # Deduct ingredient stock if product has ingredients
            if has_ingredients:
                StockService.deduct_stock_for_order(
                    db=db,
                    client_id=client_id,
                    product_id=product.id,
                    quantity_ordered=item.quantity
                )

        db.commit()
        db.refresh(db_order)

        # Create KOT (Kitchen Order Ticket)
        from app.services.kot_service import KOTService
        try:
            KOTService.create_kot_for_order_items(db=db, order=db_order, order_items=db_order.order_items, client_id=client_id)
        except Exception as e:
            print(f"Error creating KOT: {e}")
            # Don't fail the whole order if KOT fails, but log it

        return db_order

    @staticmethod
    def get_order_by_id(db: Session, order_id: int, client_id: int) -> Optional[Order]:
        """Get order by ID"""
        return db.query(Order).filter(Order.id == order_id, Order.client_id == client_id).first()

    @staticmethod
    def get_order_by_number(db: Session, order_number: str, client_id: int) -> Optional[Order]:
        """Get order by order number"""
        return db.query(Order).filter(Order.order_number == order_number, Order.client_id == client_id).first()

    @staticmethod
    def update_order(db: Session, order_id: int, order_update: OrderUpdate, client_id: int) -> Order:
        """Update order"""
        order = OrderService.get_order_by_id(db, order_id, client_id)
        if not order:
            raise not_found_exception("Order not found")

        update_data = order_update.dict(exclude_unset=True)

        # Only allow updating certain fields
        allowed_fields = {"customer_id", "status", "discount", "tax", "notes"}
        for field in list(update_data.keys()):
            if field not in allowed_fields:
                del update_data[field]

        # If status is changing to COMPLETED, set completed_at
        if order_update.status == OrderStatus.COMPLETED and order.status != OrderStatus.COMPLETED:
            update_data["completed_at"] = datetime.utcnow()

        for field, value in update_data.items():
            setattr(order, field, value)

        # Recalculate total if tax or discount changed
        if "tax" in update_data or "discount" in update_data:
            order.total = order.subtotal + order.tax - order.discount

        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def cancel_order(db: Session, order_id: int, user_id: int, client_id: int) -> Order:
        """Cancel an order and restore inventory"""
        order = OrderService.get_order_by_id(db, order_id, client_id)
        if not order:
            raise not_found_exception("Order not found")

        if order.status == OrderStatus.CANCELLED:
            raise bad_request_exception("Order is already cancelled")

        # Restore inventory
        for item in order.order_items:
            InventoryService.log_inventory_change(
                db=db,
                product_id=item.product_id,
                user_id=user_id,
                action=InventoryAction.RETURN,
                quantity_change=item.quantity,
                reference_number=order.order_number,
                notes=f"Return from cancelled order {order.order_number}",
                client_id=client_id,
            )

        order.status = OrderStatus.CANCELLED
        
        # Deduct loyalty points and adjust total_spent if it was a customer order
        if order.customer_id:
            customer = db.query(Customer).filter(
                Customer.id == order.customer_id,
                Customer.client_id == client_id,
            ).first()
            if customer:
                # Deduct exactly what was added (int of total)
                points_to_deduct = int(order.total)
                customer.loyalty_points = max(0, customer.loyalty_points - points_to_deduct)
                customer.total_spent = max(Decimal("0"), customer.total_spent - order.total)

        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def list_orders(
        db: Session,
        client_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[OrderStatus] = None,
        customer_id: Optional[int] = None,
    ) -> Tuple[list[Order], int]:
        """List orders with pagination and filters"""
        query = db.query(Order).filter(Order.client_id == client_id)

        if status is not None:
            query = query.filter(Order.status == status)

        if customer_id is not None:
            query = query.filter(Order.customer_id == customer_id)

        query = query.order_by(Order.created_at.desc())
        total = query.count()
        orders = query.offset(skip).limit(limit).all()
        return orders, total

    @staticmethod
    def get_customer_orders(db: Session, customer_id: int, client_id: int, limit: int = 50) -> list[Order]:
        """Get all orders for a customer"""
        return (
            db.query(Order)
            .filter(Order.customer_id == customer_id, Order.client_id == client_id)
            .order_by(Order.created_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def add_items_to_order(db: Session, order_id: int, items: list[OrderItemCreate], user_id: int, client_id: int) -> Order:
        """Add new items to an existing order and generate a new KOT"""
        from app.services.kot_service import KOTService
        order = OrderService.get_order_by_id(db, order_id, client_id)
        if not order:
            raise not_found_exception("Order not found")

        if order.status in [OrderStatus.COMPLETED, OrderStatus.CANCELLED]:
            raise bad_request_exception(f"Cannot add items to a {order.status} order")

        new_order_items = []
        added_subtotal = Decimal("0")

        for item in items:
            product = db.query(Product).filter(
                Product.id == item.product_id,
                Product.client_id == client_id,
            ).first()
            if not product:
                raise not_found_exception(f"Product {item.product_id} not found")

            unit_price = item.unit_price or product.price
            item_subtotal = unit_price * item.quantity - item.discount
            added_subtotal += item_subtotal

            # Inventory check
            has_ingredients = len(product.ingredients) > 0
            if not has_ingredients and product.stock_quantity < item.quantity:
                raise bad_request_exception(f"Insufficient stock for {product.name}")

            order_item = OrderItem(
                client_id=client_id,
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                quantity=item.quantity,
                unit_price=unit_price,
                discount=item.discount or Decimal("0"),
                subtotal=item_subtotal,
            )
            db.add(order_item)
            new_order_items.append(order_item)

            # Inventory log
            InventoryService.log_inventory_change(
                db=db,
                product_id=product.id,
                user_id=user_id,
                action=InventoryAction.SALE,
                quantity_change=-item.quantity,
                reference_number=order.order_number,
                notes=f"Added to order {order.order_number}",
                client_id=client_id,
            )

            # Ingredient deduction
            if has_ingredients:
                StockService.deduct_stock_for_order(
                    db=db,
                    client_id=client_id,
                    product_id=product.id,
                    quantity_ordered=item.quantity
                )

        # Update order totals
        order.subtotal += added_subtotal
        order.total += added_subtotal
        
        db.flush()
        
        # Create NEW KOT only for new items
        try:
            KOTService.create_kot_for_order_items(db=db, order=order, order_items=new_order_items, client_id=client_id)
        except Exception as e:
            print(f"Error creating additional KOT: {e}")

        db.commit()
        db.refresh(order)
        return order
