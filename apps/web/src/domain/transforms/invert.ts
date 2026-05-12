import type { MotifNote } from "../motif/types";
import { sortNotes } from "../motif/editing";
import { clampMidiPitch } from "../music/pitch";

export function invert(notes: MotifNote[], axisPitch: number): MotifNote[] {
  return sortNotes(
    notes.map((note) => ({
      ...note,
      pitch: clampMidiPitch(axisPitch - (note.pitch - axisPitch))
    }))
  );
}
