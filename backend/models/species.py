"""Species ORM model."""
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Species(Base):
    __tablename__ = "species"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    common_name: Mapped[str] = mapped_column(String(255), nullable=False)
    scientific_name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    inaturalist_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    gbif_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Back-reference populated when Sighting is defined
    sightings: Mapped[list["Sighting"]] = relationship(  # noqa: F821
        "Sighting", back_populates="species", lazy="select"
    )
