import { afterEach, describe, expect, it, vi } from "vitest";
import { MockTranscriptionClient } from "../services/transcription/MockTranscriptionClient";
import {
  RemoteBasicPitchClient,
  resolveApiBaseUrl
} from "../services/transcription/RemoteBasicPitchClient";

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
      expect(response.data.motif.source?.engine).toBe("mock-transcription");
    }
  });
});

describe("RemoteBasicPitchClient", () => {
  it("does not return a success response when production API is unconfigured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(resolveApiBaseUrl({ PROD: false })).toBe("http://localhost:8000");
    expect(resolveApiBaseUrl({ PROD: true })).toBeNull();
    expect(
      resolveApiBaseUrl({
        PROD: true,
        VITE_API_BASE_URL: "/api"
      })
    ).toBeNull();
    expect(
      resolveApiBaseUrl(
        {
          PROD: true,
          VITE_API_BASE_URL: "https://motif-capture.pages.dev"
        },
        "https://motif-capture.pages.dev"
      )
    ).toBeNull();
    expect(
      resolveApiBaseUrl({
        PROD: true,
        VITE_API_BASE_URL: "https://api.example.com/"
      })
    ).toBe("https://api.example.com");

    const client = new RemoteBasicPitchClient(null);
    const response = await client.transcribe(new Blob(["audio"]), {
      engine: "basic-pitch"
    });
    const wouldEnterEditor = response.ok;

    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.code).toBe("API_UNCONFIGURED");
    }
    expect(wouldEnterEditor).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts multipart data to the transcription endpoint", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true })
      })
      .mockResolvedValueOnce({
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

    const client = new RemoteBasicPitchClient("http://api.test", {
      sleep: async () => undefined
    });
    const response = await client.transcribe(new Blob(["audio"]), {
      bpm: 120,
      quantizeGrid: "1/16",
      forceMonophonic: true,
      engine: "basic-pitch"
    });

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://api.test/api/health",
      expect.objectContaining({
        method: "GET"
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://api.test/api/transcribe",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData)
      })
    );
    const body = fetchMock.mock.calls[1][1].body as FormData;
    expect(body.get("engine")).toBe("basic-pitch");
  });

  it("retries cold-start network failures before uploading audio", async () => {
    const sleepMock = vi.fn(async () => undefined);
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true })
      })
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
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

    const client = new RemoteBasicPitchClient("http://api.test", {
      sleep: sleepMock,
      transcriptionRetryDelaysMs: [0],
      warmupRetryDelaysMs: [0]
    });
    const response = await client.transcribe(new Blob(["audio"]), {
      engine: "basic-pitch"
    });

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/health");
    expect(fetchMock.mock.calls[2][0]).toBe("http://api.test/api/transcribe");
    expect(sleepMock).toHaveBeenCalledTimes(2);
  });

  it("returns a clear unreachable error when the API never wakes", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const client = new RemoteBasicPitchClient("http://api.test", {
      sleep: async () => undefined,
      transcriptionRetryDelaysMs: [0],
      warmupRetryDelaysMs: [0, 0]
    });
    const response = await client.transcribe(new Blob(["audio"]), {
      engine: "basic-pitch"
    });

    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.error.code).toBe("API_UNREACHABLE");
      expect(response.error.message).toContain("still waking up");
    }
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
