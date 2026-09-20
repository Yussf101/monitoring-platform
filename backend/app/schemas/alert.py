"""
Pydantic schemas for alert data validation and serialization.

Covers two domains:
- Inbound: Alertmanager webhook payload parsing.
- Outbound: API response serialization for alert history.
"""

from datetime import datetime

from pydantic import BaseModel


class AlertmanagerAlert(BaseModel):
    """A single alert from the Alertmanager webhook ``alerts[]`` array."""

    status: str
    labels: dict[str, str]
    annotations: dict[str, str]
    startsAt: str
    endsAt: str
    fingerprint: str


class AlertmanagerWebhookPayload(BaseModel):
    """
    Full POST body sent by Alertmanager's generic webhook receiver.

    Reference: https://prometheus.io/docs/alerting/latest/configuration/#webhook_config
    """

    version: str
    status: str
    receiver: str
    alerts: list[AlertmanagerAlert]
    groupLabels: dict[str, str]
    commonLabels: dict[str, str]
    commonAnnotations: dict[str, str]
    externalURL: str


class AlertRead(BaseModel):
    """Response schema matching the Alert ORM model."""

    id: int
    target_id: int
    alert_name: str
    severity: str
    status: str
    message: str | None
    fired_at: datetime
    resolved_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
