import { describe, expect, it } from "vitest";
import {
  addNote,
  deleteNote,
  moveNote,
  nudgeDuration,
  nudgePitch,
  nudgeStart,
  resizeNote
} from "../domain/motif/editing";
import type { MotifNote } from "../domain/motif/types";
import { mockMotif } from "../fixtures/mockMotif";

const notes: MotifNote[] = [
  {
    id: "a",
    pitch: 60,
    startBeat: 1,
    durationBeat: 0.5,
    velocity: 0.7
  }
];

describe("mock motif fixture", () => {
  it("contains enough notes for the Phase 1 editor surface", () => {
    expect(mockMotif.notes.length).toBeGreaterThanOrEqual(20);
  });
});

describe("motif editing operations", () => {
  it("moves pitch and start beat on the grid", () => {
    const result = moveNote(notes, "a", 2, 0.37);

    expect(result[0]).toMatchObject({
      pitch: 62,
      startBeat: 1.25
    });
  });

  it("resizes notes without going below one grid unit", () => {
    const result = resizeNote(notes, "a", -1);

    expect(result[0].durationBeat).toBe(0.25);
  });

  it("adds and deletes notes without mutating the original list", () => {
    const added = addNote(notes, 2.12, 64, "b");
    const deleted = deleteNote(added, "a");

    expect(notes).toHaveLength(1);
    expect(added).toHaveLength(2);
    expect(added[1]).toMatchObject({
      id: "b",
      pitch: 64,
      startBeat: 2
    });
    expect(deleted).toEqual([added[1]]);
  });

  it("supports mobile micro-adjustments", () => {
    const pitch = nudgePitch(notes, "a", -1);
    const start = nudgeStart(notes, "a", -0.25);
    const duration = nudgeDuration(notes, "a", 0.25);

    expect(pitch[0].pitch).toBe(59);
    expect(start[0].startBeat).toBe(0.75);
    expect(duration[0].durationBeat).toBe(0.75);
  });
});
