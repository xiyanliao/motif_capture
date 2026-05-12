import type { MotifNote } from "../motif/types";
import { roundBeat, sortNotes } from "../motif/editing";

export function retrograde(notes: MotifNote[], totalBeats: number): MotifNote[] {
  return sortNotes(
    notes.map((note) => ({
      ...note,
      startBeat: Math.max(0, roundBeat(totalBeats - note.startBeat - note.durationBeat))
    }))
  );
}
