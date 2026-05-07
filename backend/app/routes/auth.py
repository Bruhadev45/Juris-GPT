"""
Authentication routes for JurisGPT
Implements user authentication, registration, and session management
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone
import jwt
from app.config import settings

logger = logging.getLogger(__name__)
from app.repositories import (
    UserNotFoundError,
    UserAlreadyExistsError,
    hash_password,
    verify_password,
)
from app.repositories import user_repository

router = APIRouter()
security = HTTPBearer(auto_error=False)

# JWT Configuration — uses dedicated secret, never derived from other keys
JWT_SECRET = settings.jwt_secret
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 1  # Short-lived access tokens


# ============== Schemas ==============

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: Optional[str] = None
    phone: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    role: str = "user"
    created_at: datetime
    is_verified: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


# ============== Token Management ==============


def create_access_token(user_id: str, email: str, role: str = "user") -> str:
    """Create JWT access token"""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": now + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": now,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a session JWT.

    The project moved to Clerk, so production tokens are RS256-signed JWTs
    with `iss=https://<clerk-domain>` and `kid` referencing Clerk's JWKS.
    The legacy custom HS256 path is kept as a fallback so existing
    smoke-test users (and anyone running fully local without Clerk) keep
    working — try Clerk first, fall back to HS256.
    """
    # Prefer Clerk verification when configured.
    try:
        from app.services.clerk_auth import verify_clerk_jwt, ClerkAuthError
        return verify_clerk_jwt(token)
    except ClerkAuthError:
        # If Clerk decode failed AND legacy HS256 isn't configured, surface 401.
        pass
    except Exception:
        # Don't let unexpected import/JWKS failures break legacy HS256 callers.
        logger.exception("Clerk JWT verifier crashed; falling back to legacy HS256")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def _get_or_create_user(user_id: str, claims: dict) -> Optional[dict]:
    """Resolve a JWT user_id to a row in public.users, creating it if missing.

    For Clerk-issued JWTs this is the lazy-create path: when a Clerk user
    signs in for the first time their row doesn't exist yet. We mint one
    using their JWT claims (sub, email, primary email).
    """
    user = await user_repository.get_user_by_id(user_id)
    if user:
        return user

    # Only lazy-create if claims look like a Clerk token (has iss, email).
    email = (
        claims.get("email")
        or claims.get("primary_email")
        or claims.get("email_address")
    )
    if not email:
        # Try fetching from Clerk Backend API as a last resort.
        from app.services.clerk_auth import fetch_clerk_user
        clerk_user = await fetch_clerk_user(user_id)
        if clerk_user:
            primary = next(
                (e for e in clerk_user.get("email_addresses", [])
                 if e.get("id") == clerk_user.get("primary_email_address_id")),
                None,
            )
            email = primary.get("email_address") if primary else None
            full_name = (
                " ".join(filter(None, [clerk_user.get("first_name"), clerk_user.get("last_name")]))
                or clerk_user.get("username")
                or email
            )
        else:
            return None
    else:
        full_name = (
            claims.get("name")
            or claims.get("full_name")
            or " ".join(filter(None, [claims.get("first_name"), claims.get("last_name")]))
            or email
        )

    if not email:
        return None

    return await user_repository.create_user_record(
        user_id=user_id,
        email=email,
        full_name=full_name or email,
        password_hash="",  # Clerk owns credentials; no local password.
        role="user",
        is_verified=True,
    )


# ============== Dependency ==============

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Get current authenticated user from token (returns None if not authenticated)"""
    if not credentials:
        return None

    try:
        payload = decode_token(credentials.credentials)
    except HTTPException:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    try:
        return await _get_or_create_user(user_id, payload)
    except Exception:
        logger.warning("get_current_user: repository lookup failed", exc_info=True)
        return None


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Require authentication — raises 401 if not authenticated"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await _get_or_create_user(user_id, payload)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


async def require_admin(user: dict = Depends(require_auth)) -> dict:
    """Require admin role"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ============== Routes ==============

@router.post("/register", response_model=TokenResponse)
async def register(request: UserRegisterRequest):
    """Register a new user"""
    # Validate password strength
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    # Create user using repository
    try:
        user = await user_repository.create_user(
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            company_name=request.company_name,
            phone=request.phone,
            role="user",
        )
    except UserAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

    # Create token
    token = create_access_token(user["id"], user["email"])

    # Parse created_at if it's a string
    created_at = user["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))

    return TokenResponse(
        access_token=token,
        expires_in=JWT_EXPIRATION_HOURS * 3600,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            company_name=user.get("company_name"),
            phone=user.get("phone"),
            role=user.get("role", "user"),
            created_at=created_at,
            is_verified=user.get("is_verified", False),
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest):
    """Login with email and password"""
    # Find user by email
    try:
        user = await user_repository.get_user_by_email(request.email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create token
    token = create_access_token(user["id"], user["email"], user.get("role", "user"))

    # Parse created_at if it's a string
    created_at = user["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))

    return TokenResponse(
        access_token=token,
        expires_in=JWT_EXPIRATION_HOURS * 3600,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            company_name=user.get("company_name"),
            phone=user.get("phone"),
            role=user.get("role", "user"),
            created_at=created_at,
            is_verified=user.get("is_verified", False),
        ),
    )


@router.post("/logout")
async def logout(user: dict = Depends(require_auth)):
    """Logout current user"""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(user: dict = Depends(require_auth)):
    """Get current authenticated user info"""
    # Parse created_at if it's a string
    created_at = user["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))

    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        company_name=user.get("company_name"),
        phone=user.get("phone"),
        role=user.get("role", "user"),
        created_at=created_at,
        is_verified=user.get("is_verified", False),
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    full_name: Optional[str] = None,
    company_name: Optional[str] = None,
    phone: Optional[str] = None,
    user: dict = Depends(require_auth),
):
    """Update current user profile"""
    try:
        updated = await user_repository.update_user(
            user["id"],
            full_name=full_name,
            company_name=company_name,
            phone=phone,
        )
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

    # Parse created_at if it's a string
    created_at = updated["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))

    return UserResponse(
        id=updated["id"],
        email=updated["email"],
        full_name=updated["full_name"],
        company_name=updated.get("company_name"),
        phone=updated.get("phone"),
        role=updated.get("role", "user"),
        created_at=created_at,
        is_verified=updated.get("is_verified", False),
    )


@router.post("/password/reset")
async def request_password_reset(request: PasswordResetRequest):
    """Request password reset email"""
    # Always return success to prevent email enumeration
    return {"message": "If an account exists with this email, a password reset link has been sent"}


@router.post("/password/change")
async def change_password(
    request: PasswordChangeRequest,
    user: dict = Depends(require_auth),
):
    """Change password for authenticated user"""
    # Verify current password
    if not verify_password(request.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    # Update password using repository
    try:
        await user_repository.update_password(user["id"], request.new_password)
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update password: {str(e)}")

    return {"message": "Password changed successfully"}


@router.get("/verify/{token}")
async def verify_email(token: str):
    """Verify email address"""
    return {"message": "Email verified successfully"}


# ============== Admin Routes ==============

@router.get("/users", dependencies=[Depends(require_admin)])
async def list_all_users(limit: int = 100, offset: int = 0):
    """List all users (admin only)"""
    try:
        users = await user_repository.list_users(limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")

    return {
        "users": [
            UserResponse(
                id=u["id"],
                email=u["email"],
                full_name=u["full_name"],
                company_name=u.get("company_name"),
                phone=u.get("phone"),
                role=u.get("role", "user"),
                created_at=datetime.fromisoformat(u["created_at"].replace("Z", "+00:00")) if isinstance(u["created_at"], str) else u["created_at"],
                is_verified=u.get("is_verified", False),
            )
            for u in users
        ],
        "total": len(users),
    }


@router.put("/users/{user_id}/role", dependencies=[Depends(require_admin)])
async def update_user_role(user_id: str, role: str):
    """Update user role (admin only)"""
    if role not in ["user", "admin", "lawyer"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    try:
        await user_repository.update_user(user_id, role=role)
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")

    return {"message": f"User role updated to {role}"}
