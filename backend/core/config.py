from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "Prepzy API"
    environment: str = "development"
    debug: bool = True
    api_prefix: str = "/api"
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    mongo_uri: str = "mongodb://localhost:27017/prepzy"
    mongo_database: str = "prepzy"
    redis_url: str = "redis://localhost:6379/0"
    chroma_url: str = "http://localhost:8000"

    groq_api_key: str = ""
    groq_text_model: str = "llama-3.3-70b-versatile"
    groq_fast_model: str = "llama-3.1-8b-instant"
    groq_vision_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    openai_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-small"
    anthropic_api_key: str = ""

    firebase_project_id: str = ""
    firebase_client_email: str = ""
    firebase_private_key: str = ""
    firebase_web_api_key: str = Field(default="", alias="NEXT_PUBLIC_FIREBASE_API_KEY")

    otp_secret: str = "local-development-only-change-me"
    otp_ttl_seconds: int = 300
    otp_resend_seconds: int = 60
    otp_max_attempts: int = 5
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_secure: bool = False
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_from: str = ""

    upload_max_bytes: int = 15 * 1024 * 1024
    request_timeout_seconds: int = 90

    @property
    def cors_origin_list(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",") if value.strip()]

    @property
    def firebase_private_key_value(self) -> str:
        return self.firebase_private_key.replace("\\n", "\n")

    def public_status(self) -> dict[str, Any]:
        return {
            "environment": self.environment,
            "mongo_configured": bool(self.mongo_uri),
            "redis_configured": bool(self.redis_url),
            "groq_configured": bool(self.groq_api_key),
            "firebase_configured": bool(
                self.firebase_project_id
                and self.firebase_client_email
                and self.firebase_private_key
            ),
            "smtp_configured": bool(self.smtp_host and self.smtp_user and self.smtp_pass),
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()


ROOT_DIR = Path(__file__).resolve().parents[2]
