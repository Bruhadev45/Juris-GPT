"""
Regression tests for bugs found during AI-assisted development.

Each test is named after the bug it prevents. Per ai-regression-testing skill:
write tests for bugs that were found, not for code that works.

Coverage of fixes from 2026-05-07:
- BUG-R1: Auth routes used `from app.repositories import create_user`,
  which broke `patch.object(user_repository, "create_user")` in tests.
  Route was refactored to call `user_repository.create_user(...)`.
- BUG-R2: Chat /stream SSE contract — frontend depends on exact event names
  (`token`, `citations`, `metadata`, `done`, `error`). Renaming any of these
  silently breaks streaming.
- BUG-R3: Document-generation branch of /stream emits the same event sequence
  as the streaming branch. If the document branch is changed, the frontend
  must keep working without code changes.
"""

import json
from unittest.mock import patch, AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient


# ─────────────────────────────────────────────────────────────────────
# BUG-R1: Auth route must call repository through module reference
# ─────────────────────────────────────────────────────────────────────


class TestAuthRouteRepositoryIndirection:
    """
    Regression: when auth.py used `from app.repositories import create_user`,
    the route held its own reference to the function. Mocking
    `user_repository.create_user` (the standard pytest pattern) had no effect,
    so the route would call the real Supabase client and 500.

    These tests assert that mocks applied to the user_repository module
    actually flow through to the auth endpoints.
    """

    def test_register_uses_user_repository_module(self, client, mock_user_data):
        """BUG-R1: patching user_repository.create_user must affect /register"""
        from app.repositories import user_repository

        with patch.object(
            user_repository, "create_user", new_callable=AsyncMock
        ) as mock_create:
            mock_create.return_value = mock_user_data
            response = client.post(
                "/api/auth/register",
                json={
                    "email": "test@example.com",
                    "password": "password123",
                    "full_name": "Test User",
                },
            )
            assert response.status_code == 200, (
                f"Expected 200, got {response.status_code}: {response.text}. "
                "If this fails with 500, the route is bypassing the mock — "
                "auth.py likely re-introduced `from app.repositories import create_user`."
            )
            assert mock_create.called, "Mock was not invoked — route did not go through user_repository.create_user"

    def test_login_uses_user_repository_module(self, client, mock_user_data):
        """BUG-R1: patching user_repository.get_user_by_email must affect /login"""
        from app.repositories import user_repository

        with patch.object(
            user_repository, "get_user_by_email", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = None  # User not found → 401
            response = client.post(
                "/api/auth/login",
                json={"email": "nope@example.com", "password": "password123"},
            )
            assert response.status_code == 401
            assert mock_get.called

    def test_admin_list_users_uses_user_repository_module(
        self, client, admin_headers, mock_admin_data, multiple_users
    ):
        """BUG-R1: admin /users must go through user_repository.list_users"""
        from app.repositories import user_repository

        with patch.object(
            user_repository, "get_user_by_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = mock_admin_data
            with patch.object(
                user_repository, "list_users", new_callable=AsyncMock
            ) as mock_list:
                mock_list.return_value = multiple_users
                response = client.get("/api/auth/users", headers=admin_headers)
                assert response.status_code == 200
                assert mock_list.called


# ─────────────────────────────────────────────────────────────────────
# BUG-R2 & BUG-R3: SSE event contract for /api/chat/stream
# ─────────────────────────────────────────────────────────────────────


def _parse_sse_events(body: bytes) -> list[tuple[str, dict]]:
    """Parse an SSE response body into (event_name, json_payload) tuples."""
    events: list[tuple[str, dict]] = []
    current_event: str | None = None
    for line in body.decode().splitlines():
        if line.startswith("event: "):
            current_event = line[len("event: "):].strip()
        elif line.startswith("data: ") and current_event is not None:
            raw = line[len("data: "):]
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                payload = {"raw": raw}
            events.append((current_event, payload))
            current_event = None
    return events


class TestChatStreamSSEContract:
    """
    Regression: the frontend chat at frontend/src/app/dashboard/chat/page.tsx
    parses SSE events with these exact names:

        event: token       → {token: string}
        event: citations   → Citation[]
        event: metadata    → {confidence, limitations, grounded, follow_up_questions, ...}
        event: done        → {}
        event: error       → {error: string}

    Renaming or omitting any of these silently breaks the chat UI.
    These tests pin the contract.
    """

    def test_stream_emits_full_event_sequence_for_normal_query(self, client, bypass_csrf):
        """BUG-R2: /stream must emit token → citations → metadata → done"""
        from app.services import chatbot_service as cs_module

        # Force the non-streaming path: chatbot_service.rag is None → uses
        # full-response branch (still emits all 4 events as one batch)
        mock_response = MagicMock()
        mock_response.answer = "Section 149 of the Companies Act covers directors..."
        mock_response.citations = []
        mock_response.confidence = "high"
        mock_response.limitations = ""
        mock_response.grounded = True
        mock_response.follow_up_questions = ["What about independent directors?"]
        mock_response.model_used = "openai-gpt4o"
        mock_response.is_document = False
        mock_response.document_type = None

        with patch.object(
            cs_module.chatbot_service,
            "_is_document_generation_request",
            return_value=False,
        ), patch.object(
            cs_module.chatbot_service, "_lazy_init"
        ), patch.object(
            cs_module.chatbot_service, "rag", None
        ), patch.object(
            cs_module.chatbot_service,
            "get_legal_response",
            return_value=mock_response,
        ):
            response = client.post(
                "/api/chat/stream",
                json={"message": "What does Section 149 say?"},
            )

        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")

        events = _parse_sse_events(response.content)
        event_names = [name for name, _ in events]

        # Contract: must emit at least these four events, in this order
        assert "token" in event_names, f"Missing 'token' event. Got: {event_names}"
        assert "citations" in event_names, f"Missing 'citations' event. Got: {event_names}"
        assert "metadata" in event_names, f"Missing 'metadata' event. Got: {event_names}"
        assert "done" in event_names, f"Missing 'done' event. Got: {event_names}"
        assert event_names.index("done") == len(event_names) - 1, (
            "'done' must be the last event"
        )

    def test_stream_token_payload_has_token_field(self, client, bypass_csrf):
        """BUG-R2: token events must use {token: string}, not {text} or {chunk}"""
        from app.services import chatbot_service as cs_module

        mock_response = MagicMock()
        mock_response.answer = "test answer"
        mock_response.citations = []
        mock_response.confidence = "medium"
        mock_response.limitations = ""
        mock_response.grounded = True
        mock_response.follow_up_questions = []
        mock_response.model_used = "openai-gpt4o"
        mock_response.is_document = False
        mock_response.document_type = None

        with patch.object(
            cs_module.chatbot_service,
            "_is_document_generation_request",
            return_value=False,
        ), patch.object(
            cs_module.chatbot_service, "_lazy_init"
        ), patch.object(
            cs_module.chatbot_service, "rag", None
        ), patch.object(
            cs_module.chatbot_service,
            "get_legal_response",
            return_value=mock_response,
        ):
            response = client.post(
                "/api/chat/stream", json={"message": "hello"}
            )

        events = _parse_sse_events(response.content)
        token_events = [payload for name, payload in events if name == "token"]
        assert token_events, "No token events emitted"
        for payload in token_events:
            assert "token" in payload, (
                f"Token event payload must have 'token' key, got: {payload}"
            )

    def test_stream_metadata_payload_keys(self, client, bypass_csrf):
        """BUG-R2: metadata payload must contain frontend-expected keys"""
        from app.services import chatbot_service as cs_module

        mock_response = MagicMock()
        mock_response.answer = "answer"
        mock_response.citations = []
        mock_response.confidence = "high"
        mock_response.limitations = "Test limitation"
        mock_response.grounded = True
        mock_response.follow_up_questions = ["Q1"]
        mock_response.model_used = "openai-gpt4o"
        mock_response.is_document = False
        mock_response.document_type = None

        with patch.object(
            cs_module.chatbot_service,
            "_is_document_generation_request",
            return_value=False,
        ), patch.object(
            cs_module.chatbot_service, "_lazy_init"
        ), patch.object(
            cs_module.chatbot_service, "rag", None
        ), patch.object(
            cs_module.chatbot_service,
            "get_legal_response",
            return_value=mock_response,
        ):
            response = client.post(
                "/api/chat/stream", json={"message": "hello"}
            )

        events = _parse_sse_events(response.content)
        metadata_events = [payload for name, payload in events if name == "metadata"]
        assert len(metadata_events) == 1
        meta = metadata_events[0]

        # These keys are read by handleSubmit in chat/page.tsx — renaming any
        # of them silently breaks confidence badges, limitations panel, etc.
        for key in (
            "confidence",
            "limitations",
            "grounded",
            "follow_up_questions",
            "model_used",
            "is_document",
            "document_type",
        ):
            assert key in meta, f"metadata payload missing '{key}'. Got: {meta}"

    def test_stream_document_branch_emits_same_event_sequence(self, client, bypass_csrf):
        """BUG-R3: document-generation path must still emit token/citations/metadata/done"""
        from app.services import chatbot_service as cs_module

        mock_response = MagicMock()
        mock_response.answer = "---DOCUMENT_START---\nNDA content\n---DOCUMENT_END---"
        mock_response.citations = []
        mock_response.confidence = "high"
        mock_response.limitations = ""
        mock_response.grounded = True
        mock_response.follow_up_questions = []
        mock_response.model_used = "openai-gpt4o"
        mock_response.is_document = True
        mock_response.document_type = "nda"

        # Force document branch
        with patch.object(
            cs_module.chatbot_service,
            "_is_document_generation_request",
            return_value=True,
        ), patch.object(
            cs_module.chatbot_service,
            "get_legal_response",
            return_value=mock_response,
        ):
            response = client.post(
                "/api/chat/stream", json={"message": "Draft an NDA"}
            )

        assert response.status_code == 200
        events = _parse_sse_events(response.content)
        event_names = [name for name, _ in events]

        # Document path must have the same shape as the streaming path
        assert event_names == ["token", "citations", "metadata", "done"], (
            f"Document branch emitted wrong sequence: {event_names}. "
            "Frontend handleSubmit relies on this exact order."
        )

        # Document metadata must have is_document=True and document_type set
        meta = [p for n, p in events if n == "metadata"][0]
        assert meta.get("is_document") is True
        assert meta.get("document_type") == "nda"


# ─────────────────────────────────────────────────────────────────────
# BUG-R4: /api/chat/status response shape (frontend status panel)
# ─────────────────────────────────────────────────────────────────────


class TestChatStatusContract:
    """
    The frontend reads /api/chat/status to show RAG availability and
    feature flags. Removing any of these keys breaks the status UI.
    """

    def test_status_response_contains_required_keys(self, client):
        response = client.get("/api/chat/status")
        assert response.status_code == 200
        data = response.json()

        # Top-level keys read by the UI
        for key in ("product", "version", "initialized", "rag_available", "features"):
            assert key in data, f"/status missing '{key}'"

        # features dict drives capability badges
        features = data["features"]
        for flag in (
            "legal_qa",
            "citation_grounding",
            "document_generation",
            "streaming_sse",
            "hybrid_retrieval",
            "cross_encoder_reranking",
            "local_llm",
            "query_preprocessing",
        ):
            assert flag in features, f"features missing '{flag}'"
