"""GBIF service — species match by scientific name."""
from __future__ import annotations

from typing import Any

import httpx

_GBIF_BASE = "https://api.gbif.org/v1"
_TIMEOUT = 10.0


async def search_gbif(scientific_name: str) -> dict[str, Any] | None:
    """Query the GBIF species match API for *scientific_name*.

    Args:
        scientific_name: The binomial Latin name to match.

    Returns:
        A dict with keys ``usageKey``, ``canonicalName``, ``rank``, ``status``,
        ``kingdom``, ``phylum``, ``class_``, ``order``, ``family``, ``genus``
        if a match with confidence >= 90 is found, otherwise None.
    """
    url = f"{_GBIF_BASE}/species/match"
    params = {"name": scientific_name, "strict": "false"}

    async with httpx.AsyncClient(timeout=_TIMEOUT) as http:
        try:
            resp = await http.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
        except (httpx.HTTPError, Exception):
            return None

    # GBIF returns a matchType of NONE when nothing is found
    if data.get("matchType") == "NONE":
        return None

    # Only trust matches with reasonable confidence
    if data.get("confidence", 0) < 50:
        return None

    return {
        "usageKey": data.get("usageKey"),
        "canonicalName": data.get("canonicalName"),
        "rank": data.get("rank"),
        "status": data.get("status"),
        "kingdom": data.get("kingdom"),
        "phylum": data.get("phylum"),
        "class_": data.get("class"),
        "order": data.get("order"),
        "family": data.get("family"),
        "genus": data.get("genus"),
    }
