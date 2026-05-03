"""add module flags to clients and invite_tokens table

Revision ID: d1e2f3a4b5c6
Revises: c1d2e3f4a5b6
Create Date: 2026-05-02

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str]] = "fd9576e59726"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Module flags on clients table (all default True so existing restaurants get full access)
    with op.batch_alter_table("clients") as batch_op:
        batch_op.add_column(sa.Column("module_pos",       sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(sa.Column("module_kot",       sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(sa.Column("module_inventory", sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(sa.Column("module_reports",   sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(sa.Column("module_expenses",  sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(sa.Column("module_staff",     sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(sa.Column("module_customers", sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(sa.Column("module_coupons",   sa.Boolean(), nullable=False, server_default=sa.true()))

    # Invite tokens table
    op.create_table(
        "invite_tokens",
        sa.Column("id",          sa.Integer(),     primary_key=True, index=True),
        sa.Column("client_id",   sa.Integer(),     nullable=False,   index=True),
        sa.Column("email",       sa.String(255),   nullable=False),
        sa.Column("role",        sa.String(50),    nullable=False,   server_default="cashier"),
        sa.Column("token_hash",  sa.String(128),   nullable=False,   unique=True, index=True),
        sa.Column("expires_at",  sa.DateTime(),    nullable=False),
        sa.Column("used",        sa.Boolean(),     nullable=False,   server_default=sa.false()),
        sa.Column("created_at",  sa.DateTime(),    nullable=False,   server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("invite_tokens")

    with op.batch_alter_table("clients") as batch_op:
        batch_op.drop_column("module_coupons")
        batch_op.drop_column("module_customers")
        batch_op.drop_column("module_staff")
        batch_op.drop_column("module_expenses")
        batch_op.drop_column("module_reports")
        batch_op.drop_column("module_inventory")
        batch_op.drop_column("module_kot")
        batch_op.drop_column("module_pos")
