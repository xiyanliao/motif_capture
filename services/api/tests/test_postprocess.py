from app.postprocess.cleaning import merge_nearby_notes, remove_short_notes
from app.postprocess.key_detect import detect_key
from app.postprocess.monophonic import monophonicize
from app.postprocess.quantize import quantize_notes, seconds_to_beats
from app.postprocess.types import RawNote
from app.schemas import MotifNote


def test_remove_short_notes_filters_duration_and_confidence() -> None:
    notes = [
        RawNote(pitch=60, start_sec=0, end_sec=0.05, velocity=0.8, confidence=0.9),
        RawNote(pitch=62, start_sec=0.1, end_sec=0.3, velocity=0.8, confidence=0.2),
        RawNote(pitch=64, start_sec=0.4, end_sec=0.7, velocity=0.8, confidence=0.8),
    ]

    result = remove_short_notes(notes)

    assert [note.pitch for note in result] == [64]


def test_merge_nearby_notes_merges_same_pitch_gap() -> None:
    notes = [
        RawNote(pitch=60, start_sec=0, end_sec=0.2, velocity=0.5, confidence=0.7),
        RawNote(pitch=60, start_sec=0.24, end_sec=0.5, velocity=0.9, confidence=0.8),
    ]

    result = merge_nearby_notes(notes, merge_gap_sec=0.08)

    assert len(result) == 1
    assert result[0].pitch == 60
    assert result[0].start_sec == 0
    assert result[0].end_sec == 0.5
    assert result[0].confidence == 0.8


def test_monophonicize_keeps_high_confidence_overlap() -> None:
    notes = [
        RawNote(pitch=60, start_sec=0, end_sec=0.5, velocity=0.5, confidence=0.4),
        RawNote(pitch=64, start_sec=0.2, end_sec=0.7, velocity=0.5, confidence=0.9),
    ]

    result = monophonicize(notes)

    assert [note.pitch for note in result] == [64]


def test_seconds_to_beats_and_quantize_notes() -> None:
    raw_notes = [
        RawNote(pitch=60, start_sec=0.12, end_sec=0.5, velocity=0.8, confidence=0.9),
    ]

    motif_notes = seconds_to_beats(raw_notes, bpm=120)
    quantized = quantize_notes(motif_notes, "1/16")

    assert motif_notes[0].startBeat == 0.24
    assert quantized[0].startBeat == 0.25
    assert quantized[0].durationBeat == 0.75


def test_detect_key_basic_c_major_case() -> None:
    notes = [
        MotifNote(id="n1", pitch=60, startBeat=0, durationBeat=1, velocity=0.8),
        MotifNote(id="n2", pitch=64, startBeat=1, durationBeat=1, velocity=0.8),
        MotifNote(id="n3", pitch=67, startBeat=2, durationBeat=1, velocity=0.8),
        MotifNote(id="n4", pitch=72, startBeat=3, durationBeat=2, velocity=0.8),
    ]

    key = detect_key(notes)

    assert key.tonic == "C"
    assert key.mode == "major"
    assert key.confidence > 0.5
