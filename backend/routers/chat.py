"""Chat router — EcoMora biodiversity Q&A with local knowledge + FLAN-T5."""

import os
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from core.database import get_db
from core.security import get_current_user
from models.sighting import Sighting
from models.user import User


router = APIRouter()

# Heavy FLAN-T5 model is loaded only when local AI is enabled.
_chat_tokenizer = None
_chat_model = None


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryMessage] = []


class ChatResponse(BaseModel):
    response: str


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


def _ai_answer(question: str, sightings_context: str) -> str:
    """Generate an answer using the local FLAN-T5 model when enabled."""

    global _chat_tokenizer, _chat_model

    # Render/free deployment mode: do not load heavy AI models.
    if os.getenv("ECOMORA_LOCAL_AI", "true").lower() not in {
        "1",
        "true",
        "yes",
        "on",
    }:
        return (
            "EcoMora is running in lightweight mode. I can answer common "
            "biodiversity questions, but advanced AI responses are "
            "temporarily unavailable."
        )

    # Lazy-load the heavy model only when an advanced answer is actually needed.
    if _chat_tokenizer is None or _chat_model is None:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

        _chat_tokenizer = AutoTokenizer.from_pretrained(
            "google/flan-t5-small"
        )
        _chat_model = AutoModelForSeq2SeqLM.from_pretrained(
            "google/flan-t5-small"
        )

    prompt = f"""
You are EcoMora, a biodiversity assistant.

Answer this question directly using simple language.
Give a short factual answer in 2 to 5 sentences.
Do not repeat the question.
Do not mention the prompt.
Do not invent facts.

Question:
{question}

Relevant community sightings:
{sightings_context}

Answer:
"""

    inputs = _chat_tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    )

    outputs = _chat_model.generate(
        **inputs,
        max_new_tokens=100,
        do_sample=False,
    )

    answer = _chat_tokenizer.decode(
        outputs[0],
        skip_special_tokens=True,
    ).strip()

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
def chat(
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
        reply = _ai_answer(
            question,
            sightings_context,
        )

    return ChatResponse(response=reply)