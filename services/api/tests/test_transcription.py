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
            "engine": "mock",
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


def test_transcribe_accepts_basic_pitch_engine(monkeypatch) -> None:
    from app.routes import transcription
    from app.services.mock_transcription import create_mock_transcription

    calls = {}

    def transcribe_success(filename, content, options):
        calls["filename"] = filename
        calls["content"] = content
        calls["bpm"] = options.bpm
        return create_mock_transcription(filename, options)

    monkeypatch.setattr(transcription, "transcribe_with_basic_pitch", transcribe_success)

    client = TestClient(create_app())
    response = client.post(
        "/api/transcribe",
        files={"file": ("basic.wav", b"RIFFbasic", "audio/wav")},
        data={"engine": "basic-pitch", "bpm": "110"},
    )

    body = response.json()

    assert response.status_code == 200
    assert body["ok"] is True
    assert calls == {
        "filename": "basic.wav",
        "content": b"RIFFbasic",
        "bpm": 110,
    }


def test_transcribe_maps_basic_pitch_unavailable(monkeypatch) -> None:
    from app.engines.basic_pitch_engine import EngineUnavailableError
    from app.routes import transcription

    def raise_unavailable(*args, **kwargs):
        raise EngineUnavailableError("missing dependency")

    monkeypatch.setattr(transcription, "transcribe_with_basic_pitch", raise_unavailable)

    client = TestClient(create_app())
    response = client.post(
        "/api/transcribe",
        files={"file": ("hummed.wav", b"RIFFmock", "audio/wav")},
        data={"engine": "basic-pitch"},
    )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "ENGINE_NOT_AVAILABLE"
