from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings


ROOT_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    openai_api_key: str
    database_url: str
    redis_url: str
    secret_key: str
    debug: bool = True

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str) and value.lower() in {"release", "production", "prod"}:
            return False
        return value

    class Config:
        env_file = ROOT_DIR / ".env"

settings = Settings()
