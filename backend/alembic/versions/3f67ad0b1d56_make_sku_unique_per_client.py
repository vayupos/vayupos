"""make_sku_unique_per_client

Revision ID: 3f67ad0b1d56
Revises: 76f7adc38e0d
Create Date: 2026-04-25 00:35:58.249067

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f67ad0b1d56'
down_revision: Union[str, Sequence[str], None] = '76f7adc38e0d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop the existing unique index on sku
    op.drop_index('ix_products_sku', table_name='products')
    # Re-create it as a normal index
    op.create_index('ix_products_sku', 'products', ['sku'], unique=False)
    # Add the new multi-column unique constraint
    op.create_unique_constraint('_client_sku_uc', 'products', ['client_id', 'sku'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the multi-column unique constraint
    op.drop_constraint('_client_sku_uc', 'products', type_='unique')
    # Restore the unique index on sku
    op.drop_index('ix_products_sku', table_name='products')
    op.create_index('ix_products_sku', 'products', ['sku'], unique=True)
