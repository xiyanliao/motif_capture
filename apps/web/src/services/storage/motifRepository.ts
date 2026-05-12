import type { Motif } from "../../domain/motif/types";
import { MotifCaptureDb, motifDb } from "./motifDb";

export type MotifRepository = {
  save(motif: Motif): Promise<Motif>;
  update(motif: Motif): Promise<Motif>;
  list(): Promise<Motif[]>;
  get(id: string): Promise<Motif | undefined>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<Motif>;
};

export function createMotifRepository(db: MotifCaptureDb): MotifRepository {
  return {
    async save(motif) {
      const nextMotif = touchMotif(motif);
      await db.motifs.put(nextMotif);
      return nextMotif;
    },

    async update(motif) {
      const nextMotif = touchMotif(motif);
      await db.motifs.put(nextMotif);
      return nextMotif;
    },

    async list() {
      const motifs = await db.motifs.toArray();
      return motifs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async get(id) {
      return db.motifs.get(id);
    },

    async delete(id) {
      await db.motifs.delete(id);
    },

    async duplicate(id) {
      const source = await db.motifs.get(id);
      if (!source) {
        throw new Error(`Motif ${id} was not found.`);
      }

      const now = new Date().toISOString();
      const copy: Motif = {
        ...source,
        id: createId("motif"),
        title: `${source.title} Copy`,
        createdAt: now,
        updatedAt: now,
        source: source.source ? { ...source.source } : undefined,
        key: source.key ? { ...source.key } : undefined,
        notes: source.notes.map((note) => ({ ...note })),
        tags: [...source.tags],
        versions: source.versions.map((version) => ({
          ...version,
          notes: version.notes.map((note) => ({ ...note }))
        }))
      };

      await db.motifs.put(copy);
      return copy;
    }
  };
}

export const motifRepository = createMotifRepository(motifDb);

function touchMotif(motif: Motif): Motif {
  const now = new Date().toISOString();
  return {
    ...motif,
    updatedAt: now,
    source: motif.source ? { ...motif.source } : undefined,
    key: motif.key ? { ...motif.key } : undefined,
    notes: motif.notes.map((note) => ({ ...note })),
    tags: [...motif.tags],
    versions: motif.versions.map((version) => ({
      ...version,
      notes: version.notes.map((note) => ({ ...note }))
    }))
  };
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}
