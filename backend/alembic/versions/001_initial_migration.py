"""Initial migration

Revision ID: 001
Revises:
Create Date: 2024-01-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create diagrams table
    op.create_table(
        'diagrams',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('type', sa.Enum(
            'flowchart', 'architecture', 'sequence', 'gantt', 'swimlane',
            'er', 'class', 'state', 'mindmap', 'roadmap',
            name='diagramtypeenum'
        ), nullable=False),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('ai_provider', sa.Enum('claude', 'openai', name='aiproviderenum'), nullable=True),
        sa.Column('ai_prompt', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_diagrams_id'), 'diagrams', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_diagrams_id'), table_name='diagrams')
    op.drop_table('diagrams')
    op.execute('DROP TYPE diagramtypeenum')
    op.execute('DROP TYPE aiproviderenum')