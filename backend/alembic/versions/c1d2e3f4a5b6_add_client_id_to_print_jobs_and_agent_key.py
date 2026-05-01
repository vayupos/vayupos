"""add client_id to print_jobs and print_agent_key to clients

Revision ID: c1d2e3f4a5b6
Revises: add_superadmin_to_users, 9748d3cff40a
Create Date: 2026-05-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import secrets

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = ("add_superadmin_to_users", "9748d3cff40a")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── print_jobs: add client_id ────────────────────────────────────────────
    op.add_column("print_jobs", sa.Column("client_id", sa.Integer(), nullable=True))
    # Backfill from the related order
    op.execute(
        "UPDATE print_jobs SET client_id = ("
        "  SELECT client_id FROM orders WHERE orders.id = print_jobs.order_id"
        ") WHERE client_id IS NULL"
    )
    # Default any orphaned jobs to client 1
    op.execute("UPDATE print_jobs SET client_id = 1 WHERE client_id IS NULL")
    op.alter_column("print_jobs", "client_id", nullable=False)
    op.create_index(op.f("ix_print_jobs_client_id"), "print_jobs", ["client_id"], unique=False)

    # ── clients: add print_agent_key ─────────────────────────────────────────
    op.add_column("clients", sa.Column("print_agent_key", sa.String(64), nullable=True))
    op.create_index(op.f("ix_clients_print_agent_key"), "clients", ["print_agent_key"], unique=False)
    # Generate a unique key for every existing client
    connection = op.get_bind()
    clients = connection.execute(sa.text("SELECT id FROM clients")).fetchall()
    for (client_id,) in clients:
        key = secrets.token_urlsafe(32)
        connection.execute(
            sa.text("UPDATE clients SET print_agent_key = :key WHERE id = :id"),
            {"key": key, "id": client_id},
        )


def downgrade() -> None:
    op.drop_index(op.f("ix_clients_print_agent_key"), table_name="clients")
    op.drop_column("clients", "print_agent_key")
    op.drop_index(op.f("ix_print_jobs_client_id"), table_name="print_jobs")
    op.drop_column("print_jobs", "client_id")
