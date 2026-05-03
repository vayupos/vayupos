"""server-side merge migration (created on old server, never committed to git)

Revision ID: fd9576e59726
Revises: add_superadmin_to_users, 9748d3cff40a
Create Date: unknown

This stub exists so alembic can locate the revision that the production
database is stamped at. The upgrade/downgrade are no-ops — the actual
schema changes were applied by the old server's migration chain.
"""
from alembic import op

revision = 'fd9576e59726'
down_revision = ('add_superadmin_to_users', '47331e44edd5')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
