import secrets

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

    # JWT Secret — dedicated key, not derived from other secrets
    jwt_secret: str = secrets.token_hex(32)

    # DigitalOcean Spaces settings
    do_spaces_key: Optional[str] = None
    do_spaces_secret: Optional[str] = None
    do_spaces_bucket: Optional[str] = None
    do_spaces_region: Optional[str] = None
    do_spaces_endpoint: Optional[str] = None

    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]

    # ── Local LLM Configuration ──────────────────────────────────────
    local_llm_model_path: str = "./models/llama-3.2-1b-instruct.Q4_K_M.gguf"
    local_llm_context_size: int = 8192
    local_llm_gpu_layers: int = 0  # Set to -1 for all layers on GPU (Metal on macOS)
    local_llm_threads: int = 4

    # ── Embedding Configuration ──────────────────────────────────────
    embedding_model: str = "law-ai/InLegalBERT"
    embedding_fallback: str = "sentence-transformers/all-MiniLM-L6-v2"

    # ── RAG Configuration ────────────────────────────────────────────
    rag_top_k: int = 5
    rag_rerank_top_n: int = 20
    rag_use_reranker: bool = True
    rag_hybrid_search: bool = True
    rag_bm25_weight: float = 0.4
    rag_semantic_weight: float = 0.6

    class Config:
        env_file = ".env"
        case_sensitive = False

    def validate_production_secrets(self) -> list[str]:
        """Validate that required secrets are set for production. Returns list of missing keys."""
        missing = []
        if self.environment == "production":
            if not self.supabase_url or "placeholder" in self.supabase_url:
                missing.append("SUPABASE_URL")
            if not self.supabase_service_key or "placeholder" in self.supabase_service_key:
                missing.append("SUPABASE_SERVICE_KEY")
            if not self.openai_api_key or "placeholder" in self.openai_api_key:
                missing.append("OPENAI_API_KEY")
            if not self.jwt_secret or len(self.jwt_secret) < 32:
                missing.append("JWT_SECRET (must be at least 32 characters)")
        return missing


settings = Settings()
