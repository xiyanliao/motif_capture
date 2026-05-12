from fastapi.testclient import TestClient

from app.main import create_app


def test_health_endpoint_returns_engine_status() -> None:
    client = TestClient(create_app())

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "ok": True,
        "engine": "mock",
        "version": "0.0.0"
    }
