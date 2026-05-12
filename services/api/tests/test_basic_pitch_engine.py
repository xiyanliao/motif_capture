from types import SimpleNamespace

from app.engines.basic_pitch_engine import parse_note_event


def test_parse_note_event_from_tuple() -> None:
    note = parse_note_event((0.1, 0.5, 60.2, 0.8, []))

    assert note.pitch == 60
    assert note.start_sec == 0.1
    assert note.end_sec == 0.5
    assert note.velocity == 0.8
    assert note.confidence == 0.8
    assert note.raw_pitch == 60.2


def test_parse_note_event_from_dict() -> None:
    note = parse_note_event(
        {
            "start_time_s": 0,
            "end_time_s": 0.25,
            "pitch_midi": 62,
            "amplitude": 0.7,
        }
    )

    assert note.pitch == 62
    assert note.duration_sec == 0.25


def test_parse_note_event_from_object() -> None:
    note = parse_note_event(
        SimpleNamespace(
            start_sec=0.2,
            end_sec=0.4,
            pitch=64,
            velocity=0.6,
        )
    )

    assert note.pitch == 64
    assert note.confidence == 0.6
