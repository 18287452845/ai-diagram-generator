import os
import sys
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Mock AI services before importing to avoid initialization issues
sys.modules['app.services.ai.claude_service'] = MagicMock()
sys.modules['app.services.ai.openai_service'] = MagicMock()

# Create mock service instances
mock_claude_service = MagicMock()
mock_openai_service = MagicMock()

# Patch the service instances
with patch.dict('sys.modules', {
    'app.services.ai.claude_service': MagicMock(claude_service=mock_claude_service),
    'app.services.ai.openai_service': MagicMock(openai_service=mock_openai_service),
}):
    from app.core.database import Base, get_db
    from app.models.diagram import Diagram

# Import app after mocking
from app.main import app

# Patch the imported services in routes
import app.api.routes as routes_module
routes_module.claude_service = mock_claude_service
routes_module.openai_service = mock_openai_service

# Create test database (in-memory SQLite for testing)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_diagram_data():
    """Sample diagram data for testing"""
    return {
        "title": "Test Diagram",
        "type": "flowchart",
        "code": "graph TD\n    A[Start] --> B[End]",
        "ai_provider": "claude",
        "ai_prompt": "Create a simple flowchart",
    }

