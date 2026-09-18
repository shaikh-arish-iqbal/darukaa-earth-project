"""
Tests for authentication endpoints: register, login, /me
"""


def test_register_success(client):
    """A new user can register with a name, email, and password."""
    response = client.post(
        "/auth/register",
        json={
            "name": "Alice",
            "email": "alice@example.com",
            "password": "secret123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert data["name"] == "Alice"
    assert "id" in data
    # Password must NOT appear in the response
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email(client):
    """Registering with an existing email returns 400."""
    client.post(
        "/auth/register",
        json={
            "name": "Alice",
            "email": "alice@example.com",
            "password": "secret123",
        },
    )
    # Try to register again with the same email
    response = client.post(
        "/auth/register",
        json={
            "name": "Alice 2",
            "email": "alice@example.com",
            "password": "otherpass",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login_success(client):
    """A registered user can log in and receive a JWT token."""
    client.post(
        "/auth/register",
        json={
            "name": "Bob",
            "email": "bob@example.com",
            "password": "mypassword",
        },
    )
    response = client.post(
        "/auth/login",
        json={
            "email": "bob@example.com",
            "password": "mypassword",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    """Login with wrong password returns 401."""
    client.post(
        "/auth/register",
        json={
            "name": "Carol",
            "email": "carol@example.com",
            "password": "correctpass",
        },
    )
    response = client.post(
        "/auth/login",
        json={
            "email": "carol@example.com",
            "password": "wrongpass",
        },
    )
    assert response.status_code == 401


def test_get_me_authenticated(client):
    """Authenticated users can get their profile via /auth/me."""
    client.post(
        "/auth/register",
        json={
            "name": "Dave",
            "email": "dave@example.com",
            "password": "pass123",
        },
    )
    login_resp = client.post(
        "/auth/login",
        json={
            "email": "dave@example.com",
            "password": "pass123",
        },
    )
    token = login_resp.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "dave@example.com"


def test_get_me_unauthenticated(client):
    """Accessing /auth/me without a token returns 403."""
    response = client.get("/auth/me")
    assert response.status_code == 403
