from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "AI Diagram Generator"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # Database
    DATABASE_URL: str = "postgresql://postgres:123456@localhost:5432/diagram_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI API Keys
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()