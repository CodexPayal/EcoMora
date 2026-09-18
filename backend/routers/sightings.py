"""Sightings router — CRUD endpoints for community sighting log."""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from core.database import get_db
from core.security import get_current_user
from models.sighting import Sighting
from models.species import Species
from models.user import User
from schemas.sighting import SightingResponse

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_or_create_species(
    db: Session,
    scientific_name: str,
    common_name: str,
    description: Optional[str] = None,
    image_url: Optional[str] = None,
) -> Species:
    """Return an existing Species row (matched on scientific_name) or create one."""
    species = (
        db.query(Species)
        .filter(Species.scientific_name == scientific_name)
        .first()
    )
    if species is None:
        species = Species(
            common_name=common_name,
            scientific_name=scientific_name,
            description=description,
            image_url=image_url,
        )
        db.add(species)
        db.flush()  # get species.id without committing
    return species


def _save_photo(photo: UploadFile) -> str:
    """Save an uploaded photo under static/uploads/ and return the relative URL."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(photo.filename or "upload")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(UPLOAD_DIR, filename)
    with open(dest, "wb") as f:
        f.write(photo.file.read())
    return f"/static/uploads/{filename}"


def _sighting_query(db: Session):
    return (
        db.query(Sighting)
        .options(
            joinedload(Sighting.user),
            joinedload(Sighting.species),
        )
    )


# ---------------------------------------------------------------------------
# POST /sightings — create a new sighting (auth required)
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=SightingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a new sighting",
)
def create_sighting(
    common_name: str = Form(...),
    scientific_name: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    notes: Optional[str] = Form(None),
    species_description: Optional[str] = Form(None),
    species_image_url: Optional[str] = Form(None),
    sighted_at: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Sighting:
    """Create a new community sighting.

    Accepts multipart/form-data with species fields, coordinates, notes, and an
    optional photo upload.  If a Species row with the same scientific_name already
    exists it is reused; otherwise a new one is created.
    """
    species = _get_or_create_species(
        db,
        scientific_name=scientific_name,
        common_name=common_name,
        description=species_description,
        image_url=species_image_url,
    )

    photo_url: Optional[str] = None
    if photo and photo.filename:
        photo_url = _save_photo(photo)

    sighted_dt = datetime.now(timezone.utc)
    if sighted_at:
        try:
            sighted_dt = datetime.fromisoformat(sighted_at)
        except ValueError:
            pass

    sighting = Sighting(
        user_id=current_user.id,
        species_id=species.id,
        latitude=latitude,
        longitude=longitude,
        notes=notes,
        photo_url=photo_url,
        sighted_at=sighted_dt,
    )
    db.add(sighting)
    db.commit()
    db.refresh(sighting)
    # Re-fetch with eager-loaded relationships for the response
    return _sighting_query(db).filter(Sighting.id == sighting.id).one()


# ---------------------------------------------------------------------------
# GET /sightings — paginated public feed
# ---------------------------------------------------------------------------

@router.get("", response_model=list[SightingResponse], summary="List all sightings")
def list_sightings(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
) -> list[Sighting]:
    """Return a paginated list of all sightings (public), newest first."""
    return (
        _sighting_query(db)
        .order_by(Sighting.sighted_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ---------------------------------------------------------------------------
# GET /sightings/{id} — single sighting detail
# ---------------------------------------------------------------------------

@router.get("/{sighting_id}", response_model=SightingResponse, summary="Get a sighting")
def get_sighting(sighting_id: int, db: Session = Depends(get_db)) -> Sighting:
    sighting = _sighting_query(db).filter(Sighting.id == sighting_id).first()
    if sighting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sighting not found")
    return sighting


# ---------------------------------------------------------------------------
# PATCH /sightings/{id} — update (owner only)
# ---------------------------------------------------------------------------

@router.patch("/{sighting_id}", response_model=SightingResponse, summary="Update a sighting")
def update_sighting(
    sighting_id: int,
    notes: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Sighting:
    sighting = db.get(Sighting, sighting_id)
    if sighting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sighting not found")
    if sighting.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised to edit this sighting")

    if notes is not None:
        sighting.notes = notes
    if latitude is not None:
        sighting.latitude = latitude
    if longitude is not None:
        sighting.longitude = longitude
    if photo and photo.filename:
        sighting.photo_url = _save_photo(photo)

    db.commit()
    return _sighting_query(db).filter(Sighting.id == sighting_id).one()


# ---------------------------------------------------------------------------
# DELETE /sightings/{id} — delete (owner only)
# ---------------------------------------------------------------------------

@router.delete("/{sighting_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a sighting")
def delete_sighting(
    sighting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    sighting = db.get(Sighting, sighting_id)
    if sighting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sighting not found")
    if sighting.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised to delete this sighting")
    db.delete(sighting)
    db.commit()
