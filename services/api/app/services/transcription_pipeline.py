import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from app.engines.basic_pitch_engine import (
    BasicPitchEngine,
    EngineUnavailableError,
    TranscriptionEngineError,
)
from app.postprocess.pipeline import postprocess_raw_notes
from app.schemas import (
    Motif,
    MotifSource,
    TranscriptionData,
    TranscriptionOptions,
    TranscriptionSuccessResponse,
)
from app.services.mock_transcription import title_from_filename


class PostprocessError(RuntimeError):
    pass


def transcribe_with_basic_pitch(
    filename: str,
    content: bytes,
    options: TranscriptionOptions,
    engine: BasicPitchEngine | None = None,
) -> TranscriptionSuccessResponse:
    active_engine = engine or BasicPitchEngine()
    suffix = Path(filename or "upload.wav").suffix or ".wav"

    with tempfile.NamedTemporaryFile(
        suffix=suffix,
        dir=os.getenv("MOTIF_TMP_DIR") or None,
        delete=True,
    ) as audio_file:
        audio_file.write(content)
        audio_file.flush()
        raw_notes = active_engine.transcribe(audio_file.name)

    try:
        notes, key = postprocess_raw_notes(raw_notes, options)
    except Exception as exc:
        raise PostprocessError(str(exc)) from exc

    bpm = options.bpm or 96
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    duration_sec = max(
        [
            note.startSec + note.durationSec
            for note in notes
            if note.startSec is not None and note.durationSec is not None
        ],
        default=0,
    )

    motif = Motif(
        id=f"bp_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
        title=title_from_filename(filename),
        createdAt=now,
        updatedAt=now,
        durationSec=round(duration_sec, 3),
        bpm=bpm,
        timeSignature="4/4",
        key=key,
        notes=notes,
        tags=["basic-pitch"],
        source=MotifSource(
            type="upload",
            engine=active_engine.engine_name,
            engineVersion=active_engine.engine_version,
        ),
        versions=[],
    )

    return TranscriptionSuccessResponse(
        ok=True,
        data=TranscriptionData(motif=motif),
        warnings=[],
    )


__all__ = [
    "EngineUnavailableError",
    "PostprocessError",
    "TranscriptionEngineError",
    "transcribe_with_basic_pitch",
]
