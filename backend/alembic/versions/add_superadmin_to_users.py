"""Add is_superadmin column to users table

Revision ID: add_superadmin_to_users
Revises: add_clients_table
Create Date: 2026-04-30
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "add_superadmin_to_users"
down_revision: Union[str, Sequence[str], None] = "add_clients_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_superadmin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "is_superadmin")
