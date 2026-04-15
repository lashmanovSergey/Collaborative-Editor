from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "collaborative editor backend"
    secret_key: str = "super-secret-key-change-me"
    access_token_expire_minutes: int = 60 * 24
    sync_database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"
    redis_url: str = "redis://localhost:6379/0"
    allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
    auto_save_seconds: int = 30
    max_history_items: int = 10
    max_document_length: int = 50000
    cookie_name: str = "access_token"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
