"""Pydantic schemas for the Species model."""
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class SpeciesCreate(BaseModel):
    """Payload for creating a new Species record (used internally by the identify flow)."""
    common_name: str
    scientific_name: str
    description: str | None = None
    inaturalist_id: str | None = None
    gbif_id: str | None = None
    image_url: str | None = None


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class SpeciesResponse(BaseModel):
    """Species info returned by the API."""
    id: int
    common_name: str
    scientific_name: str
    description: str | None
    inaturalist_id: str | None
    gbif_id: str | None
    image_url: str | None

    model_config = {"from_attributes": True}
