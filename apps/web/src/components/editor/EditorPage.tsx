import { useMemo, useState } from "react";
import {
  addNote,
  DEFAULT_GRID_BEAT,
  deleteNote,
  nudgeDuration,
  nudgePitch,
  nudgeStart
} from "../../domain/motif/editing";
import type { Motif, MotifNote } from "../../domain/motif/types";
import { PianoRoll } from "./PianoRoll";

type EditorPageProps = {
  initialMotif: Motif;
};

export function EditorPage({ initialMotif }: EditorPageProps) {
  const [motif, setMotif] = useState<Motif>(initialMotif);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    initialMotif.notes[0]?.id ?? null
  );

  const selectedNote = useMemo(
    () => motif.notes.find((note) => note.id === selectedNoteId) ?? null,
    [motif.notes, selectedNoteId]
  );

  function setNotes(notes: MotifNote[]) {
    setMotif((current) => ({
      ...current,
      notes,
      updatedAt: new Date().toISOString()
    }));
  }

  function handleDeleteNote(noteId: string) {
    setNotes(deleteNote(motif.notes, noteId));
    setSelectedNoteId((current) => (current === noteId ? null : current));
  }

  function handleAddAfterSelection() {
    const baseBeat = selectedNote
      ? selectedNote.startBeat + selectedNote.durationBeat
      : nextWholeBeat(motif.notes);
    const basePitch = selectedNote?.pitch ?? 60;
    const id = `n${Date.now().toString(36)}`;
    setNotes(addNote(motif.notes, baseBeat, basePitch, id));
    setSelectedNoteId(id);
  }

  function handleNudgePitch(semitones: number) {
    if (!selectedNoteId) {
      return;
    }
    setNotes(nudgePitch(motif.notes, selectedNoteId, semitones));
  }

  function handleNudgeStart(beats: number) {
    if (!selectedNoteId) {
      return;
    }
    setNotes(nudgeStart(motif.notes, selectedNoteId, beats));
  }

  function handleNudgeDuration(beats: number) {
    if (!selectedNoteId) {
      return;
    }
    setNotes(nudgeDuration(motif.notes, selectedNoteId, beats));
  }

  return (
    <main className="editor-shell">
      <header className="editor-header">
        <div>
          <p className="eyebrow">Mock Editor</p>
          <h1>{motif.title}</h1>
        </div>
        <div className="motif-meta" aria-label="Motif metadata">
          <span>{motif.key ? `${motif.key.tonic} ${motif.key.mode}` : "Key unknown"}</span>
          <span>{motif.bpm} BPM</span>
          <span>{motif.timeSignature}</span>
        </div>
      </header>

      <PianoRoll
        notes={motif.notes}
        selectedNoteId={selectedNoteId}
        onChangeNotes={setNotes}
        onSelectNote={setSelectedNoteId}
        onDeleteNote={handleDeleteNote}
      />

      <section className="editor-controls" aria-label="Note controls">
        <div className="selected-readout">
          <span>Selected</span>
          <strong>{selectedNote ? selectedNote.id : "None"}</strong>
          {selectedNote ? (
            <small>
              Pitch {selectedNote.pitch} · Beat {selectedNote.startBeat} · Len{" "}
              {selectedNote.durationBeat}
            </small>
          ) : (
            <small>No note selected</small>
          )}
        </div>

        <div className="control-bank">
          <button type="button" onClick={handleAddAfterSelection} title="Add note">
            +
          </button>
          <button
            type="button"
            onClick={() => selectedNoteId && handleDeleteNote(selectedNoteId)}
            disabled={!selectedNoteId}
            title="Delete selected note"
          >
            Del
          </button>
        </div>

        <div className="control-bank">
          <button
            type="button"
            onClick={() => handleNudgePitch(1)}
            disabled={!selectedNoteId}
            title="Pitch up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => handleNudgePitch(-1)}
            disabled={!selectedNoteId}
            title="Pitch down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => handleNudgeStart(-DEFAULT_GRID_BEAT)}
            disabled={!selectedNoteId}
            title="Move earlier"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => handleNudgeStart(DEFAULT_GRID_BEAT)}
            disabled={!selectedNoteId}
            title="Move later"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => handleNudgeDuration(DEFAULT_GRID_BEAT)}
            disabled={!selectedNoteId}
            title="Longer"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleNudgeDuration(-DEFAULT_GRID_BEAT)}
            disabled={!selectedNoteId}
            title="Shorter"
          >
            −
          </button>
        </div>
      </section>
    </main>
  );
}

function nextWholeBeat(notes: MotifNote[]): number {
  const endBeat = Math.max(0, ...notes.map((note) => note.startBeat + note.durationBeat));
  return Math.ceil(endBeat);
}
