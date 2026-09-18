"""
Application configuration loaded from environment variables.

Uses pydantic-settings to automatically read values from the .env file
or from the container's environment. This is the single source of truth
for all configuration — no hardcoded secrets anywhere in the codebase.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Central configuration for the monitoring platform backend.

    Attributes:
        DATABASE_URL: Async PostgreSQL connection string
            (e.g. postgresql+asyncpg://user:pass@host:5432/dbname).
        APP_NAME: Display name shown in the Swagger UI docs.
        DEBUG: Enables extra logging when True.
    """

    DATABASE_URL: str
    APP_NAME: str = "Monitoring Platform API"
    DEBUG: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


# Singleton instance — import this wherever you need settings
settings = Settings()
