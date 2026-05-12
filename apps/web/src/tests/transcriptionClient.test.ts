import { afterEach, describe, expect, it, vi } from "vitest";
import { MockTranscriptionClient } from "../services/transcription/MockTranscriptionClient";
import { RemoteBasicPitchClient } from "../services/transcription/RemoteBasicPitchClient";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MockTranscriptionClient", () => {
  it("returns a cloned standard transcription response", async () => {
    const client = new MockTranscriptionClient();

    const response = await client.transcribe(new Blob(["mock"]), {
      bpm: 96,
      quantizeGrid: "1/16",
      forceMonophonic: true
    });

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.data.motif.notes.length).toBeGreaterThanOrEqual(20);
    }
  });
});

describe("RemoteBasicPitchClient", () => {
  it("posts multipart data to the transcription endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          motif: {
            id: "m1",
            title: "Remote",
            createdAt: "2026-05-12T00:00:00.000Z",
            updatedAt: "2026-05-12T00:00:00.000Z",
            durationSec: 0,
            bpm: 96,
            timeSignature: "4/4",
            notes: [],
            tags: [],
            versions: []
          }
        },
        warnings: []
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new RemoteBasicPitchClient("http://api.test");
    const response = await client.transcribe(new Blob(["audio"]), {
      bpm: 120,
      quantizeGrid: "1/16",
      forceMonophonic: true,
      engine: "basic-pitch"
    });

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/transcribe",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData)
      })
    );
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("engine")).toBe("basic-pitch");
  });
});
