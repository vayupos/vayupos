"""add icon_name and tax_rate to categories

Revision ID: 20260228_add_category_fields
Revises: 10f732faa4b1
Create Date: 2026-02-28 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260228_add_category_fields'
down_revision: Union[str, Sequence[str], None] = '10f732faa4b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add icon_name and tax_rate to categories."""
    op.add_column('categories', sa.Column('icon_name', sa.String(length=50), nullable=True, server_default='Coffee'))
    op.add_column('categories', sa.Column('tax_rate', sa.Integer(), nullable=True, server_default='5'))


def downgrade() -> None:
    """Downgrade schema - remove icon_name and tax_rate from categories."""
    op.drop_column('categories', 'tax_rate')
    op.drop_column('categories', 'icon_name')
