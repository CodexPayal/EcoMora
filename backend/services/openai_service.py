"""Local AI service — memory-safe species identification."""

from __future__ import annotations

import io
import os
from typing import Any


_classifier = None


def _local_ai_enabled() -> bool:
    return os.getenv("ECOMORA_LOCAL_AI", "true").lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def _get_classifier():
    """
    Load the local vision model only when explicitly enabled.

    Render's free instance has a 512 MB memory limit, so the local
    Transformers/PyTorch vision model is disabled by default in production.
    """
    global _classifier

    if _classifier is None:
        import torch
        from transformers import pipeline

        torch.set_num_threads(1)

        _classifier = pipeline(
            "image-classification",
            model="google/mobilenet_v2_1.0_224",
            device=-1,
        )

    return _classifier


def _extract_species_name(label: str) -> tuple[str, str]:
    """Extract common and scientific names when the model provides both."""
    parts = [part.strip() for part in label.split(",", 1)]

    common_name = parts[0] if parts else "Unknown"
    scientific_name = parts[1] if len(parts) > 1 else "Not available"

    return common_name, scientific_name


async def identify_species(
    image_bytes: bytes | None,
    description: str | None,
) -> dict[str, Any]:
    if not image_bytes and not description:
        raise ValueError(
            "At least one of image_bytes or description must be provided."
        )

    # ------------------------------------------------------------------
    # Local image AI
    # ------------------------------------------------------------------
    if image_bytes:
        if not _local_ai_enabled():
            return {
                "common_name": "Identification unavailable",
                "scientific_name": "Not available",
                "confidence": 0,
                "description": (
                    "Local image identification is disabled in the "
                    "memory-limited production environment. Please verify "
                    "the species using a trusted biodiversity source."
                ),
            }

        from PIL import Image

        classifier = _get_classifier()

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Keep the image small before inference to reduce memory usage.
        image.thumbnail((512, 512))

        results = classifier(image, top_k=3)

        best = results[0] if results else {
            "label": "Unknown",
            "score": 0,
        }

        label = str(best.get("label", "Unknown"))
        confidence = float(best.get("score", 0)) * 100

        common_name, scientific_name = _extract_species_name(label)

        return {
            "common_name": common_name,
            "scientific_name": scientific_name,
            "confidence": round(confidence, 2),
            "description": (
                f"Local computer vision model identified this image as "
                f"'{label}'. This is an AI-generated prediction and should "
                f"be independently verified."
            ),
        }

    # ------------------------------------------------------------------
    # Description-only request
    # ------------------------------------------------------------------
    return {
        "common_name": "Unknown",
        "scientific_name": "Not available",
        "confidence": 0,
        "description": (
            "Text-only identification is not available in the current "
            "lightweight deployment. Please upload an image and verify "
            "important observations independently."
        ),
    }