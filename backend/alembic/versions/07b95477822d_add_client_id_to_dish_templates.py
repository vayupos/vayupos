"""Add client_id to dish_templates

Revision ID: 07b95477822d
Revises: e510f0c8fa14
Create Date: 2026-04-25 21:09:08.978457

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '07b95477822d'
down_revision: Union[str, Sequence[str], None] = 'e510f0c8fa14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add client_id with a default so existing rows don't break, then alter to nullable=False
    # op.add_column('dish_templates', sa.Column('client_id', sa.Integer(), nullable=True))
    # op.execute("UPDATE dish_templates SET client_id = 1 WHERE client_id IS NULL")
    op.alter_column('dish_templates', 'client_id', nullable=False)
    
    # op.create_index(op.f('ix_dish_templates_client_id'), 'dish_templates', ['client_id'], unique=False)
    
    op.drop_index(op.f('ix_dish_templates_name'), table_name='dish_templates')
    op.create_index(op.f('ix_dish_templates_name'), 'dish_templates', ['name'], unique=False)
    op.create_unique_constraint('uq_dish_template_client_name', 'dish_templates', ['client_id', 'name'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_dish_template_client_name', 'dish_templates', type_='unique')
    op.drop_index(op.f('ix_dish_templates_name'), table_name='dish_templates')
    op.create_index(op.f('ix_dish_templates_name'), 'dish_templates', ['name'], unique=True)
    
    op.drop_index(op.f('ix_dish_templates_client_id'), table_name='dish_templates')
    op.drop_column('dish_templates', 'client_id')
