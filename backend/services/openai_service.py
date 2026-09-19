"""AI service for EcoMora species identification."""

from __future__ import annotations

import base64
import json
import os
from typing import Any

import httpx


OPENAI_API_URL = "https://api.openai.com/v1/responses"
OPENAI_MODEL = os.getenv("OPENAI_VISION_MODEL", "gpt-5.6-luna")


def _get_api_key() -> str:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()

    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured on the backend."
        )

    return api_key


def _parse_json_response(text: str) -> dict[str, Any]:
    text = text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "", 1)
        text = text.replace("```", "", 1).strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"AI returned an invalid identification response: {text}"
        ) from exc

    if not isinstance(data, dict):
        raise RuntimeError("AI returned an invalid identification format.")

    return data


async def identify_species(
    image_bytes: bytes | None,
    description: str | None,
) -> dict[str, Any]:
    if not image_bytes and not description:
        raise ValueError(
            "At least one of image_bytes or description must be provided."
        )

    api_key = _get_api_key()

    prompt = """
You are EcoMora, an AI-powered biodiversity assistant.

Analyze the provided image and identify the organism as accurately as
possible.

Return ONLY valid JSON in exactly this structure:

{
  "common_name": "best common name",
  "scientific_name": "best scientific name",
  "confidence": 85,
  "description": "short explanation"
}

Rules:
- confidence must be a number from 0 to 100.
- If species-level identification is uncertain, use the most reliable
  genus/family/common-group identification instead of inventing a species.
- Never invent a scientific name.
- Mention uncertainty in the description when appropriate.
- Keep the description concise.
- This is an AI prediction and should be independently verified for
  important biodiversity or conservation decisions.
"""

    if description:
        prompt += f"\nUser description: {description}"

    image_data = None

    if image_bytes:
        encoded = base64.b64encode(image_bytes).decode("utf-8")

        # Most uploads from the frontend are JPEG/PNG.
        # JPEG is a safe default for the model input.
        image_data = f"data:image/jpeg;base64,{encoded}"

    content: list[dict[str, Any]] = [
        {
            "type": "input_text",
            "text": prompt,
        }
    ]

    if image_data:
        content.append(
            {
                "type": "input_image",
                "image_url": image_data,
                "detail": "low",
            }
        )

    payload = {
        "model": OPENAI_MODEL,
        "input": [
            {
                "role": "user",
                "content": content,
            }
        ],
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(
            OPENAI_API_URL,
            headers=headers,
            json=payload,
        )

    if response.status_code >= 400:
        try:
            error_data = response.json()
            error_message = (
                error_data.get("error", {}).get("message")
                or str(error_data)
            )
        except Exception:
            error_message = response.text

        raise RuntimeError(
            f"OpenAI API error ({response.status_code}): {error_message}"
        )

    data = response.json()

    output_text = data.get("output_text")

    if not output_text:
        # Fallback for responses where output_text is not directly exposed.
        output_parts: list[str] = []

        for item in data.get("output", []):
            for content_item in item.get("content", []):
                if content_item.get("type") == "output_text":
                    text = content_item.get("text")
                    if text:
                        output_parts.append(text)

        output_text = "".join(output_parts)

    if not output_text:
        raise RuntimeError("OpenAI returned an empty identification response.")

    result = _parse_json_response(output_text)

    common_name = str(
        result.get("common_name") or "Unknown"
    ).strip()

    scientific_name = str(
        result.get("scientific_name") or "Not available"
    ).strip()

    try:
        confidence = float(result.get("confidence", 0))
    except (TypeError, ValueError):
        confidence = 0.0

    confidence = max(0.0, min(100.0, confidence))

    description_text = str(
        result.get("description")
        or "AI-generated identification. Please verify important observations independently."
    ).strip()

    return {
        "common_name": common_name,
        "scientific_name": scientific_name,
        "confidence": round(confidence, 2),
        "description": description_text,
    }