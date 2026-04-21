"""add staff table

Revision ID: 8d82d991b3ed
Revises: b7475fa068d6
Create Date: 2026-01-11 11:29:37.096860
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '8d82d991b3ed'
down_revision: Union[str, Sequence[str], None] = 'b7475fa068d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('staff', sa.Column('salary', sa.Float(), nullable=False, server_default='0'))
    op.add_column('staff', sa.Column('joined', sa.DateTime(), nullable=False, server_default=sa.func.now()))

def downgrade() -> None:
    op.drop_column('staff', 'joined')
    op.drop_column('staff', 'salary')
