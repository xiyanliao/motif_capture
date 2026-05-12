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


def test_cors_allows_configured_origin(monkeypatch) -> None:
    monkeypatch.setenv("MOTIF_CORS_ORIGINS", "https://motif.example.com")

    client = TestClient(create_app())
    response = client.options(
        "/api/health",
        headers={
            "Origin": "https://motif.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://motif.example.com"
