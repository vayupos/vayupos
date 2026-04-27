"""make_category_and_coupon_unique_per_client

Revision ID: 0a6afc30e1e9
Revises: 85fbf57a8216
Create Date: 2026-04-25 00:48:14.638187

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0a6afc30e1e9'
down_revision: Union[str, Sequence[str], None] = '85fbf57a8216'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Category
    op.drop_index('ix_categories_name', table_name='categories')
    op.create_index('ix_categories_name', 'categories', ['name'], unique=False)
    op.create_unique_constraint('_client_category_name_uc', 'categories', ['client_id', 'name'])

    # Coupon
    op.drop_index('ix_coupons_code', table_name='coupons')
    op.create_index('ix_coupons_code', 'coupons', ['code'], unique=False)
    op.create_unique_constraint('_client_coupon_code_uc', 'coupons', ['client_id', 'code'])


def downgrade() -> None:
    """Downgrade schema."""
    # Coupon
    op.drop_constraint('_client_coupon_code_uc', 'coupons', type_='unique')
    op.drop_index('ix_coupons_code', table_name='coupons')
    op.create_index('ix_coupons_code', 'coupons', ['code'], unique=True)

    # Category
    op.drop_constraint('_client_category_name_uc', 'categories', type_='unique')
    op.drop_index('ix_categories_name', table_name='categories')
    op.create_index('ix_categories_name', 'categories', ['name'], unique=True)
