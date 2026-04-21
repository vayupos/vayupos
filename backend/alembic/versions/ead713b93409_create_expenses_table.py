"""create expenses table

Revision ID: ead713b93409
Revises: add_updated_at_staff
Create Date: 2026-01-15 21:16:17.161809
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'ead713b93409'
down_revision = 'add_updated_at_staff'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create expenses table"""
    op.create_table(
        'expenses',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()')
        ),
    )


def downgrade() -> None:
    """Drop expenses table"""
    op.drop_table('expenses')
