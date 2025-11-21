import pytest
from app.models.diagram import Diagram, DiagramTypeEnum, AIProviderEnum


def test_root_endpoint(client):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["message"] == "AI Diagram Generator API"


def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_diagram(client, sample_diagram_data):
    """Test creating a diagram via API"""
    response = client.post("/api/diagrams", json=sample_diagram_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == sample_diagram_data["title"]
    assert data["type"] == sample_diagram_data["type"]
    assert "id" in data
    assert "created_at" in data


def test_get_diagrams(client, db_session, sample_diagram_data):
    """Test getting all diagrams"""
    # Create a diagram directly in database
    diagram = Diagram(
        id="test-get-all",
        **sample_diagram_data
    )
    db_session.add(diagram)
    db_session.commit()

    response = client.get("/api/diagrams")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_diagram_by_id(client, db_session, sample_diagram_data):
    """Test getting a diagram by ID"""
    # Create a diagram directly in database
    diagram = Diagram(
        id="test-get-by-id",
        **sample_diagram_data
    )
    db_session.add(diagram)
    db_session.commit()

    response = client.get("/api/diagrams/test-get-by-id")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "test-get-by-id"
    assert data["title"] == sample_diagram_data["title"]


def test_get_nonexistent_diagram(client):
    """Test getting a non-existent diagram"""
    response = client.get("/api/diagrams/nonexistent-id")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_update_diagram(client, db_session, sample_diagram_data):
    """Test updating a diagram"""
    # Create a diagram directly in database
    diagram = Diagram(
        id="test-update",
        **sample_diagram_data
    )
    db_session.add(diagram)
    db_session.commit()

    update_data = {
        "title": "Updated Title",
        "code": "graph TD\n    A[Updated] --> B[End]"
    }
    response = client.put("/api/diagrams/test-update", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert "Updated" in data["code"]


def test_delete_diagram(client, db_session, sample_diagram_data):
    """Test deleting a diagram"""
    # Create a diagram directly in database
    diagram = Diagram(
        id="test-delete",
        **sample_diagram_data
    )
    db_session.add(diagram)
    db_session.commit()

    response = client.delete("/api/diagrams/test-delete")
    assert response.status_code == 200
    assert "deleted" in response.json()["message"].lower()

    # Verify it's deleted
    get_response = client.get("/api/diagrams/test-delete")
    assert get_response.status_code == 404


def test_create_diagram_validation(client):
    """Test diagram creation with invalid data"""
    invalid_data = {
        "title": "",  # Empty title should fail
        "type": "flowchart",
        "code": "graph TD\n    A --> B"
    }
    response = client.post("/api/diagrams", json=invalid_data)
    # Should fail validation (400 or 422)
    assert response.status_code in [400, 422]




