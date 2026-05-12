from app.postprocess.cleaning import merge_nearby_notes, remove_short_notes
from app.postprocess.key_detect import detect_key
from app.postprocess.monophonic import monophonicize
from app.postprocess.quantize import quantize_notes, seconds_to_beats
from app.postprocess.types import RawNote
from app.schemas import MotifNote, MusicKey, TranscriptionOptions

DEFAULT_BPM = 96
DEFAULT_GRID = "1/16"
MIN_NOTE_DURATION_SEC = 0.08
MERGE_GAP_SEC = 0.08
CONFIDENCE_THRESHOLD = 0.35


def postprocess_raw_notes(
    raw_notes: list[RawNote],
    options: TranscriptionOptions,
) -> tuple[list[MotifNote], MusicKey]:
    bpm = options.bpm or DEFAULT_BPM
    min_duration_sec = (options.minNoteDurationMs or int(MIN_NOTE_DURATION_SEC * 1000)) / 1000
    merge_gap_sec = (options.mergeGapMs or int(MERGE_GAP_SEC * 1000)) / 1000
    grid = options.quantizeGrid or DEFAULT_GRID

    cleaned_notes = remove_short_notes(
        raw_notes,
        min_duration_sec=min_duration_sec,
        confidence_threshold=CONFIDENCE_THRESHOLD,
    )
    merged_notes = merge_nearby_notes(cleaned_notes, merge_gap_sec=merge_gap_sec)
    melodic_notes = (
        monophonicize(merged_notes)
        if options.forceMonophonic is not False
        else sorted(merged_notes, key=lambda note: (note.start_sec, note.pitch))
    )
    motif_notes = seconds_to_beats(melodic_notes, bpm=bpm)
    quantized_notes = quantize_notes(motif_notes, grid=grid)
    return quantized_notes, detect_key(quantized_notes)
