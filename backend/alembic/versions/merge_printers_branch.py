"""final head marker

Revision ID: b0c1d2e3f4a5
Revises: a1b2c3d4e5f6
Create Date: 2026-05-02

47331e44edd5 is already merged by fd9576e59726 (the server-side merge).
This is now a simple pass-through so alembic upgrade head works cleanly.
"""
from alembic import op

revision = 'b0c1d2e3f4a5'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
