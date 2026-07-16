from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MedSync AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super_secret_key_for_jwt_auth_123" # In production, use env var
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    # Using SQLite for development since Docker wasn't available
    DATABASE_URL: str = "sqlite:///./medsync.db"

    class Config:
        case_sensitive = True

settings = Settings()
