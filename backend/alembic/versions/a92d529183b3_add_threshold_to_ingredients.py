"""Add threshold to ingredients

Revision ID: a92d529183b3
Revises: 07b95477822d
Create Date: 2026-04-25 22:03:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a92d529183b3'
down_revision: Union[str, Sequence[str], None] = '07b95477822d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('ingredients', sa.Column('threshold', sa.Integer(), nullable=True))
    op.execute("UPDATE ingredients SET threshold = 10 WHERE threshold IS NULL")
    op.alter_column('ingredients', 'threshold', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('ingredients', 'threshold')
