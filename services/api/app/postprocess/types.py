from dataclasses import dataclass


@dataclass(frozen=True)
class RawNote:
    pitch: int
    start_sec: float
    end_sec: float
    velocity: float
    confidence: float | None = None
    raw_pitch: float | None = None

    @property
    def duration_sec(self) -> float:
        return max(0.0, self.end_sec - self.start_sec)
