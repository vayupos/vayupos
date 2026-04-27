"""add_order_type_to_orders

Revision ID: 4edd585b7caf
Revises: fe164e9ec989
Create Date: 2026-04-26 00:39:08.856938

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4edd585b7caf'
down_revision: Union[str, Sequence[str], None] = 'fe164e9ec989'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the Enum type first
    order_type_enum = sa.Enum('dine_in', 'takeaway', name='ordertype')
    order_type_enum.create(op.get_bind(), checkfirst=True)
    
    op.add_column('orders', sa.Column('order_type', sa.Enum('dine_in', 'takeaway', name='ordertype'), nullable=False, server_default='dine_in'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('orders', 'order_type')
    # Drop the Enum type
    sa.Enum(name='ordertype').drop(op.get_bind(), checkfirst=True)
