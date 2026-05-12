from app.schemas import Motif, TranscriptionSuccessResponse


def test_transcription_success_schema_uses_standard_motif_envelope() -> None:
    response = TranscriptionSuccessResponse.model_validate(
        {
            "ok": True,
            "data": {
                "motif": {
                    "id": "m1",
                    "title": "Draft",
                    "createdAt": "1970-01-01T00:00:00.000Z",
                    "updatedAt": "1970-01-01T00:00:00.000Z",
                    "durationSec": 0,
                    "bpm": 96,
                    "timeSignature": "4/4",
                    "notes": [],
                    "tags": [],
                    "source": {"type": "manual"},
                    "versions": []
                }
            },
            "warnings": []
        }
    )

    assert response.ok is True
    assert isinstance(response.data.motif, Motif)
    assert response.data.motif.source is not None
    assert response.data.motif.source.type == "manual"
