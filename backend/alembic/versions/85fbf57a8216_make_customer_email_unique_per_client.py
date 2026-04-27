"""make_customer_email_unique_per_client

Revision ID: 85fbf57a8216
Revises: 3f67ad0b1d56
Create Date: 2026-04-25 00:45:50.631784

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85fbf57a8216'
down_revision: Union[str, Sequence[str], None] = '3f67ad0b1d56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop the existing unique index on email
    op.drop_index('ix_customers_email', table_name='customers')
    # Re-create it as a normal index
    op.create_index('ix_customers_email', 'customers', ['email'], unique=False)
    # Add the new multi-column unique constraint
    op.create_unique_constraint('_client_email_uc', 'customers', ['client_id', 'email'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the multi-column unique constraint
    op.drop_constraint('_client_email_uc', 'customers', type_='unique')
    # Restore the unique index on email
    op.drop_index('ix_customers_email', table_name='customers')
    op.create_index('ix_customers_email', 'customers', ['email'], unique=True)
