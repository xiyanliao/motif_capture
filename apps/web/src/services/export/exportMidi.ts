import { Midi } from "@tonejs/midi";
import type { Motif } from "../../domain/motif/types";

export function motifToMidiBytes(motif: Motif): Uint8Array {
  const midi = new Midi();
  midi.header.setTempo(motif.bpm);

  const track = midi.addTrack();
  track.name = motif.title;

  motif.notes.forEach((note) => {
    track.addNote({
      midi: note.pitch,
      time: beatsToSeconds(note.startBeat, motif.bpm),
      duration: beatsToSeconds(note.durationBeat, motif.bpm),
      velocity: clampVelocity(note.velocity)
    });
  });

  return midi.toArray();
}

export function exportMidiBlob(motif: Motif): Blob {
  return new Blob([motifToMidiBytes(motif) as BlobPart], {
    type: "audio/midi"
  });
}

function beatsToSeconds(beats: number, bpm: number): number {
  return (beats * 60) / bpm;
}

function clampVelocity(velocity: number): number {
  return Math.min(1, Math.max(0, velocity));
}
