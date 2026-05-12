import { describe, expect, it } from "vitest";
import {
  canAnalyzeAudio,
  canRunBasicPitch,
  productionApiStatusMessage
} from "../components/capture/captureState";

describe("capture action state", () => {
  it("requires audio and an API before enabling Basic Pitch", () => {
    expect(
      canRunBasicPitch({
        hasAudio: true,
        hasTranscriptionApi: false,
        isAnalyzing: false,
        isRecording: false
      })
    ).toBe(false);
    expect(
      canRunBasicPitch({
        hasAudio: true,
        hasTranscriptionApi: true,
        isAnalyzing: false,
        isRecording: false
      })
    ).toBe(true);
  });

  it("keeps generic analysis disabled while recording or without audio", () => {
    expect(
      canAnalyzeAudio({
        hasAudio: false,
        isAnalyzing: false,
        isRecording: false
      })
    ).toBe(false);
    expect(
      canAnalyzeAudio({
        hasAudio: true,
        isAnalyzing: false,
        isRecording: true
      })
    ).toBe(false);
  });

  it("shows production API configuration guidance only when needed", () => {
    expect(productionApiStatusMessage(true, false)).toContain("VITE_API_BASE_URL");
    expect(productionApiStatusMessage(true, true)).toBeNull();
    expect(productionApiStatusMessage(false, false)).toBeNull();
  });
});
