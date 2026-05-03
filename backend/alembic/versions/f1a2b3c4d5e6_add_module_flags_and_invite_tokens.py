"""add module flags to clients and invite_tokens table (idempotent)

Revision ID: f1a2b3c4d5e6
Revises: e1f2a3b4c5d6
Create Date: 2026-05-03

d1e2f3a4b5c6 was stamped (not run) on the production DB so these
columns and table were never actually created. Uses IF NOT EXISTS /
IF NOT EXISTS guards so it is safe to re-run.
"""
import sqlalchemy as sa
from alembic import op

revision = 'f1a2b3c4d5e6'
down_revision = 'e1f2a3b4c5d6'
branch_labels = None
depends_on = None

_MODULE_FLAGS = [
    'module_pos', 'module_kot', 'module_inventory', 'module_reports',
    'module_expenses', 'module_staff', 'module_customers', 'module_coupons',
]


def upgrade() -> None:
    conn = op.get_bind()

    # Module flags — all default TRUE so existing restaurants get full access
    for col in _MODULE_FLAGS:
        conn.execute(sa.text(
            f"ALTER TABLE clients ADD COLUMN IF NOT EXISTS {col} BOOLEAN NOT NULL DEFAULT TRUE"
        ))

    # Invite tokens table
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS invite_tokens (
            id          SERIAL PRIMARY KEY,
            client_id   INTEGER NOT NULL,
            email       VARCHAR(255) NOT NULL,
            role        VARCHAR(50) NOT NULL DEFAULT 'cashier',
            token_hash  VARCHAR(128) NOT NULL UNIQUE,
            expires_at  TIMESTAMP NOT NULL,
            used        BOOLEAN NOT NULL DEFAULT FALSE,
            created_at  TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_invite_tokens_client_id ON invite_tokens (client_id)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_invite_tokens_token_hash ON invite_tokens (token_hash)"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS invite_tokens"))
    for col in reversed(_MODULE_FLAGS):
        conn.execute(sa.text(f"ALTER TABLE clients DROP COLUMN IF EXISTS {col}"))
