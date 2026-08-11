"""
CSRF Protection Middleware Tests

Real, behaviour-driven coverage of app.middleware.csrf. The previous version
of this file was eight `assert True` placeholders — they reported green while
a real bug shipped: CSRFMiddleware raised HTTPException from inside
BaseHTTPMiddleware.dispatch(), which FastAPI cannot catch there, so every
rejected request escaped as a bare 500 instead of a 403. No placeholder test
could have caught that because none of them exercised the middleware.

Two layers of coverage:

1. Unit tests that call CSRFMiddleware.dispatch() directly with a synthetic
   Request/call_next, and pure function tests for generate_csrf_token /
   validate_csrf_token. Fast, isolated from routing, auth, rate limiting,
   and audit logging.
2. A small number of integration tests through the real app (the `client`
   fixture from conftest.py) for behaviour that only exists when the full
   middleware stack is assembled — specifically, that a CSRF rejection
   still carries CORS headers because CORSMiddleware wraps it.
"""

import secrets

import pytest
from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse, Response

from app.middleware.csrf import (
    CSRF_COOKIE_NAME,
    CSRF_EXEMPT_PATHS,
    CSRF_HEADER_NAME,
    CSRFMiddleware,
    generate_csrf_token,
    validate_csrf_token,
)


# ============================================================
# Helpers for unit-level dispatch() testing
# ============================================================


def _make_request(method: str = "GET", path: str = "/resource", headers: dict | None = None) -> Request:
    """Build a minimal Starlette Request without going through ASGI transport."""
    header_list = [
        (k.lower().encode("latin-1"), v.encode("latin-1")) for k, v in (headers or {}).items()
    ]
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": header_list,
        "client": ("testclient", 12345),
        "server": ("testserver", 80),
        "scheme": "http",
    }
    return Request(scope)


def _cookie_header(value: str) -> str:
    return f"{CSRF_COOKIE_NAME}={value}"


async def _call_next_ok(request: Request) -> Response:
    return PlainTextResponse("ok", status_code=200)


def _middleware() -> CSRFMiddleware:
    # BaseHTTPMiddleware.__init__ requires an `app`, but dispatch() (which we
    # call directly) never touches self.app — the real ASGI app is only used
    # by __call__, which we bypass entirely.
    return CSRFMiddleware(app=lambda *args, **kwargs: None)


# ============================================================
# Pure function unit tests: generate_csrf_token / validate_csrf_token
# ============================================================


class TestGenerateCsrfToken:
    def test_returns_a_hex_string(self):
        token = generate_csrf_token()
        assert isinstance(token, str)
        assert len(token) > 0
        assert all(c in "0123456789abcdef" for c in token)

    def test_is_long_enough_to_resist_guessing(self):
        # secrets.token_hex(32) -> 64 hex chars -> 256 bits of entropy.
        token = generate_csrf_token()
        assert len(token) == 64

    def test_successive_calls_produce_different_tokens(self):
        tokens = {generate_csrf_token() for _ in range(50)}
        assert len(tokens) == 50


class TestValidateCsrfToken:
    def test_matching_tokens_are_valid(self):
        token = generate_csrf_token()
        assert validate_csrf_token(token, token) is True

    def test_mismatched_tokens_are_invalid(self):
        assert validate_csrf_token(generate_csrf_token(), generate_csrf_token()) is False

    def test_missing_cookie_token_is_invalid(self):
        assert validate_csrf_token(None, "some-header-token") is False

    def test_missing_header_token_is_invalid(self):
        assert validate_csrf_token("some-cookie-token", None) is False

    def test_both_missing_is_invalid(self):
        assert validate_csrf_token(None, None) is False

    def test_empty_string_cookie_is_invalid(self):
        """Empty string is falsy — must not be treated as 'no comparison needed'."""
        assert validate_csrf_token("", "matching-value") is False

    def test_empty_string_header_is_invalid(self):
        assert validate_csrf_token("matching-value", "") is False

    def test_both_empty_strings_is_invalid(self):
        assert validate_csrf_token("", "") is False

    def test_case_sensitive_comparison(self):
        assert validate_csrf_token("AbC123", "abc123") is False

    def test_uses_constant_time_comparison(self, monkeypatch):
        """
        Guards against a future regression to `cookie_token == header_token`,
        which reintroduces a timing side-channel.
        """
        calls = []
        real_compare_digest = secrets.compare_digest

        def spy(a, b):
            calls.append((a, b))
            return real_compare_digest(a, b)

        monkeypatch.setattr("app.middleware.csrf.secrets.compare_digest", spy)

        validate_csrf_token("token-a", "token-b")

        assert calls == [("token-a", "token-b")]


# ============================================================
# Unit tests: CSRFMiddleware.dispatch()
# ============================================================


class TestSafeMethodsBypassCsrf:
    """Behaviour 1: GET/HEAD/OPTIONS never require a CSRF token."""

    @pytest.mark.parametrize("method", ["GET", "HEAD", "OPTIONS"])
    @pytest.mark.asyncio
    async def test_safe_method_without_token_is_not_rejected(self, method):
        middleware = _middleware()
        request = _make_request(method=method, path="/resource")

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 200


class TestUnsafeMethodsRequireMatchingToken:
    """
    Behaviour 2: this is the exact regression that shipped. CSRFMiddleware
    used to `raise HTTPException(403, ...)`, which BaseHTTPMiddleware cannot
    catch, so it escaped as a bare 500. Every assertion here pins the status
    code explicitly rather than just checking "not 200", specifically to
    catch that failure mode again.
    """

    @pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
    @pytest.mark.asyncio
    async def test_unsafe_method_with_no_token_at_all_is_403(self, method):
        middleware = _middleware()
        request = _make_request(method=method, path="/resource")

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 403
        assert response.status_code != 500

    @pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
    @pytest.mark.asyncio
    async def test_unsafe_method_with_only_cookie_is_403(self, method):
        middleware = _middleware()
        request = _make_request(
            method=method,
            path="/resource",
            headers={"cookie": _cookie_header("a" * 64)},
        )

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 403

    @pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
    @pytest.mark.asyncio
    async def test_unsafe_method_with_only_header_is_403(self, method):
        middleware = _middleware()
        request = _make_request(
            method=method,
            path="/resource",
            headers={CSRF_HEADER_NAME: "a" * 64},
        )

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 403

    def test_rejection_is_returned_not_raised(self):
        """
        Behaviour 8 (unit half): the middleware must produce a JSONResponse
        object rather than raising, which is what let CORSMiddleware wrap
        the 403 in production. We assert the concrete return type here;
        the full-stack CORS-header proof lives in the integration tests below.
        """
        import asyncio

        middleware = _middleware()
        request = _make_request(method="POST", path="/resource")

        response = asyncio.run(middleware.dispatch(request, _call_next_ok))

        assert isinstance(response, JSONResponse)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_rejection_body_is_json_with_detail(self):
        middleware = _middleware()
        request = _make_request(method="POST", path="/resource")

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 403
        assert response.headers["content-type"].startswith("application/json")
        assert b"CSRF token validation failed" in response.body


class TestDoubleSubmitCookiePattern:
    """Behaviour 3 & 4: cookie and header must match (double-submit pattern)."""

    @pytest.mark.asyncio
    async def test_mismatched_cookie_and_header_is_403(self):
        middleware = _middleware()
        request = _make_request(
            method="POST",
            path="/resource",
            headers={
                "cookie": _cookie_header("a" * 64),
                CSRF_HEADER_NAME: "b" * 64,
            },
        )

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_matching_cookie_and_header_succeeds(self):
        middleware = _middleware()
        token = generate_csrf_token()
        request = _make_request(
            method="POST",
            path="/resource",
            headers={
                "cookie": _cookie_header(token),
                CSRF_HEADER_NAME: token,
            },
        )

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 200
        assert response.body == b"ok"

    @pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
    @pytest.mark.asyncio
    async def test_matching_token_succeeds_for_every_unsafe_method(self, method):
        middleware = _middleware()
        token = generate_csrf_token()
        request = _make_request(
            method=method,
            path="/resource",
            headers={
                "cookie": _cookie_header(token),
                CSRF_HEADER_NAME: token,
            },
        )

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 200


class TestBearerTokenBypass:
    """
    Behaviour 5: requests carrying `Authorization: Bearer ...` are CSRF-immune
    by design (documented in csrf.py) — a cross-site page cannot attach an
    Authorization header, so there is no forgery risk for bearer callers.
    """

    @pytest.mark.asyncio
    async def test_bearer_auth_bypasses_csrf_even_with_no_token(self):
        middleware = _middleware()
        request = _make_request(
            method="POST",
            path="/resource",
            headers={"authorization": "Bearer some.jwt.token"},
        )

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_bearer_auth_bypasses_csrf_even_with_mismatched_token(self):
        middleware = _middleware()
        request = _make_request(
            method="DELETE",
            path="/resource",
            headers={
                "authorization": "Bearer some.jwt.token",
                "cookie": _cookie_header("a" * 64),
                CSRF_HEADER_NAME: "b" * 64,
            },
        )

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_bearer_scheme_match_is_case_insensitive(self):
        middleware = _middleware()
        request = _make_request(
            method="POST",
            path="/resource",
            headers={"authorization": "bearer some.jwt.token"},
        )

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_non_bearer_authorization_still_requires_csrf(self):
        """A Basic-auth (or other scheme) header must not grant the bypass."""
        middleware = _middleware()
        request = _make_request(
            method="POST",
            path="/resource",
            headers={"authorization": "Basic dXNlcjpwYXNz"},
        )

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 403


class TestExemptPaths:
    """Behaviour 6: paths in CSRF_EXEMPT_PATHS bypass validation entirely."""

    @pytest.mark.parametrize("exempt_path", sorted(CSRF_EXEMPT_PATHS))
    @pytest.mark.asyncio
    async def test_exempt_path_bypasses_csrf_for_unsafe_methods(self, exempt_path):
        middleware = _middleware()
        # Some exempt entries are prefixes (e.g. "/api/webhooks/"); hit a
        # concrete sub-path so `path.startswith(exempt)` is exercised the
        # same way it would be for a real request.
        target_path = exempt_path if not exempt_path.endswith("/") else exempt_path + "handler"
        request = _make_request(method="POST", path=target_path)

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_non_exempt_path_is_not_accidentally_bypassed(self):
        """Sanity check: a path that merely resembles an exempt one is still checked."""
        middleware = _middleware()
        request = _make_request(method="POST", path="/api/webhooksXstripe")

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.status_code == 403


class TestCsrfCookieIssuance:
    """Behaviour 7: the response sets a CSRF cookie when one isn't present."""

    @pytest.mark.asyncio
    async def test_sets_cookie_when_missing(self):
        middleware = _middleware()
        request = _make_request(method="GET", path="/resource")

        response = await middleware.dispatch(request, _call_next_ok)

        set_cookie = response.headers.get("set-cookie")
        assert set_cookie is not None
        assert set_cookie.startswith(f"{CSRF_COOKIE_NAME}=")

    @pytest.mark.asyncio
    async def test_issued_cookie_has_hardening_attributes(self):
        middleware = _middleware()
        request = _make_request(method="GET", path="/resource")

        response = await middleware.dispatch(request, _call_next_ok)

        set_cookie = response.headers.get("set-cookie", "")
        assert "samesite=strict" in set_cookie.lower()
        assert "secure" in set_cookie.lower()

    @pytest.mark.asyncio
    async def test_does_not_overwrite_an_existing_cookie(self):
        middleware = _middleware()
        request = _make_request(
            method="GET",
            path="/resource",
            headers={"cookie": _cookie_header("already-set-token")},
        )

        response = await middleware.dispatch(request, _call_next_ok)

        assert response.headers.get("set-cookie") is None

    @pytest.mark.asyncio
    async def test_cookie_is_set_after_successful_unsafe_request_too(self):
        middleware = _middleware()
        token = generate_csrf_token()
        request = _make_request(
            method="POST",
            path="/resource",
            headers={
                "cookie": _cookie_header(token),
                CSRF_HEADER_NAME: token,
            },
        )

        # Cookie already present -> must not be reissued, even on a
        # successful state-changing request.
        response = await middleware.dispatch(request, _call_next_ok)

        assert response.headers.get("set-cookie") is None


# ============================================================
# Integration tests: real app, full middleware stack
# ============================================================
#
# These exercise behaviour that only exists once CSRFMiddleware is wired up
# alongside CORSMiddleware in app/main.py — dispatch()-level unit tests can't
# see it because there is no CORSMiddleware wrapping a bare dispatch() call.

ALLOWED_ORIGIN = "http://localhost:3000"
CSRF_PROTECTED_PATH = "/api/chat/message"  # unsafe method, not CSRF-exempt


class TestCsrfRejectionThroughFullStack:
    """
    Behaviour 8: the 403 must be a real JSONResponse that CORSMiddleware can
    wrap, not an exception that escapes the middleware stack with no CORS
    headers at all (which is exactly what shipped and broke the frontend).
    """

    def test_403_through_real_app_carries_cors_headers(self, client):
        response = client.post(
            CSRF_PROTECTED_PATH,
            json={"message": "hi"},
            headers={"Origin": ALLOWED_ORIGIN},
        )

        assert response.status_code == 403
        assert response.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN

    def test_403_through_real_app_is_json_not_plaintext(self, client):
        response = client.post(CSRF_PROTECTED_PATH, json={"message": "hi"})

        assert response.status_code == 403
        assert response.headers["content-type"].startswith("application/json")
        assert response.json() == {"detail": "CSRF token validation failed"}

    def test_mismatched_token_through_real_app_is_403_with_cors(self, client):
        client.cookies.set(CSRF_COOKIE_NAME, "a" * 64)
        response = client.post(
            CSRF_PROTECTED_PATH,
            json={"message": "hi"},
            headers={"X-CSRF-Token": "b" * 64, "Origin": ALLOWED_ORIGIN},
        )

        assert response.status_code == 403
        assert response.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN

    def test_matching_token_through_real_app_reaches_the_route(self, client):
        """
        With a valid double-submit token the request must clear the CSRF
        layer — proven by reaching the route's own auth dependency (401 for
        no bearer token) rather than being stopped at 403.
        """
        token = "c" * 64
        client.cookies.set(CSRF_COOKIE_NAME, token)
        response = client.post(
            CSRF_PROTECTED_PATH,
            json={"message": "hi"},
            headers={"X-CSRF-Token": token},
        )

        assert response.status_code == 401
        assert response.status_code != 403

    def test_bearer_request_through_real_app_bypasses_csrf(self, client):
        response = client.post(
            CSRF_PROTECTED_PATH,
            json={"message": "hi"},
            headers={"Authorization": "Bearer not-a-real-token"},
        )

        # 401 (invalid token, caught by the route's own auth dependency),
        # never 403 (would mean CSRF wrongly ran) or 5xx (would mean the
        # middleware raised).
        assert response.status_code == 401

    def test_safe_get_through_real_app_is_never_403(self, client):
        response = client.get("/api/chat/suggestions")

        assert response.status_code != 403
        assert response.status_code < 500
