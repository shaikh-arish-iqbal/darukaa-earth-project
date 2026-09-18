"""
Tests for project management endpoints.
"""


def _register_and_login(client, email="user@test.com", password="pass123"):
    """Helper to register + login and return the auth header."""
    client.post("/auth/register", json={"name": "Test User", "email": email, "password": password})
    resp = client.post("/auth/login", json={"email": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_project(client):
    """An authenticated user can create a project."""
    headers = _register_and_login(client)
    response = client.post("/projects", json={
        "name": "My Forest Project",
        "description": "Testing project creation",
    }, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Forest Project"
    assert "id" in data


def test_list_projects_empty(client):
    """A new user starts with no projects."""
    headers = _register_and_login(client)
    response = client.get("/projects", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_list_projects(client):
    """Created projects appear in the list."""
    headers = _register_and_login(client)
    client.post("/projects", json={"name": "Project A"}, headers=headers)
    client.post("/projects", json={"name": "Project B"}, headers=headers)

    response = client.get("/projects", headers=headers)
    assert response.status_code == 200
    names = [p["name"] for p in response.json()]
    assert "Project A" in names
    assert "Project B" in names


def test_get_project(client):
    """A specific project can be retrieved by ID."""
    headers = _register_and_login(client)
    created = client.post("/projects", json={"name": "Specific Project"}, headers=headers).json()

    response = client.get(f"/projects/{created['id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Specific Project"


def test_project_not_found(client):
    """Requesting a non-existent project returns 404."""
    headers = _register_and_login(client)
    response = client.get("/projects/00000000-0000-0000-0000-000000000000", headers=headers)
    assert response.status_code == 404


def test_projects_isolated_between_users(client):
    """Users cannot see each other's projects."""
    headers_a = _register_and_login(client, email="userA@test.com")
    headers_b = _register_and_login(client, email="userB@test.com")

    # User A creates a project
    created = client.post("/projects", json={"name": "User A's Project"}, headers=headers_a).json()

    # User B tries to access it
    response = client.get(f"/projects/{created['id']}", headers=headers_b)
    assert response.status_code == 404


def test_protected_endpoint_requires_auth(client):
    """Projects endpoints require authentication."""
    response = client.get("/projects")
    assert response.status_code == 403
