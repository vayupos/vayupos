from sqlalchemy import Column, Integer, ForeignKey
from app.models.user import Base

class CouponCategory(Base):
    __tablename__ = "coupon_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
