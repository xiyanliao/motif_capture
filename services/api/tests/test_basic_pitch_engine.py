import sys
from types import ModuleType, SimpleNamespace

from app.engines.basic_pitch_engine import BasicPitchEngine, parse_note_event


def test_basic_pitch_engine_reuses_loaded_model(monkeypatch, tmp_path) -> None:
    from app.engines import basic_pitch_engine

    loaded_model_paths = []
    used_models = []

    class FakeModel:
        def __init__(self, model_path: str) -> None:
            loaded_model_paths.append(model_path)
            self.model_path = model_path

    def fake_predict(wav_path, model_or_model_path):
        used_models.append(model_or_model_path)
        return {}, None, [(0.0, 0.25, 60, 0.8, [])]

    fake_package = ModuleType("basic_pitch")
    fake_package.__path__ = []
    fake_inference = ModuleType("basic_pitch.inference")
    fake_inference.ICASSP_2022_MODEL_PATH = "cached-model.tflite"
    fake_inference.Model = FakeModel
    fake_inference.predict = fake_predict

    monkeypatch.setitem(sys.modules, "basic_pitch", fake_package)
    monkeypatch.setitem(sys.modules, "basic_pitch.inference", fake_inference)
    monkeypatch.setattr(basic_pitch_engine, "version", lambda _name: "0.test")
    monkeypatch.setattr(BasicPitchEngine, "_model", None)
    monkeypatch.setattr(BasicPitchEngine, "_predict", None)
    monkeypatch.setattr(BasicPitchEngine, "_engine_version", "unknown")

    audio_path = tmp_path / "sample.wav"
    audio_path.write_bytes(b"RIFF")

    first_engine = BasicPitchEngine()
    second_engine = BasicPitchEngine()

    assert first_engine.transcribe(str(audio_path))[0].pitch == 60
    assert second_engine.transcribe(str(audio_path))[0].pitch == 60

    assert loaded_model_paths == ["cached-model.tflite"]
    assert len(used_models) == 2
    assert used_models[0] is used_models[1]
    assert second_engine.engine_version == "0.test"


def test_parse_note_event_from_tuple() -> None:
    note = parse_note_event((0.1, 0.5, 60.2, 0.8, []))

    assert note.pitch == 60
    assert note.start_sec == 0.1
    assert note.end_sec == 0.5
    assert note.velocity == 0.8
    assert note.confidence == 0.8
    assert note.raw_pitch == 60.2


def test_parse_note_event_from_dict() -> None:
    note = parse_note_event(
        {
            "start_time_s": 0,
            "end_time_s": 0.25,
            "pitch_midi": 62,
            "amplitude": 0.7,
        }
    )

    assert note.pitch == 62
    assert note.duration_sec == 0.25


def test_parse_note_event_from_object() -> None:
    note = parse_note_event(
        SimpleNamespace(
            start_sec=0.2,
            end_sec=0.4,
            pitch=64,
            velocity=0.6,
        )
    )

    assert note.pitch == 64
    assert note.confidence == 0.6
