"""add total_added and total_used to stock

Revision ID: f2b147ba4e7e
Revises: a92d529183b3
Create Date: 2026-04-25 22:08:12.822536

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2b147ba4e7e'
down_revision: Union[str, Sequence[str], None] = 'a92d529183b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('stock', sa.Column('total_added', sa.Numeric(10, 2), nullable=True))
    op.add_column('stock', sa.Column('total_used', sa.Numeric(10, 2), nullable=True))
    op.execute("UPDATE stock SET total_added = available_quantity WHERE total_added IS NULL")
    op.execute("UPDATE stock SET total_used = 0 WHERE total_used IS NULL")
    op.alter_column('stock', 'total_added', nullable=False)
    op.alter_column('stock', 'total_used', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('stock', 'total_used')
    op.drop_column('stock', 'total_added')
