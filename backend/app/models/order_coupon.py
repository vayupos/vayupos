from sqlalchemy import Column, Integer, ForeignKey
from app.models.user import Base

class OrderCoupon(Base):
    __tablename__ = "order_coupons"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=False)
