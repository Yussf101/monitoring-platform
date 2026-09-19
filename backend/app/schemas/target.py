"""
Pydantic schemas for Target data validation and serialization.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class TargetCreate(BaseModel):
    """Schema for POST /api/targets request bodies."""

    name: str = Field(..., min_length=1, max_length=255, examples=["web-server-01"])
    ip_address: str = Field(
        ..., min_length=7, max_length=45, examples=["192.168.1.50"]
    )
    port: int = Field(default=9100, ge=1, le=65535, examples=[9100])
    os_type: str = Field(default="linux", max_length=20, examples=["linux"])
    environment: str = Field(
        default="production", max_length=50, examples=["production"]
    )
    ssh_user: str = Field(default="youssef", max_length=50, examples=["youssef"])
    is_active: bool = Field(default=True)


class TargetUpdate(BaseModel):
    """Schema for PATCH /api/targets/{id} request bodies (partial updates)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    ip_address: str | None = Field(default=None, min_length=7, max_length=45)
    port: int | None = Field(default=None, ge=1, le=65535)
    os_type: str | None = Field(default=None, max_length=20)
    environment: str | None = Field(default=None, max_length=50)
    ssh_user: str | None = Field(default=None, max_length=50)
    is_active: bool | None = None


class TargetRead(BaseModel):
    """Schema for returning target data in API responses."""

    id: int
    name: str
    ip_address: str
    port: int
    os_type: str
    environment: str
    ssh_user: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
