from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import Optional

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    DATABASE_URL: str = "postgresql://postgres:VayuPosDb2026@database-1.cr8c6ywmy5p3.ap-south-1.rds.amazonaws.com:5432/postgres"
    SECRET_KEY: str = "UB4lQIjjJg6KvPno8UWOC9omiLQ1d6q8E2CA6V_LLuY"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 3600  # 1 hour in seconds
    
    # Additional settings
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Restaurant VayuPos"
    app_name: str = "POS Backend API"
    app_version: str = "1.0.0"
    cors_origins: list = ["*"]
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Cloudflare R2 Configuration
    R2_ACCOUNT_ID: str = ""
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

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


def get_settings() -> Settings:
    """Get application settings"""
    return settings
