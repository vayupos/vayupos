"""Add printers table

Revision ID: 47331e44edd5
Revises: a8b3549f762b
Create Date: 2026-04-26 20:22:02.967589

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47331e44edd5'
down_revision: Union[str, Sequence[str], None] = 'a8b3549f762b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
