"""add client lifecycle columns (is_active, trial_expires_at, created_at, updated_at)

Revision ID: g1a2b3c4d5e6
Revises: f1a2b3c4d5e6
Create Date: 2026-05-03

The production clients table was missing these columns from the
original add_clients_table migration. Uses IF NOT EXISTS guards.
"""
import sqlalchemy as sa
from alembic import op

revision = 'g1a2b3c4d5e6'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE"
    ))
    conn.execute(sa.text(
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP"
    ))
    conn.execute(sa.text(
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()"
    ))
    conn.execute(sa.text(
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    for col in ('updated_at', 'created_at', 'trial_expires_at', 'is_active'):
        conn.execute(sa.text(f"ALTER TABLE clients DROP COLUMN IF EXISTS {col}"))
