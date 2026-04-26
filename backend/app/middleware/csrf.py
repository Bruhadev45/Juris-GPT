"""
CSRF Protection Middleware for JurisGPT
Implements double-submit cookie pattern for CSRF protection
"""

import secrets
from typing import Optional
from fastapi import Request, HTTPException, APIRouter
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_TOKEN_LENGTH = 32
CSRF_COOKIE_MAX_AGE = 3600 * 24  # 24 hours

# Methods that require CSRF validation
UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Paths exempt from CSRF (public APIs, webhooks, docs)
CSRF_EXEMPT_PATHS = {
    "/api/webhooks/",
    "/api/auth/login",
    "/api/auth/register",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
}


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token."""
    return secrets.token_hex(CSRF_TOKEN_LENGTH)


def validate_csrf_token(cookie_token: Optional[str], header_token: Optional[str]) -> bool:
    """
    Validate CSRF token using double-submit pattern.

    The token from the cookie must match the token from the header.
    Uses constant-time comparison to prevent timing attacks.
    """
    if not cookie_token or not header_token:
        return False

    return secrets.compare_digest(cookie_token, header_token)


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection Middleware using double-submit cookie pattern.

    For state-changing requests (POST, PUT, PATCH, DELETE):
    1. Checks for CSRF token in cookie
    2. Validates against X-CSRF-Token header
    3. Rejects requests with invalid/missing tokens

    For all responses:
    1. Sets CSRF cookie if not present
    """

    async def dispatch(self, request: Request, call_next):
        # Check if path is exempt
        path = request.url.path
        if any(path.startswith(exempt) for exempt in CSRF_EXEMPT_PATHS):
            return await call_next(request)

        # Get token from cookie
        cookie_token = request.cookies.get(CSRF_COOKIE_NAME)

        # Validate CSRF for unsafe methods
        if request.method in UNSAFE_METHODS:
            header_token = request.headers.get(CSRF_HEADER_NAME)

            if not validate_csrf_token(cookie_token, header_token):
                raise HTTPException(
                    status_code=403,
                    detail="CSRF token validation failed"
                )

        # Process request
        response = await call_next(request)

        # Set CSRF cookie if not present
        if not cookie_token:
            new_token = generate_csrf_token()
            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=new_token,
                max_age=CSRF_COOKIE_MAX_AGE,
                httponly=False,  # Must be readable by JS
                samesite="strict",
                secure=True,  # Requires HTTPS in production
            )

        return response


# Router for CSRF token endpoint
csrf_router = APIRouter()


@csrf_router.get("/csrf-token")
async def get_csrf_token(request: Request):
    """Get a fresh CSRF token. Sets cookie and returns token in response."""
    token = request.cookies.get(CSRF_COOKIE_NAME)
    if not token:
        token = generate_csrf_token()

    return {"csrf_token": token}
