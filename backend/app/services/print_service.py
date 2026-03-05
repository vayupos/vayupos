from datetime import datetime
from sqlalchemy.orm import Session
from app.models.print_job import PrintJob
from app.models.order import Order
from app.models.product import Product
from app.models.category import Category
from app.core.config import settings
from collections import defaultdict
import re

class PrintService:
    @staticmethod
    def generate_kot_content(order: Order, items, table_number: str = "N/A") -> str:
        """Generate formatted KOT text for 80mm thermal printer (approx 42 chars wide)"""
        width = 42
        
        # Header (Centered)
        header_text = "MY RESTAURANT"
        content = f"{header_text.center(width)}\n"
        content += "=" * width + "\n"
        
        # Details
        content += f"KOT #: {order.order_number}\n"
        content += f"Table: {table_number}\n"
        content += f"Date: {order.created_at.strftime('%d-%m-%Y %H:%M')}\n"
        content += "-" * width + "\n"
        
        # Items Header
        content += f"{'QTY': <4} {'ITEM': <36}\n"
        content += "-" * width + "\n"
        
        # Items
        for item in items:
            # Format: "2    Chicken Biryani"
            line = f"{item.quantity: <4} {item.product_name: <36}"
            content += f"{line}\n"
            
        content += "=" * width + "\n"
        
        # Notes
        if order.notes:
            content += "Notes:\n"
            content += f"{order.notes}\n"
            content += "-" * width + "\n"
            
        # Paper feed and cut command (ESC/POS)
        # Feed 4 lines then cut
        content += "\n\n\n\n"
        content += "\x1dV\x00"  # ESC/POS cut command (GS V m)
        
        return content

    @staticmethod
    def create_print_jobs(db: Session, order: Order) -> list[PrintJob]:
        """Group items by category's printer and create print jobs"""
        # Dictionary to group items: {(ip, port): [order_items]}
        printer_groups = defaultdict(list)
        
        # Check notes for table number
        table_number = "N/A"
        if order.notes:
             match = re.search(r"Table:\s*([A-Za-z0-9-]+)", order.notes, re.IGNORECASE)
             if match:
                 table_number = match.group(1)

        for item in order.order_items:
            # Try to get printer from product category
            printer_ip = settings.DEFAULT_PRINTER_IP
            printer_port = settings.DEFAULT_PRINTER_PORT
            
            if item.product and item.product.category:
                if item.product.category.printer_ip:
                    printer_ip = item.product.category.printer_ip
                if item.product.category.printer_port:
                    printer_port = item.product.category.printer_port
            
            printer_groups[(printer_ip, printer_port)].append(item)

        created_jobs = []
        for (ip, port), items in printer_groups.items():
            content = PrintService.generate_kot_content(order, items, table_number)
            
            db_print_job = PrintJob(
                order_id=order.id,
                printer_ip=ip,
                printer_port=port,
                content=content,
                is_printed=False
            )
            db.add(db_print_job)
            created_jobs.append(db_print_job)
        
        db.flush()
        return created_jobs

    @staticmethod
    def get_pending_jobs(db: Session) -> list[PrintJob]:
        """Fetch all unprinted jobs"""
        return db.query(PrintJob).filter(PrintJob.is_printed == False).order_by(PrintJob.created_at.asc()).all()

    @staticmethod
    def mark_as_printed(db: Session, job_id: int) -> PrintJob:
        """Mark a job as printed"""
        db_job = db.query(PrintJob).get(job_id)
        if db_job:
            db_job.is_printed = True
            db_job.printed_at = datetime.utcnow()
            db.commit()
            db.refresh(db_job)
        return db_job
