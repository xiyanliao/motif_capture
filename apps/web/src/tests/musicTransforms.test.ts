import { describe, expect, it } from "vitest";
import { gridToBeat, quantizeNotes } from "../domain/quantize/quantize";
import type { MotifNote } from "../domain/motif/types";
import { midiToPitchName } from "../domain/music/pitch";
import { invert, retrograde, stretchRhythm, transpose } from "../domain/transforms";
import { getTotalBeats } from "../services/playback/TonePlayback";

const notes: MotifNote[] = [
  {
    id: "a",
    pitch: 60,
    startBeat: 0.12,
    durationBeat: 0.37,
    velocity: 0.7
  },
  {
    id: "b",
    pitch: 64,
    startBeat: 0.51,
    durationBeat: 0.51,
    velocity: 0.8
  }
];

describe("pitch tools", () => {
  it("converts MIDI pitch to note name", () => {
    expect(midiToPitchName(60)).toBe("C4");
    expect(midiToPitchName(73)).toBe("C#5");
  });
});

describe("quantize", () => {
  it("converts supported grids to beats", () => {
    expect(gridToBeat("1/8")).toBe(0.5);
    expect(gridToBeat("1/16")).toBe(0.25);
    expect(gridToBeat("1/32")).toBe(0.125);
  });

  it("quantizes start and duration while preserving source notes", () => {
    const result = quantizeNotes(notes, "1/16");

    expect(result[0]).toMatchObject({
      startBeat: 0,
      durationBeat: 0.25
    });
    expect(result[1]).toMatchObject({
      startBeat: 0.5,
      durationBeat: 0.5
    });
    expect(notes[0].startBeat).toBe(0.12);
  });
});

describe("transforms", () => {
  it("transposes notes by semitones", () => {
    expect(transpose(notes, 2).map((note) => note.pitch)).toEqual([62, 66]);
  });

  it("inverts notes around an axis pitch", () => {
    expect(invert(notes, 62).map((note) => note.pitch)).toEqual([64, 60]);
  });

  it("retrogrades notes across a total duration", () => {
    const result = retrograde(
      [
        { ...notes[0], startBeat: 0, durationBeat: 0.5 },
        { ...notes[1], startBeat: 1, durationBeat: 0.25 }
      ],
      2
    );

    expect(result.map((note) => note.startBeat)).toEqual([0.75, 1.5]);
  });

  it("stretches rhythm by a positive factor", () => {
    const result = stretchRhythm(
      [{ ...notes[0], startBeat: 1, durationBeat: 0.5 }],
      2
    );

    expect(result[0]).toMatchObject({
      startBeat: 2,
      durationBeat: 1
    });
  });
});

describe("playback helpers", () => {
  it("gets total beats from note ends", () => {
    expect(getTotalBeats(notes)).toBe(1.02);
  });
});
