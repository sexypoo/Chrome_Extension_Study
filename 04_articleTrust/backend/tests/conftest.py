import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="session")
def client():
    """
    FastAPI 애플리케이션을 하나의 세션 동안만 기동.
    모델·토크나이저도 1회만 로드된다.
    """
    return TestClient(app)