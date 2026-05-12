from datetime import datetime, timezone
from pathlib import Path

from app.schemas import (
    Motif,
    MotifNote,
    MotifSource,
    TranscriptionOptions,
    TranscriptionSuccessResponse,
    TranscriptionData,
    MusicKey,
)


MOCK_PITCHES = [
    60, 62, 64, 67, 69, 67, 64, 62,
    60, 64, 65, 67, 72, 71, 69, 67,
    65, 64, 62, 60, 59, 60,
]

MOCK_DURATIONS = [
    0.5, 0.5, 0.75, 0.25, 1.0, 0.5, 0.5, 0.5,
    0.5, 0.5, 0.5, 0.75, 0.25, 1.0, 0.5, 0.5,
    0.5, 0.5, 0.75, 0.25, 0.5, 1.0,
]


def create_mock_transcription(
    filename: str,
    options: TranscriptionOptions,
) -> TranscriptionSuccessResponse:
    bpm = options.bpm or 96
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    notes = create_mock_notes(bpm)
    total_beats = max(note.startBeat + note.durationBeat for note in notes)
    title = title_from_filename(filename)

    motif = Motif(
        id=f"mock_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
        title=title,
        createdAt=now,
        updatedAt=now,
        durationSec=round(total_beats * 60 / bpm, 3),
        bpm=bpm,
        timeSignature="4/4",
        key=MusicKey(tonic="C", mode="major", confidence=0.72),
        notes=notes,
        tags=["mock", "phase-4"],
        source=MotifSource(
            type="upload",
            engine="mock-transcription",
            engineVersion="0.0.0",
        ),
        versions=[],
    )

    warnings = ["engine_unavailable_using_mock"]
    if options.quantizeGrid == "off":
        warnings.append("quantize_disabled")

    return TranscriptionSuccessResponse(
        ok=True,
        data=TranscriptionData(motif=motif),
        warnings=warnings,
    )


def create_mock_notes(bpm: float) -> list[MotifNote]:
    notes: list[MotifNote] = []
    start_beat = 0.0

    for index, (pitch, duration_beat) in enumerate(
        zip(MOCK_PITCHES, MOCK_DURATIONS, strict=True),
        start=1,
    ):
        notes.append(
            MotifNote(
                id=f"n{index:02d}",
                pitch=pitch,
                startBeat=start_beat,
                durationBeat=duration_beat,
                velocity=0.72 + (index % 5) * 0.03,
                confidence=0.7 + (index % 4) * 0.04,
                startSec=round(start_beat * 60 / bpm, 3),
                durationSec=round(duration_beat * 60 / bpm, 3),
            )
        )
        start_beat += duration_beat

    return notes


def title_from_filename(filename: str) -> str:
    stem = Path(filename or "uploaded motif").stem.strip()
    if not stem:
        return "Uploaded Motif"

    return stem.replace("_", " ").replace("-", " ").title()
