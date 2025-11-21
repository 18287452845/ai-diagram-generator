from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path
import os


def _load_env_file(env_path: Path) -> None:
    """Load environment variables from the given .env file.

    Uses python-dotenv if available, otherwise falls back to a simple parser.
    """
    if not env_path.exists():
        return

    try:
        from dotenv import load_dotenv  # type: ignore

        load_dotenv(env_path, override=False)
    except Exception:
        # Simple fallback parser for basic KEY=VALUE pairs
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"
_load_env_file(ENV_FILE_PATH)


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
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    class Config:
        # Find .env file in the backend directory (parent of app/core)
        env_file = str(ENV_FILE_PATH)
        case_sensitive = True


settings = Settings()