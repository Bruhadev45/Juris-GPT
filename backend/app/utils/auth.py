"""
Authentication utilities for JurisGPT.
Re-exports auth dependencies from routes.auth for use across the app.
"""

from app.routes.auth import get_current_user, require_auth, require_admin

__all__ = ["get_current_user", "require_auth", "require_admin"]
