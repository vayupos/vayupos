"""Creating API for Notifications

Revision ID: 3bc4f1a635cf
Revises: 1ae755f1ed1c
Create Date: 2026-01-25 21:49:36.009543
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '3bc4f1a635cf'
down_revision: Union[str, Sequence[str], None] = '1ae755f1ed1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    op.create_index(
        'ix_notifications_id',
        'notifications',
        ['id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_notifications_id', table_name='notifications')
    op.drop_table('notifications')
