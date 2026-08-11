"""
Regression tests for middleware error-response contract bugs.

Found by /qa on 2026-08-11.
Report: .gstack/qa-reports/qa-report-localhost-3000-2026-08-11.md

Coverage of fixes from 2026-08-11:
- ISSUE-001: CSRFMiddleware raised HTTPException inside
  BaseHTTPMiddleware.dispatch. FastAPI's HTTPException handlers only run
  inside the routing layer, so the exception escaped as a bare 500
  "Internal Server Error" — every non-bearer POST/PUT/PATCH/DELETE was a
  server error instead of a 403.
- ISSUE-002: add_middleware() PREPENDS, so the last middleware added is the
  OUTERMOST. CORS was added first, placing it INSIDE CSRF and rate limiting,
  so any response those short-circuited went out with no
  Access-Control-Allow-Origin. Browsers reported an opaque network failure
  rather than the real status, and the frontend could not show a useful
  message.
- ISSUE-003: RateLimitMiddleware had the same raise-in-middleware bug as
  ISSUE-001 — rate-limited clients got a 500 and lost the Retry-After header
  they need in order to back off.

The shared invariant these tests protect: middleware must RETURN a response,
never raise, and CORS must stay the outermost layer.
"""

import pytest
from starlette.middleware.cors import CORSMiddleware

from app.middleware.csrf import CSRFMiddleware
from app.middleware.rate_limiter import RateLimitMiddleware, rate_limiter


ALLOWED_ORIGIN = "http://localhost:3000"

# A CSRF-protected, state-changing endpoint. Any unsafe-method path that is
# not in CSRF_EXEMPT_PATHS exercises the same middleware branch.
CSRF_PROTECTED_PATH = "/api/chat/message"


@pytest.fixture
def reset_rate_limiter():
    """Clear rate-limiter state so counts from other tests don't leak in."""
    rate_limiter.minute_buckets.clear()
    rate_limiter.hour_buckets.clear()
    yield
    rate_limiter.minute_buckets.clear()
    rate_limiter.hour_buckets.clear()


# ─────────────────────────────────────────────────────────────────────
# ISSUE-001: CSRF rejection must be a 403 response, not an escaped 500
# ─────────────────────────────────────────────────────────────────────


class TestCSRFRejectionIsNotServerError:
    """
    Regression: CSRFMiddleware used `raise HTTPException(403, ...)`. Raising
    inside BaseHTTPMiddleware.dispatch bypasses FastAPI's exception handlers,
    so the client received 500 "Internal Server Error" as text/plain.
    """

    def test_missing_csrf_token_returns_403_not_500(self, client):
        """ISSUE-001: POST without a CSRF token is a 403, never a 5xx"""
        response = client.post(CSRF_PROTECTED_PATH, json={"message": "hi"})

        assert response.status_code == 403, (
            f"Expected 403, got {response.status_code}: {response.text}. "
            "A 500 here means the middleware is raising HTTPException again "
            "instead of returning a JSONResponse."
        )

    def test_missing_csrf_token_returns_json_detail(self, client):
        """ISSUE-001: the rejection body must be JSON the client can parse"""
        response = client.post(CSRF_PROTECTED_PATH, json={"message": "hi"})

        assert response.headers["content-type"].startswith("application/json")
        assert response.json() == {"detail": "CSRF token validation failed"}

    def test_mismatched_csrf_token_returns_403(self, client):
        """ISSUE-001: cookie/header mismatch is rejected, not a server error"""
        client.cookies.set("csrf_token", "a" * 64)
        response = client.post(
            CSRF_PROTECTED_PATH,
            json={"message": "hi"},
            headers={"X-CSRF-Token": "b" * 64},
        )

        assert response.status_code == 403

    def test_bearer_token_request_bypasses_csrf(self, client):
        """
        ISSUE-001 guard: bearer-auth callers are CSRF-immune by design, so they
        must reach the auth dependency (401 for a bad token) rather than be
        rejected at the CSRF layer (403) or crash (500).
        """
        response = client.post(
            CSRF_PROTECTED_PATH,
            json={"message": "hi"},
            headers={"Authorization": "Bearer not-a-real-token"},
        )

        assert response.status_code == 401, (
            f"Expected 401 from the auth dependency, got "
            f"{response.status_code}. 403 means CSRF wrongly rejected a "
            "bearer request; 500 means the middleware raised."
        )

    def test_safe_methods_are_not_csrf_checked(self, client):
        """ISSUE-001 guard: GET must not be blocked by CSRF"""
        response = client.get("/api/chat/suggestions")

        assert response.status_code != 403
        assert response.status_code < 500


# ─────────────────────────────────────────────────────────────────────
# ISSUE-002: CORS must wrap middleware-generated error responses
# ─────────────────────────────────────────────────────────────────────


class TestCORSWrapsMiddlewareErrors:
    """
    Regression: CORS was registered first, which made it the INNERMOST
    middleware. Responses short-circuited by CSRF/rate limiting never passed
    through it, so the browser saw an opaque failure instead of the status.
    """

    def test_csrf_403_carries_cors_headers(self, client):
        """ISSUE-002: the browser must be able to read the 403"""
        response = client.post(
            CSRF_PROTECTED_PATH,
            json={"message": "hi"},
            headers={"Origin": ALLOWED_ORIGIN},
        )

        assert response.status_code == 403
        assert response.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN, (
            "CSRF rejection lost its CORS headers — CORSMiddleware is no "
            "longer the outermost layer. add_middleware() prepends, so CORS "
            "must be added LAST in app/main.py."
        )

    def test_successful_response_still_carries_cors_headers(self, client):
        """ISSUE-002 guard: reordering must not break CORS on the happy path"""
        response = client.get("/health", headers={"Origin": ALLOWED_ORIGIN})

        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN

    def test_cors_is_the_outermost_middleware(self):
        """
        ISSUE-002: assert the ordering directly, so the bug is caught even if
        no request-level test happens to exercise a short-circuited response.

        Starlette's add_middleware() inserts at index 0, so user_middleware[0]
        is the outermost layer.
        """
        from app.main import app

        classes = [m.cls for m in app.user_middleware]

        assert classes[0] is CORSMiddleware, (
            f"CORSMiddleware must be outermost, but the order is {classes}. "
            "Add CORS LAST in main.py — add_middleware() prepends."
        )
        # CORS must specifically sit outside the two middlewares that can
        # short-circuit a request with an error response.
        assert classes.index(CORSMiddleware) < classes.index(CSRFMiddleware)
        assert classes.index(CORSMiddleware) < classes.index(RateLimitMiddleware)


# ─────────────────────────────────────────────────────────────────────
# ISSUE-003: rate limiting must be a 429 response, not an escaped 500
# ─────────────────────────────────────────────────────────────────────


class TestRateLimitRejectionIsNotServerError:
    """
    Regression: RateLimitMiddleware used `raise HTTPException(429, ...)`, which
    escaped as a 500 and dropped the Retry-After header, leaving clients with
    no way to back off correctly.
    """

    def _exhaust(self, client, path="/api/legal/stats"):
        """Send requests until one is rejected, then return that response."""
        limit = rate_limiter.requests_per_minute
        for _ in range(limit + 5):
            response = client.get(path)
            if response.status_code != 200:
                return response
        pytest.fail(
            f"Rate limiter never rejected after {limit + 5} requests — "
            "the limit is not being enforced."
        )

    def test_rate_limited_request_returns_429_not_500(
        self, client, reset_rate_limiter
    ):
        """ISSUE-003: exceeding the limit is a 429, never a 5xx"""
        response = self._exhaust(client)

        assert response.status_code == 429, (
            f"Expected 429, got {response.status_code}: {response.text}. "
            "A 500 means the middleware is raising HTTPException again."
        )

    def test_rate_limited_request_includes_retry_after(
        self, client, reset_rate_limiter
    ):
        """ISSUE-003: clients need Retry-After in order to back off"""
        response = self._exhaust(client)

        assert "retry-after" in response.headers, (
            "Retry-After was dropped. Raising HTTPException from middleware "
            "loses the headers; the middleware must return a JSONResponse."
        )
        assert int(response.headers["retry-after"]) > 0
        assert response.headers.get("x-ratelimit-remaining") == "0"

    def test_rate_limited_request_carries_cors_headers(
        self, client, reset_rate_limiter
    ):
        """ISSUE-002 + ISSUE-003: the browser must be able to read the 429"""
        limit = rate_limiter.requests_per_minute
        response = None
        for _ in range(limit + 5):
            response = client.get(
                "/api/legal/stats", headers={"Origin": ALLOWED_ORIGIN}
            )
            if response.status_code == 429:
                break

        assert response.status_code == 429
        assert response.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN

    def test_requests_under_the_limit_are_not_rejected(
        self, client, reset_rate_limiter
    ):
        """ISSUE-003 guard: the fix must not make the limiter over-eager"""
        for i in range(10):
            response = client.get("/api/legal/stats")
            assert response.status_code != 429, (
                f"Request {i + 1} was rate limited well under the "
                f"{rate_limiter.requests_per_minute}/min limit."
            )

    def test_health_endpoint_is_exempt_from_rate_limiting(
        self, client, reset_rate_limiter
    ):
        """ISSUE-003 guard: exempt paths must stay exempt after the fix"""
        limit = rate_limiter.requests_per_minute
        for _ in range(limit + 5):
            assert client.get("/health").status_code == 200
