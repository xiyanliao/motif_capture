from pathlib import Path
from typing import Any
from importlib.metadata import PackageNotFoundError, version

from app.postprocess.types import RawNote


class EngineUnavailableError(RuntimeError):
    pass


class TranscriptionEngineError(RuntimeError):
    pass


class BasicPitchEngine:
    engine_name = "basic-pitch"

    def __init__(self) -> None:
        self.engine_version = "unknown"

    def transcribe(self, wav_path: str) -> list[RawNote]:
        predict = self._load_predict()

        try:
            _model_output, _midi_data, note_events = predict(wav_path)
        except Exception as exc:  # pragma: no cover - defensive wrapper around dependency
            raise TranscriptionEngineError(str(exc)) from exc

        raw_notes = [parse_note_event(event) for event in note_events]
        return [note for note in raw_notes if note.duration_sec > 0]

    def _load_predict(self):
        try:
            from basic_pitch.inference import predict
        except Exception as exc:
            raise EngineUnavailableError(
                "Basic Pitch is not installed or could not be imported."
            ) from exc

        try:
            self.engine_version = version("basic-pitch")
        except PackageNotFoundError:
            self.engine_version = "unknown"
        return predict


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
