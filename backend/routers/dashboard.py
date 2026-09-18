"""Dashboard router — aggregation statistics for the community overview."""
from datetime import date, timedelta
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.database import get_db
from models.sighting import Sighting
from models.species import Species
from models.user import User

router = APIRouter()


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ContributorStat(BaseModel):
    username: str
    count: int


class DayStat(BaseModel):
    date: str  # "YYYY-MM-DD"
    count: int


class DashboardStats(BaseModel):
    total_sightings: int
    unique_species: int
    top_contributors: List[ContributorStat]
    sightings_per_day: List[DayStat]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Return aggregated community statistics.

    Public endpoint — no authentication required.
    """
    # 1. Total sightings
    total_sightings: int = db.query(func.count(Sighting.id)).scalar() or 0

    # 2. Unique species referenced by at least one sighting
    unique_species: int = (
        db.query(func.count(func.distinct(Sighting.species_id))).scalar() or 0
    )

    # 3. Top 5 contributors by sighting count
    top_rows = (
        db.query(User.username, func.count(Sighting.id).label("cnt"))
        .join(Sighting, Sighting.user_id == User.id)
        .group_by(User.id)
        .order_by(func.count(Sighting.id).desc())
        .limit(5)
        .all()
    )
    top_contributors = [
        ContributorStat(username=row.username, count=row.cnt) for row in top_rows
    ]

    # 4. Sightings per day for the last 30 days (fill zeros for missing days)
    today = date.today()
    thirty_days_ago = today - timedelta(days=29)

    # SQLite stores timestamps; cast to date string for grouping
    day_rows = (
        db.query(
            func.date(Sighting.sighted_at).label("day"),
            func.count(Sighting.id).label("cnt"),
        )
        .filter(func.date(Sighting.sighted_at) >= str(thirty_days_ago))
        .group_by(func.date(Sighting.sighted_at))
        .all()
    )

    # Build a dict so we can fill in zeros
    counts_by_day = {row.day: row.cnt for row in day_rows}

    sightings_per_day: List[DayStat] = []
    for offset in range(30):
        d = thirty_days_ago + timedelta(days=offset)
        day_str = d.isoformat()
        sightings_per_day.append(
            DayStat(date=day_str, count=counts_by_day.get(day_str, 0))
        )

    return DashboardStats(
        total_sightings=total_sightings,
        unique_species=unique_species,
        top_contributors=top_contributors,
        sightings_per_day=sightings_per_day,
    )
