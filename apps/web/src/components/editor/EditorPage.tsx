import { useEffect, useMemo, useRef, useState } from "react";
import { quantizeNotes } from "../../domain/quantize/quantize";
import { midiToPitchName } from "../../domain/music/pitch";
import {
  addNote,
  DEFAULT_GRID_BEAT,
  deleteNote,
  nudgeDuration,
  nudgePitch,
  nudgeStart
} from "../../domain/motif/editing";
import type { Motif, MotifNote } from "../../domain/motif/types";
import { invert, retrograde, stretchRhythm, transpose } from "../../domain/transforms";
import { datedFilename, triggerDownload } from "../../services/export/download";
import {
  exportJsonBlob,
  importMotifFromJsonFile
} from "../../services/export/exportJson";
import { exportMidiBlob } from "../../services/export/exportMidi";
import { getTotalBeats, TonePlayback } from "../../services/playback/TonePlayback";
import { PianoRoll } from "./PianoRoll";

type EditorPageProps = {
  initialMotif: Motif;
  onSaveMotif: (motif: Motif) => Promise<Motif>;
  onOpenLibrary: () => void;
  onImportMotif: (motif: Motif) => void;
};

export function EditorPage({
  initialMotif,
  onSaveMotif,
  onOpenLibrary,
  onImportMotif
}: EditorPageProps) {
  const [motif, setMotif] = useState<Motif>(initialMotif);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    initialMotif.notes[0]?.id ?? null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [playheadBeat, setPlayheadBeat] = useState(0);
  const [status, setStatus] = useState("Unsaved mock motif");
  const playbackRef = useRef<TonePlayback | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const selectedNote = useMemo(
    () => motif.notes.find((note) => note.id === selectedNoteId) ?? null,
    [motif.notes, selectedNoteId]
  );

  useEffect(() => {
    playbackRef.current = new TonePlayback();
    return () => playbackRef.current?.dispose();
  }, []);

  function setNotes(notes: MotifNote[]) {
    setMotif((current) => ({
      ...current,
      notes,
      updatedAt: new Date().toISOString()
    }));
  }

  function applyNotes(notes: MotifNote[]) {
    setNotes(notes);
    setPlayheadBeat(0);
  }

  function handleDeleteNote(noteId: string) {
    applyNotes(deleteNote(motif.notes, noteId));
    setSelectedNoteId((current) => (current === noteId ? null : current));
  }

  function handleAddAfterSelection() {
    const baseBeat = selectedNote
      ? selectedNote.startBeat + selectedNote.durationBeat
      : nextWholeBeat(motif.notes);
    const basePitch = selectedNote?.pitch ?? 60;
    const id = `n${Date.now().toString(36)}`;
    applyNotes(addNote(motif.notes, baseBeat, basePitch, id));
    setSelectedNoteId(id);
  }

  function handleNudgePitch(semitones: number) {
    if (!selectedNoteId) {
      return;
    }
    applyNotes(nudgePitch(motif.notes, selectedNoteId, semitones));
  }

  function handleNudgeStart(beats: number) {
    if (!selectedNoteId) {
      return;
    }
    applyNotes(nudgeStart(motif.notes, selectedNoteId, beats));
  }

  function handleNudgeDuration(beats: number) {
    if (!selectedNoteId) {
      return;
    }
    applyNotes(nudgeDuration(motif.notes, selectedNoteId, beats));
  }

  async function handlePlay() {
    if (motif.notes.length === 0) {
      return;
    }

    setIsPlaying(true);
    await playbackRef.current?.start(motif.notes, {
      bpm: motif.bpm,
      loop,
      onPlayheadBeat: setPlayheadBeat,
      onEnded: () => setIsPlaying(false)
    });
  }

  function handleStop() {
    playbackRef.current?.stop();
    setIsPlaying(false);
    setPlayheadBeat(0);
  }

  function handleLoopToggle() {
    const nextLoop = !loop;
    setLoop(nextLoop);

    if (isPlaying) {
      void playbackRef.current?.start(motif.notes, {
        bpm: motif.bpm,
        loop: nextLoop,
        onPlayheadBeat: setPlayheadBeat,
        onEnded: () => setIsPlaying(false)
      });
    }
  }

  function handleQuantize() {
    applyNotes(quantizeNotes(motif.notes, "1/16"));
  }

  function handleTranspose(semitones: number) {
    applyNotes(transpose(motif.notes, semitones));
  }

  function handleInvert() {
    const axisPitch = selectedNote?.pitch ?? 60;
    applyNotes(invert(motif.notes, axisPitch));
  }

  function handleRetrograde() {
    applyNotes(retrograde(motif.notes, getTotalBeats(motif.notes)));
  }

  function handleStretch(factor: number) {
    applyNotes(stretchRhythm(motif.notes, factor));
  }

  async function handleSave() {
    const savedMotif = await onSaveMotif(motif);
    setMotif(savedMotif);
    setStatus(`Saved ${savedMotif.title}`);
  }

  function handleExportJson() {
    triggerDownload(exportJsonBlob(motif), datedFilename(motif.title, "json"));
    setStatus(`Exported ${motif.title} JSON`);
  }

  function handleExportMidi() {
    triggerDownload(exportMidiBlob(motif), datedFilename(motif.title, "mid"));
    setStatus(`Exported ${motif.title} MIDI`);
  }

  async function handleImportJson(file: File | undefined) {
    if (!file) {
      return;
    }

    const importedMotif = await importMotifFromJsonFile(file);
    setMotif(importedMotif);
    setSelectedNoteId(importedMotif.notes[0]?.id ?? null);
    setPlayheadBeat(0);
    setStatus(`Imported ${importedMotif.title}`);
    onImportMotif(importedMotif);

    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
  }

  return (
    <main className="editor-shell">
      <header className="editor-header">
        <div>
          <p className="eyebrow">Editor</p>
          <h1>{motif.title}</h1>
        </div>
        <div className="editor-header-actions">
          <div className="motif-meta" aria-label="Motif metadata">
            <span>{motif.key ? `${motif.key.tonic} ${motif.key.mode}` : "Key unknown"}</span>
            <span>{motif.bpm} BPM</span>
            <span>{motif.timeSignature}</span>
          </div>
          <div className="top-action-bank">
            <button type="button" onClick={() => void handleSave()}>
              Save
            </button>
            <button type="button" onClick={onOpenLibrary}>
              Library
            </button>
            <button type="button" onClick={handleExportJson}>
              JSON
            </button>
            <button type="button" onClick={handleExportMidi}>
              MIDI
            </button>
            <button type="button" onClick={() => importInputRef.current?.click()}>
              Import
            </button>
            <input
              ref={importInputRef}
              className="visually-hidden"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void handleImportJson(event.currentTarget.files?.[0])}
            />
          </div>
        </div>
      </header>

      <PianoRoll
        notes={motif.notes}
        selectedNoteId={selectedNoteId}
        playheadBeat={playheadBeat}
        onChangeNotes={applyNotes}
        onSelectNote={setSelectedNoteId}
        onDeleteNote={handleDeleteNote}
      />

      <section className="editor-controls" aria-label="Note controls">
        <div className="selected-readout">
          <span>Selected</span>
          <strong>{selectedNote ? midiToPitchName(selectedNote.pitch) : "None"}</strong>
          {selectedNote ? (
            <small>
              {selectedNote.id} · Beat {selectedNote.startBeat} · Len {selectedNote.durationBeat}
            </small>
          ) : (
            <small>No note selected</small>
          )}
          <small>{status}</small>
        </div>

        <div className="control-bank transport-bank">
          <button
            type="button"
            onClick={isPlaying ? handleStop : () => void handlePlay()}
            title={isPlaying ? "Stop" : "Play"}
          >
            {isPlaying ? "■" : "▶"}
          </button>
          <button
            type="button"
            className={loop ? "button-active" : undefined}
            onClick={handleLoopToggle}
            title="Loop"
          >
            ↻
          </button>
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

        <div className="control-bank note-bank">
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

        <div className="control-bank transform-bank">
          <button type="button" onClick={handleQuantize} title="Quantize 1/16">
            Q
          </button>
          <button type="button" onClick={() => handleTranspose(1)} title="Transpose up">
            T+
          </button>
          <button type="button" onClick={() => handleTranspose(-1)} title="Transpose down">
            T-
          </button>
          <button type="button" onClick={handleInvert} title="Invert around selected pitch">
            Inv
          </button>
          <button type="button" onClick={handleRetrograde} title="Retrograde">
            Rev
          </button>
          <button type="button" onClick={() => handleStretch(0.5)} title="Compress rhythm">
            x.5
          </button>
          <button type="button" onClick={() => handleStretch(2)} title="Expand rhythm">
            x2
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
