import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockMotif } from "../fixtures/mockMotif";
import { parseMotifJson, serializeMotifJson } from "../services/export/exportJson";
import { motifToMidiBytes } from "../services/export/exportMidi";
import { datedFilename, sanitizeFilename } from "../services/export/download";
import { MotifCaptureDb } from "../services/storage/motifDb";
import { createMotifRepository } from "../services/storage/motifRepository";

let db: MotifCaptureDb;

beforeEach(() => {
  db = new MotifCaptureDb(`motif_capture_test_${crypto.randomUUID()}`);
});

afterEach(async () => {
  await db.delete();
});

describe("JSON export", () => {
  it("round-trips motif JSON with an envelope", () => {
    const json = serializeMotifJson(mockMotif, "2026-05-12T00:00:00.000Z");
    const parsed = parseMotifJson(json);

    expect(parsed.id).toBe(mockMotif.id);
    expect(parsed.notes).toHaveLength(mockMotif.notes.length);
  });

  it("creates stable download names", () => {
    expect(sanitizeFilename(" Mock: Motif / 01 ")).toBe("Mock-Motif-01");
    expect(datedFilename("Mock Motif", "json", new Date("2026-05-12"))).toBe(
      "Mock-Motif-2026-05-12.json"
    );
  });
});

describe("MIDI export", () => {
  it("writes a standard MIDI header", () => {
    const bytes = motifToMidiBytes(mockMotif);
    const header = String.fromCharCode(...bytes.slice(0, 4));

    expect(header).toBe("MThd");
    expect(bytes.length).toBeGreaterThan(32);
  });
});

describe("motif repository", () => {
  it("saves, lists, gets, duplicates, and deletes motifs", async () => {
    const repository = createMotifRepository(db);

    const saved = await repository.save(mockMotif);
    const list = await repository.list();
    const fetched = await repository.get(saved.id);
    const copy = await repository.duplicate(saved.id);

    expect(list).toHaveLength(1);
    expect(fetched?.id).toBe(saved.id);
    expect(copy.id).not.toBe(saved.id);
    expect(copy.notes).toHaveLength(saved.notes.length);

    await repository.delete(saved.id);
    const afterDelete = await repository.list();

    expect(afterDelete.map((motif) => motif.id)).toEqual([copy.id]);
  });
});
