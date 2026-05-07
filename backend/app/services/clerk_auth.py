"""
Clerk JWT verification using JWKS.

Clerk signs session JWTs with RS256. Verification flow:
  1. Decode JWT header to get the `kid` (key id)
  2. Fetch the JWKS from `<CLERK_ISSUER>/.well-known/jwks.json` (cached)
  3. Find the matching public key
  4. Verify the signature + claims with PyJWT

`CLERK_JWT_ISSUER` env var must be set on the backend (e.g.
`https://awaited-tapir-64.clerk.accounts.dev`). The frontend's publishable
key (`pk_test_...`) base64-decodes to `<issuer-domain>$`, so the issuer is
`https://<that-domain>`.
"""
from __future__ import annotations

import logging
import os
import time
from typing import Any, Dict, Optional

import httpx
import jwt
from jwt import PyJWKClient

logger = logging.getLogger(__name__)


def _resolve_issuer() -> Optional[str]:
    issuer = os.getenv("CLERK_JWT_ISSUER")
    if issuer:
        return issuer.rstrip("/")
    # Fallback: derive from publishable key. The pk_test_... format is
    # `pk_<env>_<base64(domain + "$")>`. We don't always have the pk on the
    # backend, so this is best-effort.
    pk = os.getenv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") or os.getenv("CLERK_PUBLISHABLE_KEY")
    if pk and pk.startswith("pk_"):
        try:
            import base64
            payload = pk.split("_", 2)[-1]
            # Add base64 padding if needed
            payload += "=" * (-len(payload) % 4)
            decoded = base64.urlsafe_b64decode(payload).decode()
            domain = decoded.rstrip("$")
            return f"https://{domain}"
        except Exception:
            return None
    return None


_ISSUER: Optional[str] = _resolve_issuer()
_JWKS_CLIENT: Optional[PyJWKClient] = None
_JWKS_REFRESHED_AT: float = 0.0
_JWKS_TTL_SECONDS = 6 * 60 * 60  # refresh JWKS every 6 hours


class ClerkAuthError(Exception):
    """Raised when a Clerk JWT cannot be verified."""


def _get_jwks_client() -> PyJWKClient:
    global _JWKS_CLIENT, _JWKS_REFRESHED_AT
    if not _ISSUER:
        raise ClerkAuthError(
            "CLERK_JWT_ISSUER not configured. Set it in backend env vars."
        )
    now = time.time()
    if _JWKS_CLIENT is None or (now - _JWKS_REFRESHED_AT) > _JWKS_TTL_SECONDS:
        url = f"{_ISSUER}/.well-known/jwks.json"
        logger.info("Loading Clerk JWKS from %s", url)
        _JWKS_CLIENT = PyJWKClient(url, cache_keys=True, lifespan=_JWKS_TTL_SECONDS)
        _JWKS_REFRESHED_AT = now
    return _JWKS_CLIENT


def verify_clerk_jwt(token: str) -> Dict[str, Any]:
    """Verify a Clerk session JWT and return its claims.

    Raises ClerkAuthError on invalid/expired tokens or JWKS issues.
    """
    if not _ISSUER:
        raise ClerkAuthError("CLERK_JWT_ISSUER not configured")

    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        # Clerk JWTs do not always include `aud`; we accept any audience but
        # require `iss` to match our configured issuer.
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=_ISSUER,
            options={"verify_aud": False, "require": ["sub", "iss", "exp"]},
        )
        return claims
    except jwt.ExpiredSignatureError as e:
        raise ClerkAuthError("Clerk session expired") from e
    except jwt.InvalidIssuerError as e:
        raise ClerkAuthError(f"JWT issuer mismatch (expected {_ISSUER})") from e
    except jwt.InvalidTokenError as e:
        raise ClerkAuthError(f"Invalid Clerk token: {e}") from e


async def fetch_clerk_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetch user details from Clerk Backend API.

    Used when our local users table doesn't have a row yet (lazy creation
    on first authenticated request).
    """
    secret = os.getenv("CLERK_SECRET_KEY")
    if not secret:
        return None
    url = f"https://api.clerk.com/v1/users/{user_id}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, headers={"Authorization": f"Bearer {secret}"})
            if r.status_code == 200:
                return r.json()
    except Exception as e:
        logger.warning("Clerk user fetch failed: %s", e)
    return None
