"""Pydantic schemas for the Sighting model."""
from datetime import datetime

from pydantic import BaseModel

from schemas.user import UserPublic
from schemas.species import SpeciesResponse


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class SightingCreate(BaseModel):
    """Payload for POST /sightings."""
    species_id: int
    latitude: float
    longitude: float
    notes: str | None = None
    # photo_url is set server-side after saving the uploaded file
    photo_url: str | None = None
    sighted_at: datetime


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class SightingResponse(BaseModel):
    """Full sighting detail returned by the API, with nested user and species."""
    id: int
    latitude: float
    longitude: float
    notes: str | None
    photo_url: str | None
    sighted_at: datetime
    created_at: datetime
    user: UserPublic
    species: SpeciesResponse

    model_config = {"from_attributes": True}
