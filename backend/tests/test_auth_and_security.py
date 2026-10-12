from datetime import datetime, timezone, timedelta
import jwt
from tests.conftest import create_test_jwt, DEV_SECRET


def test_unauthenticated_request_rejected(client):
    """Protected routes reject requests without Authorization header."""
    response = client.get("/api/v1/accounts")
    assert response.status_code == 401
    assert "Missing Authorization header" in response.json()["detail"]


def test_malformed_token_rejected(client):
    """Malformed tokens are rejected with 401."""
    headers = {"Authorization": "Bearer not-a-valid-jwt-token"}
    response = client.get("/api/v1/accounts", headers=headers)
    assert response.status_code == 401


def test_expired_token_rejected(client):
    """Expired tokens are rejected with 401."""
    expired_payload = {
        "sub": "user-123",
        "email": "user@example.com",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=10),
        "iat": datetime.now(timezone.utc) - timedelta(minutes=20),
    }
    expired_token = jwt.encode(expired_payload, DEV_SECRET, algorithm="HS256")
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/v1/accounts", headers=headers)
    assert response.status_code == 401
    assert "Token has expired" in response.json()["detail"]


def test_valid_token_authenticates_user(client):
    """Valid token authenticates and accesses user profile."""
    token = create_test_jwt(user_id="user-abc-123", email="user@privacy.org")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "user-abc-123"
    assert data["email"] == "user@privacy.org"

