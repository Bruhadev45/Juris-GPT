import logging
import os
import secrets

from pydantic import Field
from pydantic_settings import BaseSettings
from typing import Optional

logger = logging.getLogger(__name__)


def _resolve_jwt_secret() -> str:
    """Get JWT secret from env, or generate a stable per-process default in dev only.

    Production deployments MUST set JWT_SECRET. Without that, every restart
    invalidates every issued token and multi-worker deployments hand out
    different secrets per worker. We deliberately fail loud rather than
    silently defaulting in production.
    """
    env_value = os.getenv("JWT_SECRET")
    if env_value:
        return env_value

    environment = os.getenv("ENVIRONMENT", "development").lower()
    if environment == "production":
        raise RuntimeError(
            "JWT_SECRET environment variable is required in production. "
            "Generate one with `python -c 'import secrets; print(secrets.token_hex(32))'`."
        )

    # Development convenience: generate-and-stick for the lifetime of the process.
    # Tokens still survive uvicorn auto-reload because the value is captured by
    # the module-level `Settings` singleton and reused across imports.
    generated = secrets.token_hex(32)
    logger.warning(
        "JWT_SECRET not set; generated a random secret for this process. "
        "All issued tokens will be invalidated on restart. Set JWT_SECRET in .env to fix."
    )
    return generated


class Settings(BaseSettings):
    supabase_url: Optional[str] = "https://placeholder.supabase.co"
    supabase_service_key: Optional[str] = "placeholder-service-key"
    openai_api_key: Optional[str] = "sk-placeholder"

    # Anthropic Claude (via PageGrid or direct)
    anthropic_api_key: Optional[str] = None
    anthropic_base_url: Optional[str] = None  # e.g., https://api.pagegrid.in for PageGrid
    resend_api_key: Optional[str] = "re_placeholder"
    database_url: Optional[str] = None
    environment: str = "development"

    # JWT Secret — required in production, dev fallback is a per-process random.
    jwt_secret: str = _resolve_jwt_secret()

    # DigitalOcean Spaces settings
    do_spaces_key: Optional[str] = None
    do_spaces_secret: Optional[str] = None
    do_spaces_bucket: Optional[str] = None
    do_spaces_region: Optional[str] = None
    do_spaces_endpoint: Optional[str] = None

    # CORS settings.
    # Stored as a comma-separated string so pydantic-settings doesn't try to
    # parse CORS_ORIGINS as JSON. Use the `cors_origins` property to consume
    # as a list. In production set
    #   CORS_ORIGINS=https://your-vercel.app,https://www.yourdomain.com
    cors_origins_csv: str = Field(
        default="http://localhost:3000,http://localhost:3001,http://localhost:3002",
        validation_alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_csv.split(",") if o.strip()]

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

    # ── RAG Data Source Configuration ────────────────────────────────
    jurisgpt_vector_store: str = "local"
    jurisgpt_llm_type: str = "anthropic"  # anthropic (PageGrid), openai, or local_legal_llama
    data_source: str = "local"
    cloud_data_path: Optional[str] = None
    chroma_collection_name: str = "jurisgpt_legal_docs"

    # ── External Legal APIs ─────────────────────────────────────────
    indian_kanoon_api_key: Optional[str] = None  # Get from https://api.indiankanoon.org

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    def validate_production_secrets(self) -> list[str]:
        """Validate that required secrets are set for production. Returns list of missing keys.

        Auth + storage are hard-required. LLM provider is "at least one of"
        (OpenAI or Anthropic) since the app routes to whichever is configured.
        """
        missing = []
        if self.environment == "production":
            if not self.supabase_url or "placeholder" in self.supabase_url:
                missing.append("SUPABASE_URL")
            if not self.supabase_service_key or "placeholder" in self.supabase_service_key:
                missing.append("SUPABASE_SERVICE_KEY")

            openai_ok = bool(self.openai_api_key) and "placeholder" not in (self.openai_api_key or "")
            anthropic_ok = bool(self.anthropic_api_key) and "placeholder" not in (self.anthropic_api_key or "")
            if not (openai_ok or anthropic_ok):
                missing.append("OPENAI_API_KEY or ANTHROPIC_API_KEY (at least one)")

            if not self.jwt_secret or len(self.jwt_secret) < 32:
                missing.append("JWT_SECRET (must be at least 32 characters)")
        return missing


settings = Settings()
