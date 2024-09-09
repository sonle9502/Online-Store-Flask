from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision = 'abcd1234'
down_revision = 'efgh5678'
branch_labels = None
depends_on = None

def upgrade():
    # ここでスキーマを変更します
    op.add_column('image', sa.Column('data', sa.LargeBinary(), nullable=False))

def downgrade():
    # ここでスキーマを元に戻します
    op.drop_column('image', 'data')
