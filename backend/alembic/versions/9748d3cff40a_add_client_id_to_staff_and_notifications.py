"""add_client_id_to_staff_and_notifications

Revision ID: 9748d3cff40a
Revises: 10bedd6da7b7
Create Date: 2026-04-24 10:52:52.630442

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9748d3cff40a'
down_revision: Union[str, Sequence[str], None] = '10bedd6da7b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add client_id to staff
    op.add_column('staff', sa.Column('client_id', sa.Integer(), nullable=True))
    op.execute("UPDATE staff SET client_id = 1 WHERE client_id IS NULL")
    op.alter_column('staff', 'client_id', nullable=False)
    op.create_index(op.f('ix_staff_client_id'), 'staff', ['client_id'], unique=False)

    # Add client_id to notifications
    op.add_column('notifications', sa.Column('client_id', sa.Integer(), nullable=True))
    op.execute("UPDATE notifications SET client_id = 1 WHERE client_id IS NULL")
    op.alter_column('notifications', 'client_id', nullable=False)
    op.create_index(op.f('ix_notifications_client_id'), 'notifications', ['client_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_notifications_client_id'), table_name='notifications')
    op.drop_column('notifications', 'client_id')
    op.drop_index(op.f('ix_staff_client_id'), table_name='staff')
    op.drop_column('staff', 'client_id')
