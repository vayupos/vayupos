"""add_food_type_to_products

Revision ID: 76f7adc38e0d
Revises: ffce0e72ad15
Create Date: 2026-04-24 20:35:18.765136

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '76f7adc38e0d'
down_revision: Union[str, Sequence[str], None] = 'ffce0e72ad15'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('products', sa.Column('food_type', sa.String(length=10), nullable=False, server_default='veg'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('products', 'food_type')
