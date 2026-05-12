from app.postprocess.types import RawNote


def remove_short_notes(
    notes: list[RawNote],
    min_duration_sec: float = 0.08,
    confidence_threshold: float = 0.35,
) -> list[RawNote]:
    return [
        note
        for note in notes
        if note.duration_sec >= min_duration_sec
        and (note.confidence is None or note.confidence >= confidence_threshold)
    ]


def merge_nearby_notes(
    notes: list[RawNote],
    merge_gap_sec: float = 0.08,
    slide_duration_sec: float = 0.12,
) -> list[RawNote]:
    sorted_notes = sorted(notes, key=lambda note: (note.start_sec, note.end_sec, note.pitch))
    merged: list[RawNote] = []

    for note in sorted_notes:
        if not merged:
            merged.append(note)
            continue

        previous = merged[-1]
        gap = note.start_sec - previous.end_sec
        pitch_distance = abs(note.pitch - previous.pitch)
        can_merge_same = pitch_distance == 0 and gap <= merge_gap_sec
        can_merge_slide = (
            pitch_distance == 1
            and gap <= merge_gap_sec
            and min(note.duration_sec, previous.duration_sec) <= slide_duration_sec
        )

        if can_merge_same or can_merge_slide:
            merged[-1] = merge_pair(previous, note)
        else:
            merged.append(note)

    return merged


def merge_pair(first: RawNote, second: RawNote) -> RawNote:
    duration_total = max(first.duration_sec + second.duration_sec, 0.001)
    pitch = first.pitch if first.duration_sec >= second.duration_sec else second.pitch
    confidence_values = [
        confidence
        for confidence in (first.confidence, second.confidence)
        if confidence is not None
    ]

    return RawNote(
        pitch=pitch,
        start_sec=min(first.start_sec, second.start_sec),
        end_sec=max(first.end_sec, second.end_sec),
        velocity=(
            first.velocity * first.duration_sec + second.velocity * second.duration_sec
        )
        / duration_total,
        confidence=max(confidence_values) if confidence_values else None,
        raw_pitch=first.raw_pitch if first.raw_pitch is not None else second.raw_pitch,
    )
