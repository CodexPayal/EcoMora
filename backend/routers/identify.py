"""Identify router — POST /identify."""
from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from core.security import get_current_user
from models.user import User
from services.gbif_service import search_gbif
from services.inaturalist_service import search_inaturalist
from services.openai_service import identify_species

router = APIRouter()


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

class IdentifyResponse(BaseModel):
    common_name: str
    scientific_name: str
    confidence: float
    description: str
    inaturalist: dict[str, Any] | None = None
    gbif: dict[str, Any] | None = None


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/identify",
    response_model=IdentifyResponse,
    summary="Identify a species from an image and/or description",
)
async def identify(
    image: UploadFile | None = File(default=None),
    description: str | None = Form(default=None),
    _current_user: User = Depends(get_current_user),
) -> IdentifyResponse:
    """Accepts a multipart/form-data request with an optional ``image`` file
    and/or an optional ``description`` text field.

    Returns structured species identification data enriched with iNaturalist
    and GBIF metadata where available.
    """
    if image is None and not description:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide at least an image or a description.",
        )

    # Read image bytes if provided
    image_bytes: bytes | None = None
    if image is not None:
        image_bytes = await image.read()

    # Call OpenAI
    try:
        ai_result = await identify_species(image_bytes, description)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI identification failed: {exc}",
        ) from exc

    scientific_name: str = ai_result.get("scientific_name", "")

    # Fan-out to iNaturalist + GBIF in parallel (best-effort)
    inat_result: dict[str, Any] | None = None
    gbif_result: dict[str, Any] | None = None

    if scientific_name:
        inat_result, gbif_result = await asyncio.gather(
            search_inaturalist(scientific_name),
            search_gbif(scientific_name),
        )

    return IdentifyResponse(
        common_name=ai_result.get("common_name", "Unknown"),
        scientific_name=scientific_name or "Unknown",
        confidence=float(ai_result.get("confidence", 0)),
        description=ai_result.get("description", ""),
        inaturalist=inat_result,
        gbif=gbif_result,
    )
