from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    
    # Supabase Auth / JWT
    SUPABASE_URL: Optional[str] = None
    SUPABASE_JWKS_URL: Optional[str] = None
    SUPABASE_ISSUER: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None
    
    # Database
    DATABASE_URL: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

