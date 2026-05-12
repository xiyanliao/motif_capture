from fastapi.testclient import TestClient

from app.main import create_app


def test_transcribe_returns_standard_mock_motif_response() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/transcribe",
        files={"file": ("hummed.wav", b"RIFFmock", "audio/wav")},
        data={
            "bpm": "120",
            "quantizeGrid": "1/16",
            "forceMonophonic": "true",
        },
    )

    body = response.json()

    assert response.status_code == 200
    assert body["ok"] is True
    assert body["data"]["motif"]["bpm"] == 120
    assert body["data"]["motif"]["title"] == "Hummed"
    assert body["data"]["motif"]["source"]["engine"] == "mock-transcription"
    assert len(body["data"]["motif"]["notes"]) >= 20
    assert body["warnings"] == ["engine_unavailable_using_mock"]


def test_transcribe_rejects_empty_upload() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/transcribe",
        files={"file": ("empty.wav", b"", "audio/wav")},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_AUDIO"
