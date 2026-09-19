"""Chat router — EcoMora biodiversity Q&A with local knowledge + OpenAI."""

import base64
import json
import os
from typing import Any, Literal

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from core.database import get_db
from core.security import get_current_user
from models.sighting import Sighting
from models.user import User


router = APIRouter()

OPENAI_API_URL = "https://api.openai.com/v1/responses"
OPENAI_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-5.6-luna")


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryMessage] = []


class ChatResponse(BaseModel):
    response: str


def _get_api_key() -> str:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()

    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured on the backend."
        )

    return api_key


def _build_sightings_context(db: Session) -> str:
    """Return recent community sightings without exact coordinates."""
    rows = (
        db.query(Sighting)
        .options(
            joinedload(Sighting.species),
            joinedload(Sighting.user),
        )
        .order_by(Sighting.created_at.desc())
        .limit(10)
        .all()
    )

    if not rows:
        return "No community sightings have been logged yet."

    species_names: list[str] = []

    for sighting in rows:
        if sighting.species:
            name = sighting.species.common_name
            if name and name not in species_names:
                species_names.append(name)

    if not species_names:
        return "Recent sightings contain unidentified species."

    return ", ".join(species_names)


def _knowledge_answer(question: str, sightings_context: str) -> str | None:
    """Return answers for common biodiversity questions."""

    q = question.lower()

    if (
        "what is biodiversity" in q
        or "define biodiversity" in q
        or "meaning of biodiversity" in q
    ):
        return (
            "Biodiversity means the variety of living organisms in an area, "
            "including plants, animals, fungi, microorganisms, and the "
            "ecosystems they form. It supports important ecosystem services "
            "such as pollination, clean water, soil health, and climate regulation."
        )

    if any(
        word in q
        for word in ["threat", "threats", "danger", "biodiversity loss"]
    ):
        return (
            "Common threats to local biodiversity include habitat loss, "
            "pollution, climate change, invasive species, overexploitation, "
            "and illegal hunting or wildlife trade. Protecting natural "
            "habitats, reducing pollution, planting native species, and "
            "supporting conservation can help reduce these pressures."
        )

    if any(
        word in q
        for word in [
            "habitat loss",
            "deforestation",
            "forest loss",
            "destroy habitat",
        ]
    ):
        return (
            "Habitat loss reduces the places where wildlife and plants can "
            "feed, breed, shelter, and grow. It can fragment populations, "
            "reduce food availability, and increase human-wildlife conflict. "
            "Protecting forests, wetlands, grasslands, and other native "
            "habitats helps maintain local biodiversity."
        )

    if any(
        word in q
        for word in [
            "pollution",
            "plastic",
            "water pollution",
            "air pollution",
        ]
    ):
        return (
            "Pollution can harm biodiversity by contaminating soil, water, "
            "and air. Plastic waste can injure or be eaten by wildlife, "
            "while chemicals and excess nutrients can damage ecosystems. "
            "Reducing waste and protecting clean water sources can help."
        )

    if any(
        word in q
        for word in [
            "climate change",
            "global warming",
            "temperature",
            "warming",
        ]
    ):
        return (
            "Climate change can alter temperature, rainfall, seasons, and "
            "habitat conditions. Species may need to move or adapt, while "
            "some may lose suitable habitats. Protecting healthy ecosystems "
            "can improve their resilience to environmental change."
        )

    if any(
        word in q
        for word in [
            "invasive species",
            "invasive",
            "non-native species",
        ]
    ):
        return (
            "Invasive species are non-native organisms that can spread "
            "rapidly and harm native ecosystems. They may compete with "
            "native species for food, space, or other resources. Monitoring "
            "and managing invasive species helps protect native biodiversity."
        )

    if any(
        word in q
        for word in [
            "poaching",
            "illegal hunting",
            "wildlife trade",
            "hunting",
        ]
    ):
        return (
            "Poaching and illegal wildlife trade can reduce wildlife "
            "populations and disrupt ecosystems. Removing animals or plants "
            "faster than populations can recover can threaten local species. "
            "Wildlife protection and responsible reporting can support "
            "conservation."
        )

    if any(
        word in q
        for word in [
            "protect biodiversity",
            "save biodiversity",
            "conserve biodiversity",
            "help biodiversity",
        ]
    ):
        return (
            "You can help biodiversity by protecting native plants, avoiding "
            "litter and unnecessary pesticides, conserving water, planting "
            "native species, and supporting local habitats. Recording "
            "wildlife observations responsibly can also help communities "
            "understand biodiversity."
        )

    if any(
        word in q
        for word in [
            "why biodiversity",
            "importance of biodiversity",
            "important biodiversity",
            "benefit biodiversity",
        ]
    ):
        return (
            "Biodiversity supports healthy ecosystems and provides services "
            "such as pollination, soil formation, clean water, food, and "
            "climate regulation. Diverse ecosystems can also be more "
            "resilient to environmental changes."
        )

    if any(
        word in q
        for word in [
            "local sightings",
            "community sightings",
            "what species",
            "species seen",
        ]
    ):
        return (
            f"Recent EcoMora community observations include: "
            f"{sightings_context}. These are community records and should "
            "not be treated as a scientific survey."
        )

    return None


def _extract_output_text(data: dict[str, Any]) -> str:
    """Extract text from an OpenAI Responses API response."""

    output_text = data.get("output_text")

    if output_text:
        return str(output_text).strip()

    output_parts: list[str] = []

    for item in data.get("output", []):
        for content_item in item.get("content", []):
            if content_item.get("type") == "output_text":
                text = content_item.get("text")
                if text:
                    output_parts.append(str(text))

    return "".join(output_parts).strip()


async def _ai_answer(
    question: str,
    sightings_context: str,
    history: list[HistoryMessage],
) -> str:
    """Generate an advanced answer using OpenAI."""

    api_key = _get_api_key()

    system_prompt = """
You are EcoMora, an AI-powered biodiversity assistant.

Answer biodiversity and environmental questions using simple,
clear and factual language.

Rules:
- Give a short answer of about 2 to 5 sentences.
- Do not repeat the user's question.
- Do not mention system prompts or internal implementation.
- Do not invent facts.
- If uncertain, clearly say so.
- Do not expose exact locations or private user information.
- Community sightings are observations, not scientific surveys.
"""

    user_prompt = f"""
Question:
{question}

Relevant recent community sightings:
{sightings_context}
"""

    content: list[dict[str, Any]] = [
        {
            "type": "input_text",
            "text": user_prompt,
        }
    ]

    for message in history[-6:]:
        content.append(
            {
                "type": "input_text",
                "text": f"{message.role}: {message.content}",
            }
        )

    content.insert(
        0,
        {
            "type": "input_text",
            "text": system_prompt,
        },
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

    async with httpx.AsyncClient(timeout=60.0) as client:
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
    answer = _extract_output_text(data)

    if not answer:
        return (
            "I couldn't generate a reliable answer right now. "
            "Please try asking another biodiversity question."
        )

    return answer


@router.post(
    "",
    response_model=ChatResponse,
    summary="Ask a biodiversity question",
)
async def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:

    question = payload.message.strip()

    if not question:
        return ChatResponse(
            response="Please enter a biodiversity question."
        )

    sightings_context = _build_sightings_context(db)

    reply = _knowledge_answer(
        question,
        sightings_context,
    )

    if reply is None:
        try:
            reply = await _ai_answer(
                question,
                sightings_context,
                payload.history,
            )
        except Exception:
            reply = (
                "I'm unable to generate an advanced answer right now. "
                "Please try a common biodiversity question such as "
                "\"What is biodiversity?\" or \"What are the threats to biodiversity?\""
            )

    return ChatResponse(response=reply)