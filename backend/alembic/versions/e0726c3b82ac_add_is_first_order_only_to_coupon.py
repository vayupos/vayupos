"""add is_first_order_only to coupon

Revision ID: e0726c3b82ac
Revises: f9995b29f786
Create Date: 2026-03-10 19:52:37.598068

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0726c3b82ac'
down_revision: Union[str, Sequence[str], None] = 'f9995b29f786'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('coupons', sa.Column('is_first_order_only', sa.Boolean(), nullable=False, server_default=sa.false()))
    
    # Seed WELCOME10 coupon
    op.execute("""
        INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, is_active, is_first_order_only, description)
        SELECT 'WELCOME10', 'percentage', 10, 200, TRUE, TRUE, 'Welcome offer for first-time customers'
        WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'WELCOME10')
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('coupons', 'is_first_order_only')
