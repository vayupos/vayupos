"""add is_quick_bill to orders

Revision ID: 3453615ff3cf
Revises: 0a6afc30e1e9
Create Date: 2026-04-25 17:26:52.161936

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3453615ff3cf'
down_revision: Union[str, Sequence[str], None] = '0a6afc30e1e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('orders', sa.Column('is_quick_bill', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('orders', 'is_quick_bill')
