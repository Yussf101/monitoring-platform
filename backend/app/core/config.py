"""
Application configuration management.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Central configuration loaded from environment variables.
    """
    DATABASE_URL: str
    APP_NAME: str = "Monitoring Platform API"
    DEBUG: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
