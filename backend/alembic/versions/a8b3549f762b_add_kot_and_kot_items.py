"""add_kot_and_kot_items

Revision ID: a8b3549f762b
Revises: 17f8819df11f
Create Date: 2026-04-26 09:34:39.724221

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8b3549f762b'
down_revision: Union[str, Sequence[str], None] = '17f8819df11f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add printer_category to products
    op.add_column('products', sa.Column('printer_category', sa.String(length=50), nullable=False, server_default='food'))
    
    # Create kots table
    op.create_table('kots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('kot_number', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_kots_client_id'), 'kots', ['client_id'], unique=False)
    op.create_index(op.f('ix_kots_id'), 'kots', ['id'], unique=False)
    op.create_index(op.f('ix_kots_kot_number'), 'kots', ['kot_number'], unique=False)

    # Create kot_items table
    op.create_table('kot_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('kot_id', sa.Integer(), nullable=False),
        sa.Column('order_item_id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='preparing'),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='normal'),
        sa.Column('is_cancelled', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('cancel_reason', sa.Text(), nullable=True),
        sa.Column('cancelled_by', sa.Integer(), nullable=True),
        sa.Column('printer_category', sa.String(length=50), nullable=False, server_default='food'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['cancelled_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['kot_id'], ['kots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_item_id'], ['order_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_kot_items_client_id'), 'kot_items', ['client_id'], unique=False)
    op.create_index(op.f('ix_kot_items_id'), 'kot_items', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_kot_items_id'), table_name='kot_items')
    op.drop_index(op.f('ix_kot_items_client_id'), table_name='kot_items')
    op.drop_table('kot_items')
    op.drop_index(op.f('ix_kots_kot_number'), table_name='kots')
    op.drop_index(op.f('ix_kots_id'), table_name='kots')
    op.drop_index(op.f('ix_kots_client_id'), table_name='kots')
    op.drop_table('kots')
    op.drop_column('products', 'printer_category')
