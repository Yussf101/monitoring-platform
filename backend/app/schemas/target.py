"""
Pydantic schemas for Target data validation and serialization.

These schemas act as Data Transfer Objects (DTOs) — they define the
exact shape of JSON that the API accepts and returns.

Architecture parallel (Java/Spring):
    TargetCreate ≈ a CreateTargetRequest DTO
    TargetUpdate ≈ an UpdateTargetRequest DTO (all fields optional)
    TargetRead   ≈ a TargetResponse DTO (includes id, timestamps)

Why separate from ORM models?
    - ORM models define how data is STORED in PostgreSQL.
    - Schemas define how data is SENT/RECEIVED over HTTP.
    - This separation prevents leaking internal DB details to the API consumer
      and lets us validate input before it ever touches the database.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class TargetCreate(BaseModel):
    """
    Schema for creating a new target via POST /api/targets.

    Validates that required fields are present and in the correct format.
    Default values are provided for optional fields.
    """

    name: str = Field(..., min_length=1, max_length=255, examples=["web-server-01"])
    ip_address: str = Field(
        ..., min_length=7, max_length=45, examples=["192.168.1.50"]
    )
    port: int = Field(default=9100, ge=1, le=65535, examples=[9100])
    os_type: str = Field(default="linux", max_length=20, examples=["linux"])
    environment: str = Field(
        default="production", max_length=50, examples=["production"]
    )
    is_active: bool = Field(default=True)


class TargetUpdate(BaseModel):
    """
    Schema for partially updating a target via PATCH /api/targets/{id}.

    All fields are optional — only provided fields will be updated.
    This is the "partial update" pattern (PATCH, not PUT).
    """

    name: str | None = Field(default=None, min_length=1, max_length=255)
    ip_address: str | None = Field(default=None, min_length=7, max_length=45)
    port: int | None = Field(default=None, ge=1, le=65535)
    os_type: str | None = Field(default=None, max_length=20)
    environment: str | None = Field(default=None, max_length=50)
    is_active: bool | None = None


class TargetRead(BaseModel):
    """
    Schema for returning target data in API responses.

    Includes all fields plus the auto-generated id and timestamps.
    model_config with from_attributes=True tells Pydantic to read
    data directly from SQLAlchemy ORM objects (similar to Hibernate's
    ability to serialize entities to JSON).
    """

    id: int
    name: str
    ip_address: str
    port: int
    os_type: str
    environment: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
