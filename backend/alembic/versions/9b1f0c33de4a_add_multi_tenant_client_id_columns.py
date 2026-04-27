"""Add multi-tenant client_id columns

Revision ID: 9b1f0c33de4a
Revises: 7d3c2f11aa9b
Create Date: 2026-04-23 11:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9b1f0c33de4a"
down_revision: Union[str, Sequence[str], None] = "7d3c2f11aa9b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES = [
    "users",
    "categories",
    "products",
    "customers",
    "orders",
    "coupons",
    "expenses",
    "inventory_logs",
    "payments",
    "order_items",
    "order_coupons",
    "coupon_categories",
]


def upgrade() -> None:
    # Get database connection
    conn = op.get_bind()
    for table in TABLES:
        # Check if column already exists
        check = conn.execute(sa.text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='client_id'")).fetchone()
        if not check:
            print(f"Adding client_id to {table}")
            op.add_column(table, sa.Column("client_id", sa.Integer(), nullable=True))
            op.execute(f"UPDATE {table} SET client_id = 1 WHERE client_id IS NULL")
            op.alter_column(table, "client_id", existing_type=sa.Integer(), nullable=False)
            op.create_index(op.f(f"ix_{table}_client_id"), table, ["client_id"], unique=False)
        else:
            print(f"Column client_id already exists in {table}, skipping.")


def downgrade() -> None:
    for table in reversed(TABLES):
        op.drop_index(op.f(f"ix_{table}_client_id"), table_name=table)
        op.drop_column(table, "client_id")
