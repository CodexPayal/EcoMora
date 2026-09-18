"""Pydantic schemas for the User model."""
from datetime import datetime

from pydantic import BaseModel, EmailStr


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    """Payload for POST /auth/register."""
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    """Payload for POST /auth/login."""
    email: EmailStr
    password: str


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class UserPublic(BaseModel):
    """Public-facing user info returned by the API (no password fields)."""
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}
