from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.user import Base
from datetime import datetime

class PrintJob(Base):
    """Print job model for managing KOT print requests"""
    __tablename__ = "print_jobs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    printer_ip = Column(String(50), nullable=False)
    printer_port = Column(Integer, default=9100)
    content = Column(Text, nullable=False)
    status = Column(String(20), default="pending", nullable=False) # pending, printed, failed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    printed_at = Column(DateTime, nullable=True)

    # Relationships
    order = relationship("Order")

    def __repr__(self):
        return (
            f"<PrintJob(id={self.id}, order_id={self.order_id}, "
            f"printer_ip='{self.printer_ip}', is_printed={self.is_printed})>"
        )
