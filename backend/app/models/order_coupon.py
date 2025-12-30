from sqlalchemy import Column, Integer, ForeignKey
from app.core.database import Base

class OrderCoupon(Base):
    __tablename__ = "order_coupons"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=False)
