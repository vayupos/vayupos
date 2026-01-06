from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    DATABASE_URL: str = "postgresql://vayupos_user:IfoCaeUPm9fhhgnJFj23f4Ks3LfqXDcq@dpg-d5e0uhvgi27c73e7dslg-a/vayupos"
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 3600  # 1 hour in seconds
    
    # Additional settings
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Restaurant VayuPos"
    app_name: str = "POS Backend API"
    app_version: str = "1.0.0"
    cors_origins: list = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


def get_settings() -> Settings:
    """Get application settings"""
    return settings