"""
Local Legal LLM Service
Wraps llama-cpp-python for local GGUF model inference.

Uses invincibleambuj/Ambuj-Tripathi-Indian-Legal-Llama-GGUF
(Llama 3.2 fine-tuned on Indian law).
"""

import logging
import os
from pathlib import Path
from typing import Iterator, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class LocalLegalLLM:
    """
    Local GGUF-based legal LLM using llama-cpp-python.

    Provides synchronous and streaming generation methods.
    Designed to run on CPU or Apple Metal (macOS GPU acceleration).
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        n_ctx: int = 0,
        n_gpu_layers: int = 0,
        n_threads: int = 0,
    ):
        self._llm = None
        self._model_path = model_path or settings.local_llm_model_path
        self._n_ctx = n_ctx or settings.local_llm_context_size
        self._n_gpu_layers = n_gpu_layers or settings.local_llm_gpu_layers
        self._n_threads = n_threads or settings.local_llm_threads
        self._loaded = False

    # ------------------------------------------------------------------
    # Lazy loading – model is heavy, only load when first needed
    # ------------------------------------------------------------------
    def _ensure_loaded(self) -> None:
        if self._loaded:
            return

        resolved = Path(self._model_path).expanduser().resolve()
        if not resolved.exists():
            raise FileNotFoundError(
                f"GGUF model not found at {resolved}. "
                "Download with: huggingface-cli download "
                "invincibleambuj/Ambuj-Tripathi-Indian-Legal-Llama-GGUF "
                "--local-dir ./models/"
            )

        try:
            from llama_cpp import Llama  # type: ignore[import-untyped]
        except ImportError as exc:
            raise ImportError(
                "llama-cpp-python is required for local LLM inference. "
                "Install with: pip install llama-cpp-python"
            ) from exc

        logger.info("Loading local LLM from %s …", resolved)
        self._llm = Llama(
            model_path=str(resolved),
            n_ctx=self._n_ctx,
            n_gpu_layers=self._n_gpu_layers,
            n_threads=self._n_threads,
            verbose=False,
        )
        self._loaded = True
        logger.info("Local LLM loaded successfully.")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def generate(
        self,
        prompt: str,
        *,
        max_tokens: int = 2048,
        temperature: float = 0.3,
        top_p: float = 0.9,
        stop: Optional[list[str]] = None,
    ) -> str:
        """Generate a complete response for *prompt*."""
        self._ensure_loaded()
        assert self._llm is not None

        result = self._llm(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            stop=stop or [],
            echo=False,
        )
        choices = result.get("choices", [])
        if not choices:
            return ""
        return choices[0].get("text", "").strip()

    def stream_generate(
        self,
        prompt: str,
        *,
        max_tokens: int = 2048,
        temperature: float = 0.3,
        top_p: float = 0.9,
        stop: Optional[list[str]] = None,
    ) -> Iterator[str]:
        """Yield tokens one at a time for SSE streaming."""
        self._ensure_loaded()
        assert self._llm is not None

        stream = self._llm(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            stop=stop or [],
            echo=False,
            stream=True,
        )
        for chunk in stream:
            choices = chunk.get("choices", [])
            if choices:
                token = choices[0].get("text", "")
                if token:
                    yield token

    @property
    def is_available(self) -> bool:
        """Check if the model file exists (does not load it)."""
        resolved = Path(self._model_path).expanduser().resolve()
        return resolved.exists()

    def unload(self) -> None:
        """Release model memory."""
        self._llm = None
        self._loaded = False
