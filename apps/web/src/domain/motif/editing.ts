import type { MotifNote } from "./types";

export const DEFAULT_GRID_BEAT = 0.25;
export const DEFAULT_NOTE_DURATION_BEAT = 0.5;

export type NotePatch = Partial<
  Pick<MotifNote, "pitch" | "startBeat" | "durationBeat" | "velocity">
>;

export function snapBeat(value: number, gridBeat = DEFAULT_GRID_BEAT): number {
  return roundBeat(Math.round(value / gridBeat) * gridBeat);
}

export function roundBeat(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function updateNote(
  notes: MotifNote[],
  noteId: string,
  patch: NotePatch
): MotifNote[] {
  return sortNotes(
    notes.map((note) =>
      note.id === noteId
        ? {
            ...note,
            ...patch
          }
        : note
    )
  );
}

export function moveNote(
  notes: MotifNote[],
  noteId: string,
  deltaPitch: number,
  deltaBeat: number,
  gridBeat = DEFAULT_GRID_BEAT
): MotifNote[] {
  return sortNotes(
    notes.map((note) => {
      if (note.id !== noteId) {
        return note;
      }

      return {
        ...note,
        pitch: clamp(note.pitch + deltaPitch, 0, 127),
        startBeat: Math.max(0, snapBeat(note.startBeat + deltaBeat, gridBeat))
      };
    })
  );
}

export function resizeNote(
  notes: MotifNote[],
  noteId: string,
  deltaBeat: number,
  gridBeat = DEFAULT_GRID_BEAT
): MotifNote[] {
  return sortNotes(
    notes.map((note) => {
      if (note.id !== noteId) {
        return note;
      }

      return {
        ...note,
        durationBeat: Math.max(
          gridBeat,
          snapBeat(note.durationBeat + deltaBeat, gridBeat)
        )
      };
    })
  );
}

export function addNote(
  notes: MotifNote[],
  startBeat: number,
  pitch: number,
  id: string,
  gridBeat = DEFAULT_GRID_BEAT
): MotifNote[] {
  const note: MotifNote = {
    id,
    pitch: clamp(Math.round(pitch), 0, 127),
    startBeat: Math.max(0, snapBeat(startBeat, gridBeat)),
    durationBeat: DEFAULT_NOTE_DURATION_BEAT,
    velocity: 0.72,
    confidence: 1
  };

  return sortNotes([...notes, note]);
}

export function deleteNote(notes: MotifNote[], noteId: string): MotifNote[] {
  return notes.filter((note) => note.id !== noteId);
}

export function nudgePitch(notes: MotifNote[], noteId: string, semitones: number) {
  return updateNoteById(notes, noteId, (note) => ({
    ...note,
    pitch: clamp(note.pitch + semitones, 0, 127)
  }));
}

export function nudgeStart(
  notes: MotifNote[],
  noteId: string,
  beats: number,
  gridBeat = DEFAULT_GRID_BEAT
) {
  return updateNoteById(notes, noteId, (note) => ({
    ...note,
    startBeat: Math.max(0, snapBeat(note.startBeat + beats, gridBeat))
  }));
}

export function nudgeDuration(
  notes: MotifNote[],
  noteId: string,
  beats: number,
  gridBeat = DEFAULT_GRID_BEAT
) {
  return updateNoteById(notes, noteId, (note) => ({
    ...note,
    durationBeat: Math.max(
      gridBeat,
      snapBeat(note.durationBeat + beats, gridBeat)
    )
  }));
}

function updateNoteById(
  notes: MotifNote[],
  noteId: string,
  updater: (note: MotifNote) => MotifNote
): MotifNote[] {
  return sortNotes(notes.map((note) => (note.id === noteId ? updater(note) : note)));
}

export function sortNotes(notes: MotifNote[]): MotifNote[] {
  return [...notes].sort((a, b) => {
    if (a.startBeat !== b.startBeat) {
      return a.startBeat - b.startBeat;
    }

    return a.pitch - b.pitch;
  });
}
