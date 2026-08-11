"""Public, unauthenticated demo endpoint.

Exists so a conference audience can try JurisGPT without creating an account.

Deliberately a separate router rather than relaxing auth on `/api/chat`: the
authenticated chat surface keeps `Depends(require_auth)` untouched, and the
public surface is one narrow, rate-limited, read-only endpoint that is obvious
to audit. Widening the real endpoint would have been a smaller diff and a much
worse idea.

What this endpoint deliberately does NOT do:
  - persist conversations or accept a conversation id
  - accept conversation history (so it cannot be used to smuggle a long
    context and run up model spend)
  - expose document generation or any state-changing operation
"""

from __future__ import annotations

import logging
import time
from collections import deque
from typing import Deque, Dict, Final

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.routes.chatbot import (
    ChatMessageResponse,
    ChatRequest,
    _response_to_api,
    chatbot_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Demo"])

MAX_MESSAGE_LENGTH: Final[int] = 500
RATE_LIMIT_WINDOW_SECONDS: Final[float] = 60.0
RATE_LIMIT_MAX_REQUESTS: Final[int] = 5
MAX_TRACKED_CLIENTS: Final[int] = 10_000

# client key -> timestamps of recent requests, oldest first.
_request_log: Dict[str, Deque[float]] = {}


class DemoMessageRequest(BaseModel):
    """A single demo question. No history, no conversation id, by design."""

    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)


def _client_key(request: Request) -> str:
    """Best-effort caller identity for throttling.

    Behind a proxy the socket peer is the proxy, so prefer the forwarded
    chain's first entry. This is spoofable and is not a security control —
    it exists to blunt casual abuse of an unauthenticated endpoint.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _is_rate_limited(key: str, now: float) -> bool:
    """Sliding window. Returns True when the caller has exhausted its quota."""
    window_start = now - RATE_LIMIT_WINDOW_SECONDS

    timestamps = _request_log.get(key)
    if timestamps is None:
        # Bound the map so a spray of distinct source addresses cannot grow it
        # without limit. Dicts preserve insertion order, so this evicts oldest.
        if len(_request_log) >= MAX_TRACKED_CLIENTS:
            for stale_key in list(_request_log)[: MAX_TRACKED_CLIENTS // 10]:
                _request_log.pop(stale_key, None)
        timestamps = deque()
        _request_log[key] = timestamps

    while timestamps and timestamps[0] < window_start:
        timestamps.popleft()

    if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
        return True

    timestamps.append(now)
    return False


@router.post("/message", response_model=ChatMessageResponse)
async def demo_message(request: Request, body: DemoMessageRequest) -> ChatMessageResponse:
    """Answer one legal question, with citations, without authentication."""
    if _is_rate_limited(_client_key(request), time.monotonic()):
        raise HTTPException(
            status_code=429,
            detail="Too many questions in a short time. Please wait a minute and try again.",
        )

    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Please enter a question.")

    try:
        # Built directly rather than via chatbot._build_chat_request: that helper
        # reads `context` and `conversation_history`, which this model
        # intentionally does not carry.
        chat_request = ChatRequest(message=message, context=None, conversation_history=None)
        response = chatbot_service.get_legal_response(chat_request)
        return _response_to_api(response)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception:
        # Log the detail server-side; return nothing specific. This endpoint is
        # public, so upstream error text must not reach the caller.
        logger.exception("Demo chat request failed")
        raise HTTPException(
            status_code=502,
            detail="The legal assistant is unavailable right now. Please try again shortly.",
        )
