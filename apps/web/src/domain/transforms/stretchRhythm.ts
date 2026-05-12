import type { MotifNote } from "../motif/types";
import { roundBeat, sortNotes } from "../motif/editing";

export function stretchRhythm(notes: MotifNote[], factor: number): MotifNote[] {
  if (factor <= 0) {
    throw new Error("Rhythm stretch factor must be greater than 0.");
  }

  return sortNotes(
    notes.map((note) => ({
      ...note,
      startBeat: roundBeat(note.startBeat * factor),
      durationBeat: roundBeat(note.durationBeat * factor)
    }))
  );
}
