from app.postprocess.types import RawNote


def monophonicize(notes: list[RawNote]) -> list[RawNote]:
    result: list[RawNote] = []

    for note in sorted(notes, key=lambda item: (item.start_sec, item.end_sec)):
        if not result:
            result.append(note)
            continue

        previous = result[-1]
        if note.start_sec >= previous.end_sec:
            result.append(note)
            continue

        winner = choose_overlap_winner(previous, note)
        if winner is note:
            result[-1] = note

    return result


def choose_overlap_winner(first: RawNote, second: RawNote) -> RawNote:
    if first.confidence is not None and second.confidence is not None:
        if first.confidence != second.confidence:
            return first if first.confidence > second.confidence else second

    if first.duration_sec != second.duration_sec:
        return first if first.duration_sec > second.duration_sec else second

    return first if first.velocity >= second.velocity else second
