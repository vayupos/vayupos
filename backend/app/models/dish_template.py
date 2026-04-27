from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint, Boolean, Time
from sqlalchemy.orm import relationship
from app.models.user import Base


class DishTemplate(Base):
    """Master dish library: name + image used to create products."""
    __tablename__ = "dish_templates"
    __table_args__ = (
        UniqueConstraint('client_id', 'name', name='uq_dish_template_client_name'),
    )

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    default_category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    food_type = Column(String(20), nullable=True, default="veg")
    is_time_restricted = Column(Boolean, default=False, nullable=False)
    available_from = Column(Time, nullable=True)
    available_to = Column(Time, nullable=True)

    # optional relationship if you want to navigate to category
    default_category = relationship("Category", backref="dish_templates")

    def __repr__(self) -> str:
        return f"<DishTemplate(id={self.id}, name='{self.name}')>"
