from app.schemas import MotifNote, MusicKey


PITCH_CLASS_NAMES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
]
MAJOR_SCALE = {0, 2, 4, 5, 7, 9, 11}
MINOR_SCALE = {0, 2, 3, 5, 7, 8, 10}


def detect_key(notes: list[MotifNote]) -> MusicKey:
    if not notes:
        return MusicKey(tonic="C", mode="unknown", confidence=0)

    histogram = [0.0] * 12
    for note in notes:
        histogram[note.pitch % 12] += max(note.durationBeat, 0.001)

    scores: list[tuple[float, int, str]] = []
    for tonic in range(12):
        scores.append((score_scale(histogram, tonic, MAJOR_SCALE), tonic, "major"))
        scores.append((score_scale(histogram, tonic, MINOR_SCALE), tonic, "minor"))

    scores.sort(reverse=True, key=lambda item: item[0])
    best_score, best_tonic, best_mode = scores[0]
    second_score = scores[1][0]
    total_weight = sum(histogram) or 1
    gap_confidence = max(0.0, (best_score - second_score) / total_weight)
    coverage_confidence = best_score / total_weight
    confidence = round(min(1.0, (coverage_confidence * 0.7) + gap_confidence), 3)

    if confidence < 0.35:
        return MusicKey(tonic=PITCH_CLASS_NAMES[best_tonic], mode="unknown", confidence=confidence)

    return MusicKey(
        tonic=PITCH_CLASS_NAMES[best_tonic],
        mode=best_mode,
        confidence=confidence,
    )


def score_scale(histogram: list[float], tonic: int, scale: set[int]) -> float:
    return sum(
        weight
        for pitch_class, weight in enumerate(histogram)
        if ((pitch_class - tonic) % 12) in scale
    )
