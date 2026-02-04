from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    supabase_url: Optional[str] = "https://placeholder.supabase.co"
    supabase_service_key: Optional[str] = "placeholder-service-key"
    openai_api_key: Optional[str] = "sk-placeholder"
    razorpay_key_id: Optional[str] = None  # Optional for now
    razorpay_key_secret: Optional[str] = None  # Optional for now
    resend_api_key: Optional[str] = "re_placeholder"
    database_url: Optional[str] = None
    environment: str = "development"
    
    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
