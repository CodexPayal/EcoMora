"""Local AI service — free image classification for species identification."""
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
    """Load a lightweight vision model for deployment."""
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

    if image_bytes:
        if not _local_ai_enabled():
            return {
                "common_name": "Identification unavailable",
                "scientific_name": "Not available",
                "confidence": 0,
                "description": (
                    "Image identification is disabled in lightweight "
                    "deployment mode. Please verify the species manually "
                    "or use the local development version of EcoMora."
                ),
            }

        from PIL import Image

        classifier = _get_classifier()

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = classifier(image, top_k=3)

        best = results[0] if results else {
            "label": "Unknown",
            "score": 0,
        }

        label = best["label"]
        confidence = float(best["score"]) * 100

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

    return {
        "common_name": "Unknown",
        "scientific_name": "Not available",
        "confidence": 0,
        "description": (
            "Text-only identification is not available in the free local "
            "vision model. Please upload an image."
        ),
    }