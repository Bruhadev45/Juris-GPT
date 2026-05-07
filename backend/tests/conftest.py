"""
Pytest fixtures and test configuration
Provides shared test fixtures, mock data, and test utilities
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from faker import Faker

fake = Faker()

# Mock Supabase before importing app
mock_supabase_client = MagicMock()
mock_supabase_table = MagicMock()
mock_supabase_client.table.return_value = mock_supabase_table

# Patch Supabase client globally
with patch("app.database.supabase", mock_supabase_client):
    with patch("app.repositories.user_repository.supabase", mock_supabase_client):
        from app.main import app
        from app.repositories import user_repository


# ============== Event Loop Configuration ==============

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an event loop for the test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============== Test Client ==============

@pytest.fixture
def client() -> TestClient:
    """Create FastAPI test client"""
    # Create a test client - CSRF will be handled per test as needed
    return TestClient(app)


@pytest.fixture
def bypass_csrf(monkeypatch):
    """Bypass CSRF validation for tests"""
    # Patch validate_csrf_token to always return True
    monkeypatch.setattr("app.middleware.csrf.validate_csrf_token", lambda cookie, header: True)


# ============== Mock Supabase ==============

@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    mock = Mock()
    mock_table = Mock()
    mock.table.return_value = mock_table
    return mock


@pytest.fixture
def mock_supabase_response():
    """Mock Supabase response object"""
    mock = Mock()
    mock.data = []
    return mock


# ============== Mock User Data ==============

@pytest.fixture
def mock_user_data() -> dict:
    """Generate mock user data"""
    return {
        "id": fake.uuid4(),
        "email": fake.email(),
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lXF.5E.5E5E5",  # "password123"
        "full_name": fake.name(),
        "company_name": fake.company(),
        "phone": fake.phone_number(),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_verified": False,
    }


@pytest.fixture
def mock_admin_data() -> dict:
    """Generate mock admin user data"""
    return {
        "id": fake.uuid4(),
        "email": "admin@example.com",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lXF.5E.5E5E5",  # "password123"
        "full_name": "Admin User",
        "company_name": None,
        "phone": None,
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_verified": True,
    }


@pytest.fixture
def multiple_users() -> list[dict]:
    """Generate multiple mock users"""
    users = []
    for _ in range(5):
        users.append({
            "id": fake.uuid4(),
            "email": fake.email(),
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lXF.5E.5E5E5",
            "full_name": fake.name(),
            "company_name": fake.company(),
            "phone": fake.phone_number(),
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_verified": False,
        })
    return users


# ============== Auth Tokens ==============

@pytest.fixture
def auth_token(mock_user_data) -> str:
    """Generate JWT token for mock user"""
    from app.routes.auth import create_access_token
    return create_access_token(
        mock_user_data["id"],
        mock_user_data["email"],
        mock_user_data["role"]
    )


@pytest.fixture
def admin_token(mock_admin_data) -> str:
    """Generate JWT token for mock admin"""
    from app.routes.auth import create_access_token
    return create_access_token(
        mock_admin_data["id"],
        mock_admin_data["email"],
        mock_admin_data["role"]
    )


@pytest.fixture
def auth_headers(auth_token) -> dict:
    """Generate authorization headers with user token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def admin_headers(admin_token) -> dict:
    """Generate authorization headers with admin token"""
    return {"Authorization": f"Bearer {admin_token}"}


# ============== Repository Mocks ==============

@pytest.fixture
def mock_create_user():
    """Mock create_user function"""
    with patch.object(user_repository, "create_user", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def mock_get_user_by_id():
    """Mock get_user_by_id function"""
    with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def mock_get_user_by_email():
    """Mock get_user_by_email function"""
    with patch.object(user_repository, "get_user_by_email", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def mock_update_user():
    """Mock update_user function"""
    with patch.object(user_repository, "update_user", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def mock_update_password():
    """Mock update_password function"""
    with patch.object(user_repository, "update_password", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def mock_list_users():
    """Mock list_users function"""
    with patch.object(user_repository, "list_users", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def mock_delete_user():
    """Mock delete_user function"""
    with patch.object(user_repository, "delete_user", new_callable=AsyncMock) as mock:
        yield mock


# ============== Database Setup/Teardown ==============

@pytest.fixture(autouse=True)
async def reset_database():
    """Reset database state before each test"""
    # This will be called before each test
    yield
    # Cleanup after test if needed
    pass
