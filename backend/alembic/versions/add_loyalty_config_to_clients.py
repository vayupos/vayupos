"""add loyalty config to clients

Revision ID: a1b2c3d4e5f6
Revises: d1e2f3a4b5c6
Create Date: 2026-05-02
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('clients', sa.Column('loyalty_point_value',    sa.Float(), nullable=False, server_default='0.10'))
    op.add_column('clients', sa.Column('loyalty_earn_pct',       sa.Float(), nullable=False, server_default='2.0'))
    op.add_column('clients', sa.Column('loyalty_min_redeem_pts', sa.Integer(), nullable=False, server_default='100'))


def downgrade():
    op.drop_column('clients', 'loyalty_min_redeem_pts')
    op.drop_column('clients', 'loyalty_earn_pct')
    op.drop_column('clients', 'loyalty_point_value')
