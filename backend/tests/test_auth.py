"""
Authentication and authorization tests
Comprehensive test suite for user authentication, registration, and CRUD operations
"""

import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone

from app.repositories import (
    UserNotFoundError,
    UserAlreadyExistsError,
    hash_password,
    verify_password,
)


# ============== Repository CRUD Tests ==============

class TestPasswordUtilities:
    """Test password hashing and verification"""

    def test_hash_password_creates_valid_hash(self):
        """Test that password hashing creates a valid bcrypt hash"""
        password = "test_password_123"
        hashed = hash_password(password)

        assert hashed is not None
        assert isinstance(hashed, str)
        assert hashed.startswith("$2b$")
        assert len(hashed) > 50

    def test_hash_password_different_for_same_password(self):
        """Test that same password produces different hashes (salt)"""
        password = "test_password_123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        assert hash1 != hash2

    def test_verify_password_success(self):
        """Test successful password verification"""
        password = "test_password_123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_failure(self):
        """Test failed password verification"""
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_with_invalid_hash(self):
        """Test verification with invalid hash"""
        password = "test_password_123"
        invalid_hash = "not_a_valid_hash"

        assert verify_password(password, invalid_hash) is False


@pytest.mark.asyncio
class TestUserRepository:
    """Test user repository CRUD operations"""

    async def test_create_user_success(self, mock_user_data):
        """Test successful user creation"""
        from app.repositories import user_repository

        with patch.object(user_repository, "supabase") as mock_supabase:
            # Mock get_user_by_email to return None (user doesn't exist)
            with patch.object(user_repository, "get_user_by_email", new_callable=AsyncMock) as mock_get:
                mock_get.return_value = None

                # Mock Supabase insert response
                mock_response = AsyncMock()
                mock_response.data = [mock_user_data]
                mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response

                user = await user_repository.create_user(
                    email="test@example.com",
                    password="password123",
                    full_name="Test User",
                    company_name="Test Company",
                    phone="1234567890",
                )

                assert user is not None
                assert user["email"] == mock_user_data["email"]

    async def test_create_user_duplicate_email(self, mock_user_data):
        """Test user creation with duplicate email"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_email", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            with pytest.raises(UserAlreadyExistsError):
                await user_repository.create_user(
                    email=mock_user_data["email"],
                    password="password123",
                    full_name="Test User",
                )

    async def test_get_user_by_id_success(self, mock_user_data):
        """Test successful user retrieval by ID"""
        from app.repositories import user_repository

        with patch.object(user_repository, "supabase") as mock_supabase:
            mock_response = AsyncMock()
            mock_response.data = [mock_user_data]
            mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            user = await user_repository.get_user_by_id(mock_user_data["id"])

            assert user is not None
            assert user["id"] == mock_user_data["id"]

    async def test_get_user_by_id_not_found(self):
        """Test user retrieval by ID when user doesn't exist"""
        from app.repositories import user_repository

        with patch.object(user_repository, "supabase") as mock_supabase:
            mock_response = AsyncMock()
            mock_response.data = []
            mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            user = await user_repository.get_user_by_id("nonexistent_id")

            assert user is None

    async def test_get_user_by_email_success(self, mock_user_data):
        """Test successful user retrieval by email"""
        from app.repositories import user_repository

        with patch.object(user_repository, "supabase") as mock_supabase:
            mock_response = AsyncMock()
            mock_response.data = [mock_user_data]
            mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            user = await user_repository.get_user_by_email(mock_user_data["email"])

            assert user is not None
            assert user["email"] == mock_user_data["email"]

    async def test_get_user_by_email_not_found(self):
        """Test user retrieval by email when user doesn't exist"""
        from app.repositories import user_repository

        with patch.object(user_repository, "supabase") as mock_supabase:
            mock_response = AsyncMock()
            mock_response.data = []
            mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            user = await user_repository.get_user_by_email("nonexistent@example.com")

            assert user is None

    async def test_update_user_success(self, mock_user_data):
        """Test successful user update"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            with patch.object(user_repository, "supabase") as mock_supabase:
                updated_data = {**mock_user_data, "full_name": "Updated Name"}
                mock_response = AsyncMock()
                mock_response.data = [updated_data]
                mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response

                user = await user_repository.update_user(
                    mock_user_data["id"],
                    full_name="Updated Name"
                )

                assert user["full_name"] == "Updated Name"

    async def test_update_user_not_found(self):
        """Test user update when user doesn't exist"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None

            with pytest.raises(UserNotFoundError):
                await user_repository.update_user("nonexistent_id", full_name="New Name")

    async def test_update_password_success(self, mock_user_data):
        """Test successful password update"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            with patch.object(user_repository, "supabase") as mock_supabase:
                mock_response = AsyncMock()
                mock_response.data = [mock_user_data]
                mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response

                user = await user_repository.update_password(
                    mock_user_data["id"],
                    "new_password_123"
                )

                assert user is not None

    async def test_update_password_not_found(self):
        """Test password update when user doesn't exist"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None

            with pytest.raises(UserNotFoundError):
                await user_repository.update_password("nonexistent_id", "new_password")

    async def test_list_users_success(self, multiple_users):
        """Test successful user listing"""
        from app.repositories import user_repository

        with patch.object(user_repository, "supabase") as mock_supabase:
            mock_response = AsyncMock()
            mock_response.data = multiple_users
            mock_supabase.table.return_value.select.return_value.range.return_value.execute.return_value = mock_response

            users = await user_repository.list_users(limit=10, offset=0)

            assert len(users) == len(multiple_users)
            assert isinstance(users, list)

    async def test_list_users_pagination(self, multiple_users):
        """Test user listing with pagination"""
        from app.repositories import user_repository

        with patch.object(user_repository, "supabase") as mock_supabase:
            mock_response = AsyncMock()
            mock_response.data = multiple_users[:2]
            mock_supabase.table.return_value.select.return_value.range.return_value.execute.return_value = mock_response

            users = await user_repository.list_users(limit=2, offset=0)

            assert len(users) <= 2

    async def test_delete_user_success(self, mock_user_data):
        """Test successful user deletion"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            with patch.object(user_repository, "supabase") as mock_supabase:
                result = await user_repository.delete_user(mock_user_data["id"])

                assert result is True
                mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.assert_called_once()

    async def test_delete_user_not_found(self):
        """Test user deletion when user doesn't exist"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None

            result = await user_repository.delete_user("nonexistent_id")

            assert result is False


# ============== API Endpoint Tests ==============

class TestAuthenticationEndpoints:
    """Test authentication API endpoints"""

    def test_register_success(self, client, mock_user_data):
        """Test successful user registration"""
        from app.repositories import user_repository

        with patch.object(user_repository, "create_user", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_user_data

            response = client.post("/api/auth/register", json={
                "email": "test@example.com",
                "password": "password123",
                "full_name": "Test User",
                "company_name": "Test Company",
                "phone": "1234567890",
            })

            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert "user" in data

    def test_register_weak_password(self, client):
        """Test registration with weak password"""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "weak",
            "full_name": "Test User",
        })

        assert response.status_code == 400
        assert "at least 8 characters" in response.json()["detail"]

    def test_register_duplicate_email(self, client):
        """Test registration with duplicate email"""
        from app.repositories import user_repository

        with patch.object(user_repository, "create_user", new_callable=AsyncMock) as mock_create:
            mock_create.side_effect = UserAlreadyExistsError("Email already exists")

            response = client.post("/api/auth/register", json={
                "email": "existing@example.com",
                "password": "password123",
                "full_name": "Test User",
            })

            assert response.status_code == 400
            assert "already registered" in response.json()["detail"]

    def test_login_success(self, client, mock_user_data):
        """Test successful login"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_email", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            response = client.post("/api/auth/login", json={
                "email": mock_user_data["email"],
                "password": "password123",
            })

            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "user" in data

    def test_login_invalid_email(self, client):
        """Test login with invalid email"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_email", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None

            response = client.post("/api/auth/login", json={
                "email": "nonexistent@example.com",
                "password": "password123",
            })

            assert response.status_code == 401
            assert "Invalid email or password" in response.json()["detail"]

    def test_login_invalid_password(self, client, mock_user_data):
        """Test login with invalid password"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_email", new_callable=AsyncMock) as mock_get:
            # Create a user with a different password hash
            different_user = {**mock_user_data}
            different_user["password_hash"] = hash_password("different_password")
            mock_get.return_value = different_user

            response = client.post("/api/auth/login", json={
                "email": mock_user_data["email"],
                "password": "wrong_password",
            })

            assert response.status_code == 401
            assert "Invalid email or password" in response.json()["detail"]

    def test_get_current_user(self, client, mock_user_data, auth_headers):
        """Test getting current user info"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            response = client.get("/api/auth/me", headers=auth_headers)

            assert response.status_code == 200
            data = response.json()
            assert data["email"] == mock_user_data["email"]

    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without authentication"""
        response = client.get("/api/auth/me")

        assert response.status_code == 403

    def test_update_profile(self, client, mock_user_data, auth_headers):
        """Test updating user profile"""
        from app.repositories import user_repository

        updated_data = {**mock_user_data, "full_name": "Updated Name"}

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            with patch.object(user_repository, "update_user", new_callable=AsyncMock) as mock_update:
                mock_update.return_value = updated_data

                response = client.put(
                    "/api/auth/me",
                    headers=auth_headers,
                    params={"full_name": "Updated Name"}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["full_name"] == "Updated Name"

    def test_change_password_success(self, client, mock_user_data, auth_headers):
        """Test successful password change"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            with patch.object(user_repository, "update_password", new_callable=AsyncMock) as mock_update:
                mock_update.return_value = mock_user_data

                response = client.post(
                    "/api/auth/password/change",
                    headers=auth_headers,
                    json={
                        "current_password": "password123",
                        "new_password": "new_password_123",
                    }
                )

                assert response.status_code == 200
                assert "success" in response.json()["message"]

    def test_change_password_incorrect_current(self, client, mock_user_data, auth_headers):
        """Test password change with incorrect current password"""
        from app.repositories import user_repository

        # Create user with different password
        different_user = {**mock_user_data}
        different_user["password_hash"] = hash_password("different_password")

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = different_user

            response = client.post(
                "/api/auth/password/change",
                headers=auth_headers,
                json={
                    "current_password": "wrong_password",
                    "new_password": "new_password_123",
                }
            )

            assert response.status_code == 400
            assert "incorrect" in response.json()["detail"].lower()

    def test_logout(self, client, auth_headers):
        """Test logout endpoint"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = {"id": "test_id"}

            response = client.post("/api/auth/logout", headers=auth_headers)

            assert response.status_code == 200


# ============== Admin Endpoint Tests ==============

class TestAdminEndpoints:
    """Test admin-only endpoints"""

    def test_list_users_admin_success(self, client, admin_headers, multiple_users):
        """Test listing users as admin"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = {"id": "admin_id", "role": "admin"}

            with patch.object(user_repository, "list_users", new_callable=AsyncMock) as mock_list:
                mock_list.return_value = multiple_users

                response = client.get("/api/auth/users", headers=admin_headers)

                assert response.status_code == 200
                data = response.json()
                assert "users" in data
                assert len(data["users"]) == len(multiple_users)

    def test_list_users_non_admin_forbidden(self, client, auth_headers):
        """Test listing users as non-admin user"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = {"id": "user_id", "role": "user"}

            response = client.get("/api/auth/users", headers=auth_headers)

            assert response.status_code == 403

    def test_update_user_role_admin_success(self, client, admin_headers, mock_user_data):
        """Test updating user role as admin"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = {"id": "admin_id", "role": "admin"}

            with patch.object(user_repository, "update_user", new_callable=AsyncMock) as mock_update:
                mock_update.return_value = {**mock_user_data, "role": "lawyer"}

                response = client.put(
                    f"/api/auth/users/{mock_user_data['id']}/role",
                    headers=admin_headers,
                    params={"role": "lawyer"}
                )

                assert response.status_code == 200

    def test_update_user_role_invalid_role(self, client, admin_headers):
        """Test updating user role with invalid role"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = {"id": "admin_id", "role": "admin"}

            response = client.put(
                "/api/auth/users/some_id/role",
                headers=admin_headers,
                params={"role": "invalid_role"}
            )

            assert response.status_code == 400

    def test_update_user_role_non_admin_forbidden(self, client, auth_headers):
        """Test updating user role as non-admin"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = {"id": "user_id", "role": "user"}

            response = client.put(
                "/api/auth/users/some_id/role",
                headers=auth_headers,
                params={"role": "admin"}
            )

            assert response.status_code == 403


# ============== Integration Tests ==============

@pytest.mark.integration
class TestAuthIntegration:
    """Integration tests for complete auth workflows"""

    def test_register_login_flow(self, client, mock_user_data):
        """Test complete registration and login flow"""
        from app.repositories import user_repository

        # Register
        with patch.object(user_repository, "create_user", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_user_data

            register_response = client.post("/api/auth/register", json={
                "email": "test@example.com",
                "password": "password123",
                "full_name": "Test User",
            })

            assert register_response.status_code == 200

        # Login with same credentials
        with patch.object(user_repository, "get_user_by_email", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            login_response = client.post("/api/auth/login", json={
                "email": "test@example.com",
                "password": "password123",
            })

            assert login_response.status_code == 200

    def test_profile_update_flow(self, client, mock_user_data, auth_headers):
        """Test complete profile update flow"""
        from app.repositories import user_repository

        updated_data = {**mock_user_data, "full_name": "New Name", "company_name": "New Company"}

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            with patch.object(user_repository, "update_user", new_callable=AsyncMock) as mock_update:
                mock_update.return_value = updated_data

                # Update profile
                update_response = client.put(
                    "/api/auth/me",
                    headers=auth_headers,
                    params={"full_name": "New Name", "company_name": "New Company"}
                )

                assert update_response.status_code == 200

        # Get updated profile
        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = updated_data

            get_response = client.get("/api/auth/me", headers=auth_headers)

            assert get_response.status_code == 200
            data = get_response.json()
            assert data["full_name"] == "New Name"

    def test_password_change_flow(self, client, mock_user_data, auth_headers):
        """Test complete password change flow"""
        from app.repositories import user_repository

        with patch.object(user_repository, "get_user_by_id", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user_data

            with patch.object(user_repository, "update_password", new_callable=AsyncMock) as mock_update:
                mock_update.return_value = mock_user_data

                # Change password
                response = client.post(
                    "/api/auth/password/change",
                    headers=auth_headers,
                    json={
                        "current_password": "password123",
                        "new_password": "new_password_123",
                    }
                )

                assert response.status_code == 200
