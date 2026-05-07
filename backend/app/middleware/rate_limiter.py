"""
Rate Limiting Middleware for JurisGPT API
Implements token bucket algorithm for API rate limiting
"""

import asyncio
import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimiter:
    """Token bucket rate limiter"""

    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        burst_size: int = 10
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_size = burst_size

        # Store request counts: {ip: [(timestamp, count), ...]}
        self.minute_buckets: Dict[str, list] = defaultdict(list)
        self.hour_buckets: Dict[str, list] = defaultdict(list)

        # Lock for thread safety
        self._lock = asyncio.Lock()

    def _clean_old_entries(self, bucket: list, window: timedelta) -> list:
        """Remove entries older than the window"""
        cutoff = datetime.now(timezone.utc) - window
        return [entry for entry in bucket if entry[0] > cutoff]

    async def is_allowed(self, client_ip: str) -> Tuple[bool, dict]:
        """Check if request is allowed based on rate limits"""
        async with self._lock:
            now = datetime.now(timezone.utc)

            # Clean old entries
            self.minute_buckets[client_ip] = self._clean_old_entries(
                self.minute_buckets[client_ip],
                timedelta(minutes=1)
            )
            self.hour_buckets[client_ip] = self._clean_old_entries(
                self.hour_buckets[client_ip],
                timedelta(hours=1)
            )

            # Count requests
            minute_count = sum(entry[1] for entry in self.minute_buckets[client_ip])
            hour_count = sum(entry[1] for entry in self.hour_buckets[client_ip])

            # Check limits
            if minute_count >= self.requests_per_minute:
                return False, {
                    "error": "Rate limit exceeded",
                    "limit": "minute",
                    "retry_after": 60,
                    "requests_made": minute_count,
                    "requests_allowed": self.requests_per_minute
                }

            if hour_count >= self.requests_per_hour:
                return False, {
                    "error": "Rate limit exceeded",
                    "limit": "hour",
                    "retry_after": 3600,
                    "requests_made": hour_count,
                    "requests_allowed": self.requests_per_hour
                }

            # Record this request
            self.minute_buckets[client_ip].append((now, 1))
            self.hour_buckets[client_ip].append((now, 1))

            return True, {
                "requests_remaining_minute": self.requests_per_minute - minute_count - 1,
                "requests_remaining_hour": self.requests_per_hour - hour_count - 1
            }

    def get_stats(self, client_ip: str) -> dict:
        """Get rate limit stats for a client"""
        minute_count = sum(entry[1] for entry in self.minute_buckets.get(client_ip, []))
        hour_count = sum(entry[1] for entry in self.hour_buckets.get(client_ip, []))

        return {
            "client_ip": client_ip,
            "requests_this_minute": minute_count,
            "requests_this_hour": hour_count,
            "limit_per_minute": self.requests_per_minute,
            "limit_per_hour": self.requests_per_hour,
            "remaining_minute": max(0, self.requests_per_minute - minute_count),
            "remaining_hour": max(0, self.requests_per_hour - hour_count)
        }


# Global rate limiter instance
rate_limiter = RateLimiter(
    requests_per_minute=60,
    requests_per_hour=1000,
    burst_size=10
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce rate limiting on API requests"""

    # Paths that are exempt from rate limiting
    EXEMPT_PATHS = {
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico"
    }

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for exempt paths
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        # Get client IP. We only honor X-Forwarded-For when we're actually
        # running behind a known proxy — otherwise any caller can spoof
        # `X-Forwarded-For: 1.2.3.4` to bypass per-IP limits. Set
        # TRUST_PROXY_HEADERS=true in the env (e.g. on Render, Vercel-fronted
        # FastAPI) to opt in.
        client_ip = request.client.host if request.client else "unknown"
        if os.getenv("TRUST_PROXY_HEADERS", "").lower() in ("1", "true", "yes"):
            forwarded_for = request.headers.get("X-Forwarded-For")
            if forwarded_for:
                client_ip = forwarded_for.split(",")[0].strip()

        # Check rate limit
        allowed, info = await rate_limiter.is_allowed(client_ip)

        if not allowed:
            raise HTTPException(
                status_code=429,
                detail=info,
                headers={
                    "Retry-After": str(info.get("retry_after", 60)),
                    "X-RateLimit-Limit": str(info.get("requests_allowed", 60)),
                    "X-RateLimit-Remaining": "0"
                }
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit-Minute"] = str(rate_limiter.requests_per_minute)
        response.headers["X-RateLimit-Limit-Hour"] = str(rate_limiter.requests_per_hour)
        response.headers["X-RateLimit-Remaining-Minute"] = str(info.get("requests_remaining_minute", 0))
        response.headers["X-RateLimit-Remaining-Hour"] = str(info.get("requests_remaining_hour", 0))

        return response


# Rate limit configuration for different endpoints
ENDPOINT_LIMITS = {
    "/api/chat/message": {"per_minute": 20, "per_hour": 200},  # AI chat is expensive
    "/api/documents/generate": {"per_minute": 5, "per_hour": 50},  # Document generation
    "/api/analyzer/": {"per_minute": 10, "per_hour": 100},  # Document analysis
    "default": {"per_minute": 60, "per_hour": 1000}
}


def get_endpoint_limit(path: str) -> dict:
    """Get rate limit for specific endpoint"""
    for endpoint, limits in ENDPOINT_LIMITS.items():
        if path.startswith(endpoint):
            return limits
    return ENDPOINT_LIMITS["default"]
