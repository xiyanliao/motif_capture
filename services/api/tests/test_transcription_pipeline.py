from app.postprocess.types import RawNote
from app.schemas import TranscriptionOptions
from app.services.transcription_pipeline import transcribe_with_basic_pitch


class FakeEngine:
    engine_name = "fake-basic-pitch"
    engine_version = "test"

    def transcribe(self, wav_path: str) -> list[RawNote]:
        assert wav_path.endswith(".wav")
        return [
            RawNote(pitch=60, start_sec=0, end_sec=0.4, velocity=0.8, confidence=0.9),
            RawNote(pitch=64, start_sec=0.45, end_sec=0.8, velocity=0.8, confidence=0.9),
        ]


def test_transcribe_with_basic_pitch_builds_standard_motif() -> None:
    result = transcribe_with_basic_pitch(
        "idea.wav",
        b"RIFFmock",
        TranscriptionOptions(bpm=120, quantizeGrid="1/16", forceMonophonic=True),
        engine=FakeEngine(),
    )

    motif = result.data.motif

    assert result.ok is True
    assert motif.title == "Idea"
    assert motif.source is not None
    assert motif.source.engine == "fake-basic-pitch"
    assert len(motif.notes) == 2
    assert motif.notes[0].startBeat == 0
