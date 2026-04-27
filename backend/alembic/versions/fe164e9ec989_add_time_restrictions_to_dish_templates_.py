"""add time restrictions to dish_templates and products

Revision ID: fe164e9ec989
Revises: f2b147ba4e7e
Create Date: 2026-04-25 23:59:02.126167

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fe164e9ec989'
down_revision: Union[str, Sequence[str], None] = 'f2b147ba4e7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add columns to dish_templates
    op.add_column('dish_templates', sa.Column('is_time_restricted', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('dish_templates', sa.Column('available_from', sa.Time(), nullable=True))
    op.add_column('dish_templates', sa.Column('available_to', sa.Time(), nullable=True))
    
    # Add columns to products
    op.add_column('products', sa.Column('is_time_restricted', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('products', sa.Column('available_from', sa.Time(), nullable=True))
    op.add_column('products', sa.Column('available_to', sa.Time(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Drop columns from products
    op.drop_column('products', 'available_to')
    op.drop_column('products', 'available_from')
    op.drop_column('products', 'is_time_restricted')
    
    # Drop columns from dish_templates
    op.drop_column('dish_templates', 'available_to')
    op.drop_column('dish_templates', 'available_from')
    op.drop_column('dish_templates', 'is_time_restricted')
