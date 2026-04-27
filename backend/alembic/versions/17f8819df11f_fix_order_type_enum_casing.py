"""fix_order_type_enum_casing

Revision ID: 17f8819df11f
Revises: 4edd585b7caf
Create Date: 2026-04-26 09:05:20.974937

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '17f8819df11f'
down_revision: Union[str, Sequence[str], None] = '4edd585b7caf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rename existing labels in the PostgreSQL Enum type
    # These labels need to match the Python Enum member NAMES (DINE_IN, TAKEAWAY)
    # because SQLAlchemy Enum uses names by default.
    op.execute("ALTER TYPE ordertype RENAME VALUE 'dine_in' TO 'DINE_IN'")
    op.execute("ALTER TYPE ordertype RENAME VALUE 'takeaway' TO 'TAKEAWAY'")
    
    # Update the server default for the column to match the new labels
    op.alter_column('orders', 'order_type', server_default='DINE_IN')


def downgrade() -> None:
    """Downgrade schema."""
    # Revert labels to lowercase
    op.execute("ALTER TYPE ordertype RENAME VALUE 'DINE_IN' TO 'dine_in'")
    op.execute("ALTER TYPE ordertype RENAME VALUE 'TAKEAWAY' TO 'takeaway'")
    
    # Revert server default
    op.alter_column('orders', 'order_type', server_default='dine_in')
