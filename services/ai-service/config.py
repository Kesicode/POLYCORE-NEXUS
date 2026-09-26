"""PolyCore Nexus AI Service — Configuration"""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server
    port: int = 8001
    environment: str = "development"
    log_level: str = "info"
    cors_origins: str = "http://localhost:3000"

    # Database
    database_url: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Auth
    jwt_secret: str = ""

    # AI Providers (all optional)
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
