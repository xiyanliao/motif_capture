import type { MotifNote } from "../motif/types";
import { sortNotes } from "../motif/editing";
import { clampMidiPitch } from "../music/pitch";

export function transpose(notes: MotifNote[], semitones: number): MotifNote[] {
  return sortNotes(
    notes.map((note) => ({
      ...note,
      pitch: clampMidiPitch(note.pitch + semitones)
    }))
  );
}
