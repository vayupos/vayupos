"""add salary and joined to staff

Revision ID: acc265c92635
Revises: 8d82d991b3ed
Create Date: 2026-01-14 14:22:04.734491
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'acc265c92635'
down_revision = '8d82d991b3ed'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add salary and joined columns to staff table"""
    op.add_column('staff', sa.Column('salary', sa.Float(), nullable=True))
    op.add_column('staff', sa.Column('joined', sa.DateTime(), server_default=sa.text('now()'), nullable=True))


def downgrade() -> None:
    """Remove salary and joined columns from staff table"""
    op.drop_column('staff', 'salary')
    op.drop_column('staff', 'joined')
