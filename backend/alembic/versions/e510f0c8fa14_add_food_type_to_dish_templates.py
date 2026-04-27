"""add food_type to dish_templates

Revision ID: e510f0c8fa14
Revises: 3453615ff3cf
Create Date: 2026-04-25 18:24:11.410938

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e510f0c8fa14'
down_revision: Union[str, Sequence[str], None] = '3453615ff3cf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('dish_templates', sa.Column('food_type', sa.String(length=20), nullable=True, server_default='veg'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('dish_templates', 'food_type')
