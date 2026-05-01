from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import Optional

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 3600
    FRONTEND_URL: str = "http://localhost:8080"

    # Admin
    ADMIN_SECRET_KEY: str

    # Cloudflare R2 Configuration
    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_ENDPOINT: str = ""
    R2_PUBLIC_URL: str = ""

    # Printer Configuration
    DEFAULT_PRINTER_IP: str = "192.168.1.150"
    DEFAULT_PRINTER_PORT: int = 9100

    # SMTP Configuration
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: str = "info@vayupos.com"
    EMAILS_FROM_NAME: str = "VayuPos Support"

    # Internal (used by FastAPI app init — not set via .env)
    app_name: str = "VayuPos API"
    app_version: str = "1.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


def get_settings() -> Settings:
    return settings
