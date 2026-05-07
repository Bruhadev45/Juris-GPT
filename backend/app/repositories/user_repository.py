"""
User repository for database operations
Implements data access layer for user management with Supabase backend
"""

from typing import Optional
from datetime import datetime, timezone
import secrets
import bcrypt
from app.database import supabase


# ============== Custom Exceptions ==============

class UserNotFoundError(Exception):
    """Raised when a user is not found in the database"""
    pass


class UserAlreadyExistsError(Exception):
    """Raised when attempting to create a user with an existing email"""
    pass


# ============== Password Utilities ==============

def hash_password(password: str) -> str:
    """
    Securely hash password with bcrypt

    Args:
        password: Plain text password

    Returns:
        Hashed password string
    """
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(password: str, hashed: str) -> bool:
    """
    Verify password against bcrypt hash

    Args:
        password: Plain text password
        hashed: Bcrypt hashed password

    Returns:
        True if password matches hash, False otherwise
    """
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False


# ============== User CRUD Operations ==============

async def create_user(
    email: str,
    password: str,
    full_name: str,
    company_name: Optional[str] = None,
    phone: Optional[str] = None,
    role: str = "user",
) -> dict:
    """
    Create a new user in the database

    Args:
        email: User email address (unique)
        password: Plain text password (will be hashed)
        full_name: User's full name
        company_name: Optional company name
        phone: Optional phone number
        role: User role (default: "user")

    Returns:
        Created user dict with all fields

    Raises:
        UserAlreadyExistsError: If email already exists
        Exception: For database errors
    """
    if not supabase:
        raise Exception("Supabase client not initialized")

    # Check if user already exists
    existing = await get_user_by_email(email)
    if existing:
        raise UserAlreadyExistsError(f"User with email {email} already exists")

    # Generate user ID and hash password
    user_id = secrets.token_hex(16)
    password_hash = hash_password(password)
    now = datetime.now(timezone.utc)

    # Prepare user data
    user_data = {
        "id": user_id,
        "email": email,
        "password_hash": password_hash,
        "full_name": full_name,
        "company_name": company_name,
        "phone": phone,
        "role": role,
        "created_at": now.isoformat(),
        "is_verified": False,
    }

    # Insert into database
    try:
        response = supabase.table("users").insert(user_data).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise Exception("Failed to create user: no data returned")
    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            raise UserAlreadyExistsError(f"User with email {email} already exists")
        raise Exception(f"Database error creating user: {str(e)}")


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """
    Get user by ID

    Args:
        user_id: User ID

    Returns:
        User dict if found, None otherwise

    Raises:
        Exception: For database errors
    """
    if not supabase:
        raise Exception("Supabase client not initialized")

    try:
        response = supabase.table("users").select("*").eq("id", user_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        raise Exception(f"Database error getting user by ID: {str(e)}")


async def get_user_by_email(email: str) -> Optional[dict]:
    """
    Get user by email address

    Args:
        email: User email address

    Returns:
        User dict if found, None otherwise

    Raises:
        Exception: For database errors
    """
    if not supabase:
        raise Exception("Supabase client not initialized")

    try:
        response = supabase.table("users").select("*").eq("email", email).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        raise Exception(f"Database error getting user by email: {str(e)}")


async def update_user(user_id: str, **fields) -> dict:
    """
    Update user fields

    Args:
        user_id: User ID
        **fields: Fields to update (full_name, company_name, phone, role, is_verified)

    Returns:
        Updated user dict

    Raises:
        UserNotFoundError: If user not found
        Exception: For database errors
    """
    if not supabase:
        raise Exception("Supabase client not initialized")

    # Verify user exists
    existing = await get_user_by_id(user_id)
    if not existing:
        raise UserNotFoundError(f"User with ID {user_id} not found")

    # Filter allowed fields
    allowed_fields = {"full_name", "company_name", "phone", "role", "is_verified"}
    update_data = {k: v for k, v in fields.items() if k in allowed_fields and v is not None}

    if not update_data:
        return existing

    try:
        response = supabase.table("users").update(update_data).eq("id", user_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise Exception("Failed to update user: no data returned")
    except Exception as e:
        raise Exception(f"Database error updating user: {str(e)}")


async def update_password(user_id: str, new_password: str) -> dict:
    """
    Update user password

    Args:
        user_id: User ID
        new_password: New plain text password (will be hashed)

    Returns:
        Updated user dict

    Raises:
        UserNotFoundError: If user not found
        Exception: For database errors
    """
    if not supabase:
        raise Exception("Supabase client not initialized")

    # Verify user exists
    existing = await get_user_by_id(user_id)
    if not existing:
        raise UserNotFoundError(f"User with ID {user_id} not found")

    # Hash new password
    password_hash = hash_password(new_password)

    try:
        response = supabase.table("users").update({"password_hash": password_hash}).eq("id", user_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise Exception("Failed to update password: no data returned")
    except Exception as e:
        raise Exception(f"Database error updating password: {str(e)}")


async def list_users(limit: int = 100, offset: int = 0) -> list[dict]:
    """
    List users with pagination

    Args:
        limit: Maximum number of users to return (default: 100)
        offset: Number of users to skip (default: 0)

    Returns:
        List of user dicts

    Raises:
        Exception: For database errors
    """
    if not supabase:
        raise Exception("Supabase client not initialized")

    try:
        response = supabase.table("users").select("*").range(offset, offset + limit - 1).execute()
        return response.data if response.data else []
    except Exception as e:
        raise Exception(f"Database error listing users: {str(e)}")


async def delete_user(user_id: str) -> bool:
    """
    Delete user by ID

    Args:
        user_id: User ID

    Returns:
        True if deleted, False if user not found

    Raises:
        Exception: For database errors
    """
    if not supabase:
        raise Exception("Supabase client not initialized")

    # Verify user exists
    existing = await get_user_by_id(user_id)
    if not existing:
        return False

    try:
        supabase.table("users").delete().eq("id", user_id).execute()
        return True
    except Exception as e:
        raise Exception(f"Database error deleting user: {str(e)}")
