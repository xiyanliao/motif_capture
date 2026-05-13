from pathlib import Path
from threading import Lock
from typing import Any
from importlib.metadata import PackageNotFoundError, version

from app.postprocess.types import RawNote


class EngineUnavailableError(RuntimeError):
    pass


class TranscriptionEngineError(RuntimeError):
    pass


class BasicPitchEngine:
    engine_name = "basic-pitch"
    _load_lock = Lock()
    _predict_lock = Lock()
    _model: Any | None = None
    _predict: Any | None = None
    _engine_version = "unknown"

    def __init__(self) -> None:
        self.engine_version = self._engine_version

    def transcribe(self, wav_path: str) -> list[RawNote]:
        predict, model = self._load_predict_and_model()
        self.engine_version = self._engine_version

        try:
            with self._predict_lock:
                _model_output, _midi_data, note_events = predict(
                    wav_path,
                    model_or_model_path=model,
                )
        except Exception as exc:  # pragma: no cover - defensive wrapper around dependency
            raise TranscriptionEngineError(str(exc)) from exc

        raw_notes = [parse_note_event(event) for event in note_events]
        return [note for note in raw_notes if note.duration_sec > 0]

    @classmethod
    def warm_up(cls) -> str:
        cls._load_predict_and_model()
        return cls._engine_version

    @classmethod
    def _load_predict_and_model(cls):
        if cls._predict is not None and cls._model is not None:
            return cls._predict, cls._model

        with cls._load_lock:
            if cls._predict is not None and cls._model is not None:
                return cls._predict, cls._model

            try:
                from basic_pitch.inference import ICASSP_2022_MODEL_PATH, Model, predict
            except Exception as exc:
                raise EngineUnavailableError(
                    "Basic Pitch is not installed or could not be imported."
                ) from exc

            try:
                cls._model = Model(ICASSP_2022_MODEL_PATH)
            except Exception as exc:
                raise EngineUnavailableError(
                    "Basic Pitch model could not be loaded in this environment."
                ) from exc

            cls._predict = predict
            cls._engine_version = get_basic_pitch_version()
            return cls._predict, cls._model


def get_basic_pitch_version() -> str:
    try:
        return version("basic-pitch")
    except PackageNotFoundError:
        return "unknown"


def parse_note_event(event: Any) -> RawNote:
    if isinstance(event, dict):
        return RawNote(
            pitch=round(get_first(event, "pitch_midi", "pitch", "midi")),
            start_sec=float(get_first(event, "start_time_s", "start_sec", "start")),
            end_sec=float(get_first(event, "end_time_s", "end_sec", "end")),
            velocity=float(get_first(event, "amplitude", "velocity", default=0.8)),
            confidence=float(get_first(event, "confidence", "amplitude", default=0.8)),
            raw_pitch=float(get_first(event, "pitch_midi", "pitch", "midi")),
        )

    if isinstance(event, (list, tuple)):
        if len(event) < 4:
            raise TranscriptionEngineError(f"Unsupported note event: {event!r}")
        start_sec, end_sec, pitch, amplitude = event[:4]
        return RawNote(
            pitch=round(float(pitch)),
            start_sec=float(start_sec),
            end_sec=float(end_sec),
            velocity=float(amplitude),
            confidence=float(amplitude),
            raw_pitch=float(pitch),
        )

    pitch = get_attr_first(event, "pitch_midi", "pitch", "midi")
    start_sec = get_attr_first(event, "start_time_s", "start_sec", "start")
    end_sec = get_attr_first(event, "end_time_s", "end_sec", "end")
    amplitude = get_attr_first(event, "amplitude", "velocity", default=0.8)

    return RawNote(
        pitch=round(float(pitch)),
        start_sec=float(start_sec),
        end_sec=float(end_sec),
        velocity=float(amplitude),
        confidence=float(amplitude),
        raw_pitch=float(pitch),
    )


def get_first(data: dict[str, Any], *keys: str, default: Any | None = None) -> Any:
    for key in keys:
        if key in data:
            return data[key]
    if default is not None:
        return default
    raise TranscriptionEngineError(f"Missing note event field, tried: {', '.join(keys)}")


def get_attr_first(event: Any, *names: str, default: Any | None = None) -> Any:
    for name in names:
        if hasattr(event, name):
            return getattr(event, name)
    if default is not None:
        return default
    raise TranscriptionEngineError(f"Unsupported note event: {event!r}")


def is_supported_audio_path(path: str) -> bool:
    return Path(path).suffix.lower() in {".wav", ".mp3", ".flac", ".ogg", ".m4a"}
