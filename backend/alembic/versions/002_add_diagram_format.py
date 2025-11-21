"""Add format column to diagrams table

Revision ID: 002
Revises: 001
Create Date: 2024-01-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the diagram format enum type
    op.execute("""
        CREATE TYPE diagramformatenum AS ENUM ('mermaid', 'drawio')
    """)

    # Add format column with default value 'mermaid' for existing rows
    op.add_column(
        'diagrams',
        sa.Column('format', sa.Enum('mermaid', 'drawio', name='diagramformatenum'),
                  nullable=False, server_default='mermaid')
    )


def downgrade() -> None:
    # Remove the format column
    op.drop_column('diagrams', 'format')

    # Drop the enum type
    op.execute('DROP TYPE diagramformatenum')
