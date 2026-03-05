from pydantic_settings import BaseSettings
from dotenv import load_dotenv

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
    
    # AWS Configuration (optional - provide your AWS credentials if using S3)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    AWS_BUCKET_NAME: str = ""

    # Printer Configuration
    DEFAULT_PRINTER_IP: str = "192.168.1.150"
    DEFAULT_PRINTER_PORT: int = 9100

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


def get_settings() -> Settings:
    """Get application settings"""
    return settings
