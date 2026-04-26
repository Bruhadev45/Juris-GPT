"""
Audit Logging Middleware for JurisGPT
Tracks all API requests and important system events for compliance and debugging
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from collections import deque
import json
import uuid
import asyncio


class AuditLog:
    """Represents a single audit log entry"""

    def __init__(
        self,
        request_id: str,
        timestamp: datetime,
        client_ip: str,
        method: str,
        path: str,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        status_code: Optional[int] = None,
        response_time_ms: Optional[float] = None,
        request_body: Optional[dict] = None,
        response_summary: Optional[str] = None,
        error: Optional[str] = None,
        metadata: Optional[dict] = None
    ):
        self.request_id = request_id
        self.timestamp = timestamp
        self.client_ip = client_ip
        self.method = method
        self.path = path
        self.user_id = user_id
        self.user_email = user_email
        self.status_code = status_code
        self.response_time_ms = response_time_ms
        self.request_body = request_body
        self.response_summary = response_summary
        self.error = error
        self.metadata = metadata or {}

    def to_dict(self) -> dict:
        return {
            "request_id": self.request_id,
            "timestamp": self.timestamp.isoformat(),
            "client_ip": self.client_ip,
            "method": self.method,
            "path": self.path,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "status_code": self.status_code,
            "response_time_ms": self.response_time_ms,
            "request_body": self.request_body,
            "response_summary": self.response_summary,
            "error": self.error,
            "metadata": self.metadata
        }


class AuditLogger:
    """
    Audit logging system for tracking API requests and system events
    In production, this would write to a database or logging service
    """

    def __init__(self, max_logs: int = 10000):
        self.logs: deque = deque(maxlen=max_logs)
        self._lock = asyncio.Lock()

        # Sensitive fields to redact
        self.sensitive_fields = {
            "password", "password_hash", "secret", "token", "api_key",
            "access_token", "refresh_token", "authorization", "credit_card",
            "card_number", "cvv", "ssn", "pan_number", "aadhaar",
            "openai_api_key", "supabase_service_key", "razorpay_key_secret",
            "do_spaces_secret", "resend_api_key", "jwt_secret",
        }

    def _redact_sensitive(self, data: Any) -> Any:
        """Recursively redact sensitive fields from data"""
        if isinstance(data, dict):
            return {
                k: "[REDACTED]" if k.lower() in self.sensitive_fields else self._redact_sensitive(v)
                for k, v in data.items()
            }
        elif isinstance(data, list):
            return [self._redact_sensitive(item) for item in data]
        return data

    async def log(self, entry: AuditLog):
        """Add an audit log entry"""
        async with self._lock:
            # Redact sensitive data
            if entry.request_body:
                entry.request_body = self._redact_sensitive(entry.request_body)
            self.logs.append(entry)

    async def log_event(
        self,
        event_type: str,
        description: str,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        metadata: Optional[dict] = None
    ):
        """Log a system event (not tied to a specific request)"""
        entry = AuditLog(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            client_ip="system",
            method="EVENT",
            path=f"/event/{event_type}",
            user_id=user_id,
            user_email=user_email,
            metadata={"event_type": event_type, "description": description, **(metadata or {})}
        )
        await self.log(entry)

    async def get_logs(
        self,
        limit: int = 100,
        offset: int = 0,
        user_id: Optional[str] = None,
        method: Optional[str] = None,
        path_contains: Optional[str] = None,
        status_code: Optional[int] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None
    ) -> List[dict]:
        """Query audit logs with filters"""
        async with self._lock:
            filtered = list(self.logs)

            # Apply filters
            if user_id:
                filtered = [l for l in filtered if l.user_id == user_id]
            if method:
                filtered = [l for l in filtered if l.method == method]
            if path_contains:
                filtered = [l for l in filtered if path_contains in l.path]
            if status_code:
                filtered = [l for l in filtered if l.status_code == status_code]
            if from_date:
                filtered = [l for l in filtered if l.timestamp >= from_date]
            if to_date:
                filtered = [l for l in filtered if l.timestamp <= to_date]

            # Sort by timestamp descending
            filtered.sort(key=lambda x: x.timestamp, reverse=True)

            # Apply pagination
            paginated = filtered[offset:offset + limit]

            return [log.to_dict() for log in paginated]

    async def get_stats(self) -> dict:
        """Get audit log statistics"""
        async with self._lock:
            total = len(self.logs)
            if total == 0:
                return {"total_logs": 0}

            logs_list = list(self.logs)

            # Count by method
            method_counts = {}
            for log in logs_list:
                method_counts[log.method] = method_counts.get(log.method, 0) + 1

            # Count by status code
            status_counts = {}
            for log in logs_list:
                if log.status_code:
                    status_counts[log.status_code] = status_counts.get(log.status_code, 0) + 1

            # Count errors
            error_count = sum(1 for log in logs_list if log.error)

            # Average response time
            response_times = [log.response_time_ms for log in logs_list if log.response_time_ms]
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0

            return {
                "total_logs": total,
                "method_counts": method_counts,
                "status_counts": status_counts,
                "error_count": error_count,
                "avg_response_time_ms": round(avg_response_time, 2),
                "oldest_log": logs_list[0].timestamp.isoformat() if logs_list else None,
                "newest_log": logs_list[-1].timestamp.isoformat() if logs_list else None
            }


# Global audit logger instance
audit_logger = AuditLogger()


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Middleware to automatically log all API requests"""

    # Paths to skip logging
    SKIP_PATHS = {
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico"
    }

    async def dispatch(self, request: Request, call_next):
        # Skip logging for certain paths
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        # Generate request ID
        request_id = str(uuid.uuid4())

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        # Get user info from token (if available)
        user_id = None
        user_email = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from app.routes.auth import decode_token
                token = auth_header.split(" ")[1]
                payload = decode_token(token)
                user_id = payload.get("sub")
                user_email = payload.get("email")
            except Exception:
                pass  # Token invalid or expired — proceed without user context

        # Try to get request body (for POST/PUT requests)
        request_body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    request_body = json.loads(body.decode())
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass  # Non-JSON body or binary data — skip logging body

        # Record start time
        start_time = datetime.now(timezone.utc)

        # Process request
        response = None
        error = None
        try:
            response = await call_next(request)
        except Exception as e:
            error = str(e)
            raise

        # Calculate response time
        end_time = datetime.now(timezone.utc)
        response_time_ms = (end_time - start_time).total_seconds() * 1000

        # Create audit log entry
        entry = AuditLog(
            request_id=request_id,
            timestamp=start_time,
            client_ip=client_ip,
            method=request.method,
            path=request.url.path,
            user_id=user_id,
            user_email=user_email,
            status_code=response.status_code if response else 500,
            response_time_ms=round(response_time_ms, 2),
            request_body=request_body,
            error=error
        )

        # Log asynchronously
        asyncio.create_task(audit_logger.log(entry))

        # Add request ID to response headers
        if response:
            response.headers["X-Request-ID"] = request_id

        return response
