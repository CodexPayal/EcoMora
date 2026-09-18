"""Initial schema — creates users, species, and sightings tables.

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── species ──────────────────────────────────────────────────────────────
    op.create_table(
        "species",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("common_name", sa.String(255), nullable=False),
        sa.Column("scientific_name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("inaturalist_id", sa.String(64), nullable=True),
        sa.Column("gbif_id", sa.String(64), nullable=True),
        sa.Column("image_url", sa.String(512), nullable=True),
    )
    op.create_index("ix_species_id", "species", ["id"])
    op.create_index("ix_species_scientific_name", "species", ["scientific_name"], unique=True)

    # ── sightings ────────────────────────────────────────────────────────────
    op.create_table(
        "sightings",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("species_id", sa.Integer(), sa.ForeignKey("species.id"), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("photo_url", sa.String(512), nullable=True),
        sa.Column("sighted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
    )
    op.create_index("ix_sightings_id", "sightings", ["id"])
    op.create_index("ix_sightings_user_id", "sightings", ["user_id"])
    op.create_index("ix_sightings_species_id", "sightings", ["species_id"])


def downgrade() -> None:
    op.drop_index("ix_sightings_species_id", table_name="sightings")
    op.drop_index("ix_sightings_user_id", table_name="sightings")
    op.drop_index("ix_sightings_id", table_name="sightings")
    op.drop_table("sightings")

    op.drop_index("ix_species_scientific_name", table_name="species")
    op.drop_index("ix_species_id", table_name="species")
    op.drop_table("species")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
