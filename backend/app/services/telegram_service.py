"""
Telegram notification service.
"""

import logging
from datetime import datetime
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_telegram_alert(
    alert_name: str, status: str, instance: str, severity: str, message: str
) -> bool:
    """
    Send an alert notification to Telegram.

    Gracefully handles missing configuration by logging a warning and returning False.
    """
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        logger.warning(
            "Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured."
        )
        return False

    emoji = "🔴" if status == "firing" else "🟢"
    status_text = "FIRING" if status == "firing" else "RESOLVED"
    
    text = (
        f"{emoji} <b>{status_text}: {alert_name}</b>\n\n"
        f"<b>Instance:</b> {instance}\n"
        f"<b>Severity:</b> {severity}\n"
        f"<b>Details:</b> {message}\n"
        f"<b>Time:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}"
    )

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=5.0)
            
        if response.status_code == 200:
            logger.info("Telegram notification sent successfully for alert: %s", alert_name)
            return True
        else:
            logger.error(
                "Failed to send Telegram notification: %s - %s",
                response.status_code,
                response.text,
            )
            return False
    except Exception:
        logger.exception("Error sending Telegram notification")
        return False
