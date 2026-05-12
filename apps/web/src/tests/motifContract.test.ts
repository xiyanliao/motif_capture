import { describe, expect, it } from "vitest";
import { createEmptyMotif } from "../domain/motif/factory";
import type { TranscriptionResponse } from "../services/transcription/contract";

describe("Motif contract", () => {
  it("creates an MVP-safe empty motif", () => {
    const motif = createEmptyMotif("m1", "Draft");

    expect(motif).toMatchObject({
      id: "m1",
      title: "Draft",
      bpm: 96,
      timeSignature: "4/4",
      notes: [],
      tags: [],
      versions: []
    });
  });

  it("wraps transcription results in the standard API envelope", () => {
    const response = {
      ok: true,
      data: {
        motif: createEmptyMotif("m1", "Draft")
      },
      warnings: []
    } satisfies TranscriptionResponse;

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.data.motif.source?.type).toBe("manual");
    }
  });
});
