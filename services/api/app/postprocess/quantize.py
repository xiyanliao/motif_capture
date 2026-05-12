from typing import Literal

from app.postprocess.types import RawNote
from app.schemas import MotifNote

QuantizeGrid = Literal["off", "1/8", "1/16", "1/32"]


def grid_to_beat(grid: QuantizeGrid) -> float:
    if grid == "1/8":
        return 0.5
    if grid == "1/16":
        return 0.25
    if grid == "1/32":
        return 0.125
    return 0.0


def seconds_to_beats(
    notes: list[RawNote],
    bpm: float,
) -> list[MotifNote]:
    beat_per_second = bpm / 60

    return [
        MotifNote(
            id=f"n{index:02d}",
            pitch=round(note.pitch),
            startBeat=round(note.start_sec * beat_per_second, 3),
            durationBeat=max(0.001, round(note.duration_sec * beat_per_second, 3)),
            velocity=max(0.0, min(1.0, note.velocity)),
            confidence=note.confidence,
            startSec=round(note.start_sec, 3),
            durationSec=round(note.duration_sec, 3),
            rawPitch=note.raw_pitch,
        )
        for index, note in enumerate(notes, start=1)
    ]


def quantize_notes(notes: list[MotifNote], grid: QuantizeGrid) -> list[MotifNote]:
    if grid == "off":
        return sorted(notes, key=lambda note: (note.startBeat, note.pitch))

    grid_beat = grid_to_beat(grid)

    return sorted(
        [
            note.model_copy(
                update={
                    "startBeat": quantize_beat(note.startBeat, grid_beat),
                    "durationBeat": max(
                        grid_beat,
                        quantize_beat(note.durationBeat, grid_beat),
                    ),
                }
            )
            for note in notes
        ],
        key=lambda note: (note.startBeat, note.pitch),
    )


def quantize_beat(value: float, grid_beat: float) -> float:
    return round(round(value / grid_beat) * grid_beat, 3)
