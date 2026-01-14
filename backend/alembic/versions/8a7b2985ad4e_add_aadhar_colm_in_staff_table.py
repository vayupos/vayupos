"""add aadhar column to staff table

Revision ID: 8a7b2985ad4e
Revises: acc265c92635
Create Date: 2026-01-14 15:10:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8a7b2985ad4e'
down_revision = 'acc265c92635'
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Add aadhar column to staff table."""
    op.add_column('staff', sa.Column('aadhar', sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Remove aadhar column from staff table."""
    op.drop_column('staff', 'aadhar')
