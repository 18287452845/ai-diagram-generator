import pytest
from datetime import datetime
from app.models.diagram import Diagram, DiagramTypeEnum, AIProviderEnum


def test_diagram_creation(db_session, sample_diagram_data):
    """Test creating a diagram model"""
    diagram = Diagram(
        id="test-id-123",
        **sample_diagram_data
    )
    db_session.add(diagram)
    db_session.commit()
    db_session.refresh(diagram)

    assert diagram.id == "test-id-123"
    assert diagram.title == "Test Diagram"
    assert diagram.type == DiagramTypeEnum.FLOWCHART
    assert diagram.code == "graph TD\n    A[Start] --> B[End]"
    assert diagram.ai_provider == AIProviderEnum.CLAUDE
    assert isinstance(diagram.created_at, datetime)
    assert isinstance(diagram.updated_at, datetime)


def test_diagram_retrieval(db_session, sample_diagram_data):
    """Test retrieving a diagram from database"""
    diagram = Diagram(
        id="test-id-456",
        **sample_diagram_data
    )
    db_session.add(diagram)
    db_session.commit()

    retrieved = db_session.query(Diagram).filter(Diagram.id == "test-id-456").first()
    assert retrieved is not None
    assert retrieved.title == "Test Diagram"


def test_diagram_update(db_session, sample_diagram_data):
    """Test updating a diagram"""
    diagram = Diagram(
        id="test-id-789",
        **sample_diagram_data
    )
    db_session.add(diagram)
    db_session.commit()

    diagram.title = "Updated Title"
    diagram.code = "graph TD\n    A[Updated] --> B[End]"
    db_session.commit()
    db_session.refresh(diagram)

    assert diagram.title == "Updated Title"
    assert "Updated" in diagram.code


def test_diagram_deletion(db_session, sample_diagram_data):
    """Test deleting a diagram"""
    diagram = Diagram(
        id="test-id-delete",
        **sample_diagram_data
    )
    db_session.add(diagram)
    db_session.commit()

    db_session.delete(diagram)
    db_session.commit()

    retrieved = db_session.query(Diagram).filter(Diagram.id == "test-id-delete").first()
    assert retrieved is None




