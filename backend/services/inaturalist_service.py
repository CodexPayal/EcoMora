"""iNaturalist service — taxon lookup by scientific name."""
from __future__ import annotations

from typing import Any

import httpx

_INATURALIST_BASE = "https://api.inaturalist.org/v1"
_TIMEOUT = 10.0


async def search_inaturalist(scientific_name: str) -> dict[str, Any] | None:
    """Search iNaturalist for a taxon matching *scientific_name*.

    Args:
        scientific_name: The binomial Latin name to search for.

    Returns:
        A dict with keys ``id``, ``common_name``, ``image_url``, and ``url``
        if a match is found, otherwise None.
    """
    url = f"{_INATURALIST_BASE}/taxa"
    params = {"q": scientific_name, "per_page": 1, "rank": "species"}

    async with httpx.AsyncClient(timeout=_TIMEOUT) as http:
        try:
            resp = await http.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
        except (httpx.HTTPError, Exception):
            return None

    results = data.get("results", [])
    if not results:
        return None

    taxon = results[0]
    default_photo = taxon.get("default_photo") or {}

    return {
        "id": taxon.get("id"),
        "common_name": taxon.get("preferred_common_name") or taxon.get("name"),
        "image_url": default_photo.get("medium_url"),
        "url": f"https://www.inaturalist.org/taxa/{taxon.get('id')}",
    }
