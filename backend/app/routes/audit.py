"""
Audit Log routes for JurisGPT
Provides endpoints for querying and managing audit logs
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel

from app.routes.auth import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])


# ============== Models ==============

class AuditLogEntry(BaseModel):
    request_id: str
    timestamp: str
    client_ip: str
    method: str
    path: str
    user_id: Optional[str]
    user_email: Optional[str]
    status_code: Optional[int]
    response_time_ms: Optional[float]
    error: Optional[str]
    metadata: Optional[dict]


class AuditLogStats(BaseModel):
    total_logs: int
    method_counts: dict
    status_counts: dict
    error_count: int
    avg_response_time_ms: float
    oldest_log: Optional[str]
    newest_log: Optional[str]


class AuditLogResponse(BaseModel):
    logs: List[AuditLogEntry]
    total: int
    page: int
    limit: int


# ============== Routes ==============

@router.get("/logs", response_model=AuditLogResponse)
async def get_audit_logs(
    limit: int = Query(default=50, le=500),
    offset: int = Query(default=0, ge=0),
    user_id: Optional[str] = None,
    method: Optional[str] = None,
    path_contains: Optional[str] = None,
    status_code: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    errors_only: bool = False
):
    """
    Query audit logs with filters

    Parameters:
    - limit: Maximum number of logs to return (max 500)
    - offset: Number of logs to skip
    - user_id: Filter by user ID
    - method: Filter by HTTP method (GET, POST, etc.)
    - path_contains: Filter by path containing string
    - status_code: Filter by HTTP status code
    - from_date: Filter logs from this date (ISO format)
    - to_date: Filter logs until this date (ISO format)
    - errors_only: Only return logs with errors
    """
    try:
        from app.middleware.audit_logger import audit_logger

        # Parse dates
        from_dt = None
        to_dt = None
        if from_date:
            from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        if to_date:
            to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))

        # Get logs with filters
        logs = await audit_logger.get_logs(
            limit=limit,
            offset=offset,
            user_id=user_id,
            method=method,
            path_contains=path_contains,
            status_code=status_code,
            from_date=from_dt,
            to_date=to_dt
        )

        # Filter errors if requested
        if errors_only:
            logs = [log for log in logs if log.get('error')]

        return AuditLogResponse(
            logs=logs,
            total=len(logs),
            page=(offset // limit) + 1,
            limit=limit
        )

    except ImportError:
        # Audit logger not initialized
        return AuditLogResponse(logs=[], total=0, page=1, limit=limit)


@router.get("/stats", response_model=AuditLogStats)
async def get_audit_stats():
    """Get audit log statistics"""
    try:
        from app.middleware.audit_logger import audit_logger
        stats = await audit_logger.get_stats()
        return AuditLogStats(**stats)
    except ImportError:
        return AuditLogStats(
            total_logs=0,
            method_counts={},
            status_counts={},
            error_count=0,
            avg_response_time_ms=0,
            oldest_log=None,
            newest_log=None
        )


@router.get("/logs/{request_id}")
async def get_log_by_request_id(request_id: str):
    """Get a specific audit log entry by request ID"""
    try:
        from app.middleware.audit_logger import audit_logger

        logs = await audit_logger.get_logs(limit=10000)
        for log in logs:
            if log.get('request_id') == request_id:
                return log

        raise HTTPException(status_code=404, detail="Log entry not found")
    except ImportError:
        raise HTTPException(status_code=404, detail="Audit logger not available")


@router.get("/user/{user_id}/activity")
async def get_user_activity(
    user_id: str,
    days: int = Query(default=7, le=30)
):
    """Get activity summary for a specific user"""
    try:
        from app.middleware.audit_logger import audit_logger

        from_date = datetime.now(timezone.utc) - timedelta(days=days)

        logs = await audit_logger.get_logs(
            limit=1000,
            user_id=user_id,
            from_date=from_date
        )

        # Aggregate activity
        activity_by_day = {}
        endpoint_counts = {}
        total_requests = len(logs)
        error_count = 0

        for log in logs:
            # Count by day
            log_date = datetime.fromisoformat(log['timestamp']).strftime('%Y-%m-%d')
            activity_by_day[log_date] = activity_by_day.get(log_date, 0) + 1

            # Count by endpoint
            path = log.get('path', 'unknown')
            endpoint_counts[path] = endpoint_counts.get(path, 0) + 1

            # Count errors
            if log.get('error'):
                error_count += 1

        return {
            "user_id": user_id,
            "period_days": days,
            "total_requests": total_requests,
            "error_count": error_count,
            "activity_by_day": activity_by_day,
            "top_endpoints": dict(sorted(endpoint_counts.items(), key=lambda x: x[1], reverse=True)[:10])
        }
    except ImportError:
        return {
            "user_id": user_id,
            "period_days": days,
            "total_requests": 0,
            "error_count": 0,
            "activity_by_day": {},
            "top_endpoints": {}
        }


@router.get("/errors/recent")
async def get_recent_errors(limit: int = Query(default=20, le=100)):
    """Get recent error logs"""
    try:
        from app.middleware.audit_logger import audit_logger

        logs = await audit_logger.get_logs(limit=500)
        error_logs = [log for log in logs if log.get('error') or (log.get('status_code') and log['status_code'] >= 400)]

        return {
            "errors": error_logs[:limit],
            "total": len(error_logs)
        }
    except ImportError:
        return {"errors": [], "total": 0}


@router.get("/performance")
async def get_performance_metrics(minutes: int = Query(default=60, le=1440)):
    """Get API performance metrics for the specified time window"""
    try:
        from app.middleware.audit_logger import audit_logger

        from_date = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        logs = await audit_logger.get_logs(limit=5000, from_date=from_date)

        if not logs:
            return {
                "period_minutes": minutes,
                "total_requests": 0,
                "avg_response_time_ms": 0,
                "p50_response_time_ms": 0,
                "p95_response_time_ms": 0,
                "p99_response_time_ms": 0,
                "error_rate": 0,
                "requests_per_minute": 0
            }

        # Calculate metrics
        response_times = [log.get('response_time_ms', 0) for log in logs if log.get('response_time_ms')]
        response_times.sort()

        total_requests = len(logs)
        error_count = sum(1 for log in logs if log.get('error') or (log.get('status_code') and log['status_code'] >= 400))

        def percentile(data, p):
            if not data:
                return 0
            k = (len(data) - 1) * (p / 100)
            f = int(k)
            c = f + 1 if f < len(data) - 1 else f
            return data[f] + (data[c] - data[f]) * (k - f)

        return {
            "period_minutes": minutes,
            "total_requests": total_requests,
            "avg_response_time_ms": round(sum(response_times) / len(response_times), 2) if response_times else 0,
            "p50_response_time_ms": round(percentile(response_times, 50), 2),
            "p95_response_time_ms": round(percentile(response_times, 95), 2),
            "p99_response_time_ms": round(percentile(response_times, 99), 2),
            "error_rate": round((error_count / total_requests) * 100, 2) if total_requests > 0 else 0,
            "requests_per_minute": round(total_requests / minutes, 2)
        }
    except ImportError:
        return {
            "period_minutes": minutes,
            "total_requests": 0,
            "avg_response_time_ms": 0,
            "p50_response_time_ms": 0,
            "p95_response_time_ms": 0,
            "p99_response_time_ms": 0,
            "error_rate": 0,
            "requests_per_minute": 0
        }


@router.post("/events")
async def log_custom_event(
    event_type: str,
    description: str,
    user_id: Optional[str] = None,
    metadata: Optional[dict] = None
):
    """Log a custom event (for tracking business events)"""
    try:
        from app.middleware.audit_logger import audit_logger

        await audit_logger.log_event(
            event_type=event_type,
            description=description,
            user_id=user_id,
            metadata=metadata
        )

        return {"status": "logged", "event_type": event_type}
    except ImportError:
        return {"status": "skipped", "reason": "audit logger not available"}
