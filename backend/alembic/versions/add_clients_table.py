"""Add clients table for restaurant profile and printer settings

Revision ID: add_clients_table
Revises: ead713b93409
Create Date: 2026-04-30
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "add_clients_table"
down_revision: Union[str, Sequence[str], None] = "ead713b93409"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("restaurant_name", sa.String(200), nullable=False, server_default="My Restaurant"),
        sa.Column("owner_name", sa.String(100), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("currency_symbol", sa.String(5), nullable=False, server_default="₹"),
        sa.Column("bill_header", sa.Text(), nullable=True),
        sa.Column("bill_footer", sa.Text(), nullable=False, server_default="Thank you for visiting! Please come again."),
        sa.Column("bill_printer_type", sa.String(20), nullable=False, server_default="browser"),
        sa.Column("bill_paper_width", sa.String(10), nullable=False, server_default="80"),
        sa.Column("bill_printer_ip", sa.String(45), nullable=True),
        sa.Column("bill_printer_port", sa.Integer(), nullable=True, server_default="9100"),
        sa.Column("kot_printer_type", sa.String(20), nullable=False, server_default="browser"),
        sa.Column("kot_paper_width", sa.String(10), nullable=False, server_default="80"),
        sa.Column("kot_printer_ip", sa.String(45), nullable=True),
        sa.Column("kot_printer_port", sa.Integer(), nullable=True, server_default="9100"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("trial_expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("clients")
