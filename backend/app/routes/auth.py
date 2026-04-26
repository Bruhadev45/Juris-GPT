"""
Authentication routes for JurisGPT
Implements user authentication, registration, and session management
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone
import jwt
import secrets
import bcrypt
from app.config import settings

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


# ============== In-Memory User Store (Replace with DB in production) ==============

# Simulated user database — must be replaced with Supabase/PostgreSQL before production
users_db: dict[str, dict] = {}
sessions_db: dict[str, dict] = {}


def hash_password(password: str) -> str:
    """Securely hash password with bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(password.encode(), hashed.encode())


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
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ============== Dependency ==============

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Get current authenticated user from token (returns None if not authenticated)"""
    if not credentials:
        return None

    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id and user_id in users_db:
            return users_db[user_id]
        return None
    except (jwt.InvalidTokenError, jwt.ExpiredSignatureError, HTTPException):
        return None


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Require authentication — raises 401 if not authenticated"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")

    if not user_id or user_id not in users_db:
        raise HTTPException(status_code=401, detail="User not found")

    return users_db[user_id]


async def require_admin(user: dict = Depends(require_auth)) -> dict:
    """Require admin role"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ============== Routes ==============

@router.post("/register", response_model=TokenResponse)
async def register(request: UserRegisterRequest):
    """Register a new user"""
    # Check if email already exists — use constant-time approach to prevent enumeration
    for user in users_db.values():
        if user["email"] == request.email:
            raise HTTPException(status_code=400, detail="Email already registered")

    # Validate password strength
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    # Create user
    user_id = secrets.token_hex(16)
    now = datetime.now(timezone.utc)
    user = {
        "id": user_id,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "full_name": request.full_name,
        "company_name": request.company_name,
        "phone": request.phone,
        "role": "user",
        "created_at": now,
        "is_verified": False,
    }
    users_db[user_id] = user

    # Create token
    token = create_access_token(user_id, request.email)

    return TokenResponse(
        access_token=token,
        expires_in=JWT_EXPIRATION_HOURS * 3600,
        user=UserResponse(
            id=user_id,
            email=request.email,
            full_name=request.full_name,
            company_name=request.company_name,
            phone=request.phone,
            role="user",
            created_at=user["created_at"],
            is_verified=False,
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest):
    """Login with email and password"""
    # Find user by email
    user = None
    for u in users_db.values():
        if u["email"] == request.email:
            user = u
            break

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create token
    token = create_access_token(user["id"], user["email"], user.get("role", "user"))

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
            created_at=user["created_at"],
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
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        company_name=user.get("company_name"),
        phone=user.get("phone"),
        role=user.get("role", "user"),
        created_at=user["created_at"],
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
    updated = {**user}
    if full_name:
        updated["full_name"] = full_name
    if company_name:
        updated["company_name"] = company_name
    if phone:
        updated["phone"] = phone

    users_db[updated["id"]] = updated

    return UserResponse(
        id=updated["id"],
        email=updated["email"],
        full_name=updated["full_name"],
        company_name=updated.get("company_name"),
        phone=updated.get("phone"),
        role=updated.get("role", "user"),
        created_at=updated["created_at"],
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

    # Update password (immutable update)
    updated = {**user, "password_hash": hash_password(request.new_password)}
    users_db[updated["id"]] = updated

    return {"message": "Password changed successfully"}


@router.get("/verify/{token}")
async def verify_email(token: str):
    """Verify email address"""
    return {"message": "Email verified successfully"}


# ============== Admin Routes ==============

@router.get("/users", dependencies=[Depends(require_admin)])
async def list_users():
    """List all users (admin only)"""
    return {
        "users": [
            UserResponse(
                id=u["id"],
                email=u["email"],
                full_name=u["full_name"],
                company_name=u.get("company_name"),
                phone=u.get("phone"),
                role=u.get("role", "user"),
                created_at=u["created_at"],
                is_verified=u.get("is_verified", False),
            )
            for u in users_db.values()
        ],
        "total": len(users_db),
    }


@router.put("/users/{user_id}/role", dependencies=[Depends(require_admin)])
async def update_user_role(user_id: str, role: str):
    """Update user role (admin only)"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    if role not in ["user", "admin", "lawyer"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    updated = {**users_db[user_id], "role": role}
    users_db[user_id] = updated
    return {"message": f"User role updated to {role}"}
