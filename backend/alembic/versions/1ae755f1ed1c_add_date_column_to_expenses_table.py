"""Add date and additional columns to expenses table

Revision ID: 1ae755f1ed1c
Revises: ead713b93409
Create Date: 2026-01-17 13:47:55.254088

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ae755f1ed1c'
down_revision: Union[str, Sequence[str], None] = 'ead713b93409'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ✅ Add new columns to expenses table
    op.add_column(
        'expenses',
        sa.Column('date', sa.String(), nullable=False, server_default='2025-01-01')
    )
    op.add_column(
        'expenses',
        sa.Column('subtitle', sa.String(length=255), nullable=True)
    )
    op.add_column(
        'expenses',
        sa.Column('type', sa.String(length=50), nullable=True)
    )
    op.add_column(
        'expenses',
        sa.Column('account', sa.String(length=100), nullable=True)
    )
    op.add_column(
        'expenses',
        sa.Column('tax', sa.Float(), nullable=True)
    )
    op.add_column(
        'expenses',
        sa.Column('payment_mode', sa.String(length=50), nullable=True)
    )
    
    # Remove the server default after column is created
    op.alter_column('expenses', 'date', server_default=None)
    
    # ✅ Make category NOT NULL
    op.alter_column(
        'expenses',
        'category',
        existing_type=sa.VARCHAR(length=50),
        nullable=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    # 🔁 Revert category nullable
    op.alter_column(
        'expenses',
        'category',
        existing_type=sa.VARCHAR(length=50),
        nullable=True
    )
    
    # 🔁 Remove added columns
    op.drop_column('expenses', 'payment_mode')
    op.drop_column('expenses', 'tax')
    op.drop_column('expenses', 'account')
    op.drop_column('expenses', 'type')
    op.drop_column('expenses', 'subtitle')
    op.drop_column('expenses', 'date')