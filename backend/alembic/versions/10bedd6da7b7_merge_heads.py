"""merge_heads

Revision ID: 10bedd6da7b7
Revises: 3bc4f1a635cf, 9b1f0c33de4a
Create Date: 2026-04-24 10:52:41.957341

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '10bedd6da7b7'
down_revision: Union[str, Sequence[str], None] = ('3bc4f1a635cf', '9b1f0c33de4a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
