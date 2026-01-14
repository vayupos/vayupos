"""add updated_at column to staff table

Revision ID: add_updated_at_staff
Revises: acc265c92635
Create Date: 2026-01-14
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_updated_at_staff'
down_revision = 'acc265c92635'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add updated_at column to staff table"""
    op.add_column('staff', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True))


def downgrade() -> None:
    """Remove updated_at column from staff table"""
    op.drop_column('staff', 'updated_at')
