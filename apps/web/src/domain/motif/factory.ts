import type { Motif } from "./types";

export function createEmptyMotif(id: string, title: string): Motif {
  const createdAt = new Date(0).toISOString();

  return {
    id,
    title,
    createdAt,
    updatedAt: createdAt,
    durationSec: 0,
    bpm: 96,
    timeSignature: "4/4",
    notes: [],
    tags: [],
    source: {
      type: "manual"
    },
    versions: []
  };
}
