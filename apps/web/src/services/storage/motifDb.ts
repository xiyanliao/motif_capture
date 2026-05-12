import Dexie, { type Table } from "dexie";
import type { Motif } from "../../domain/motif/types";

export type AudioBlobRecord = {
  id: string;
  motifId?: string;
  blob: Blob;
  createdAt: string;
};

export class MotifCaptureDb extends Dexie {
  motifs!: Table<Motif, string>;
  audioBlobs!: Table<AudioBlobRecord, string>;

  constructor(name = "motif_capture") {
    super(name);
    this.version(1).stores({
      motifs: "id, title, createdAt, updatedAt, *tags",
      audioBlobs: "id, motifId, createdAt"
    });
  }
}

export const motifDb = new MotifCaptureDb();
