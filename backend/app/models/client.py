from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime

from app.models.user import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)

    # Restaurant profile
    restaurant_name = Column(String(200), nullable=False, default="My Restaurant")
    owner_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    logo_url = Column(Text, nullable=True)
    currency_symbol = Column(String(5), nullable=False, default="₹")

    # Bill text
    bill_header = Column(Text, nullable=True)
    bill_footer = Column(
        Text, nullable=False, default="Thank you for visiting! Please come again."
    )

    # POS bill printer
    bill_printer_type = Column(String(20), nullable=False, default="browser")  # browser | wifi | bluetooth
    bill_paper_width = Column(String(10), nullable=False, default="80")         # mm
    bill_printer_ip = Column(String(45), nullable=True)
    bill_printer_port = Column(Integer, nullable=True, default=9100)

    # KOT printer
    kot_printer_type = Column(String(20), nullable=False, default="browser")
    kot_paper_width = Column(String(10), nullable=False, default="80")
    kot_printer_ip = Column(String(45), nullable=True)
    kot_printer_port = Column(Integer, nullable=True, default=9100)

    # Print agent authentication key — shown in Settings so the local agent can be configured
    print_agent_key = Column(String(64), nullable=True, index=True)

    # Lifecycle
    is_active = Column(Boolean, nullable=False, default=True)
    trial_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
