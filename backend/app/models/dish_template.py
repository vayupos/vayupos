from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class DishTemplate(Base):
    """Master dish library: name + image used to create products."""
    __tablename__ = "dish_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True, index=True)
    image_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    default_category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )

    # optional relationship if you want to navigate to category
    default_category = relationship("Category", backref="dish_templates")

    def __repr__(self) -> str:
        return f"<DishTemplate(id={self.id}, name='{self.name}')>"
