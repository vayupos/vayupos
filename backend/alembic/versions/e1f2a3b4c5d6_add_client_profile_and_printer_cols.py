"""add client profile and printer settings columns

Revision ID: e1f2a3b4c5d6
Revises: b0c1d2e3f4a5
Create Date: 2026-05-03

The production clients table was created without some columns. Uses
ADD COLUMN IF NOT EXISTS so it is safe to run even when some columns
already exist on the production DB.
"""
import sqlalchemy as sa
from alembic import op

revision = 'e1f2a3b4c5d6'
down_revision = 'b0c1d2e3f4a5'
branch_labels = None
depends_on = None

# (column_name, DDL fragment)
_COLUMNS = [
    ("restaurant_name", "VARCHAR(200) NOT NULL DEFAULT 'My Restaurant'"),
    ("owner_name",      "VARCHAR(100)"),
    ("phone",           "VARCHAR(20)"),
    ("email",           "VARCHAR(255)"),
    ("address",         "TEXT"),
    ("city",            "VARCHAR(100)"),
    ("logo_url",        "TEXT"),
    ("currency_symbol", "VARCHAR(5) NOT NULL DEFAULT '₹'"),
    ("bill_header",     "TEXT"),
    ("bill_footer",     "TEXT NOT NULL DEFAULT 'Thank you for visiting! Please come again.'"),
    ("bill_printer_type", "VARCHAR(20) NOT NULL DEFAULT 'browser'"),
    ("bill_paper_width",  "VARCHAR(10) NOT NULL DEFAULT '80'"),
    ("bill_printer_ip",   "VARCHAR(45)"),
    ("bill_printer_port", "INTEGER DEFAULT 9100"),
    ("kot_printer_type",  "VARCHAR(20) NOT NULL DEFAULT 'browser'"),
    ("kot_paper_width",   "VARCHAR(10) NOT NULL DEFAULT '80'"),
    ("kot_printer_ip",    "VARCHAR(45)"),
    ("kot_printer_port",  "INTEGER DEFAULT 9100"),
]


def upgrade() -> None:
    conn = op.get_bind()
    for col, ddl in _COLUMNS:
        conn.execute(sa.text(
            f"ALTER TABLE clients ADD COLUMN IF NOT EXISTS {col} {ddl}"
        ))


def downgrade() -> None:
    conn = op.get_bind()
    for col, _ in reversed(_COLUMNS):
        conn.execute(sa.text(
            f"ALTER TABLE clients DROP COLUMN IF EXISTS {col}"
        ))
