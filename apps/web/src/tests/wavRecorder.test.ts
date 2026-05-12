import { describe, expect, it } from "vitest";
import {
  calculateSignalStats,
  classifyInputLevel,
  encodePcm16Wav,
  mergeFloat32Chunks
} from "../services/recording/wav";

describe("WAV recording utilities", () => {
  it("encodes mono Float32 samples as PCM16 WAV", async () => {
    const wav = encodePcm16Wav(new Float32Array([-1, 0, 1]), 44100);
    const view = new DataView(await wav.arrayBuffer());

    expect(readAscii(view, 0, 4)).toBe("RIFF");
    expect(readAscii(view, 8, 4)).toBe("WAVE");
    expect(readAscii(view, 12, 4)).toBe("fmt ");
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint16(34, true)).toBe(16);
    expect(readAscii(view, 36, 4)).toBe("data");
    expect(view.getUint32(40, true)).toBe(6);
    expect(view.getInt16(44, true)).toBe(-32768);
    expect(view.getInt16(46, true)).toBe(0);
    expect(view.getInt16(48, true)).toBe(32767);
  });

  it("merges chunks and calculates signal stats", () => {
    const merged = mergeFloat32Chunks([
      new Float32Array([0.25, -0.5]),
      new Float32Array([0.75])
    ]);
    const stats = calculateSignalStats(merged);

    expect(Array.from(merged)).toEqual([0.25, -0.5, 0.75]);
    expect(stats.peak).toBe(0.75);
    expect(stats.rms).toBeCloseTo(0.540, 2);
  });

  it("classifies quiet, usable, and clipped input levels", () => {
    expect(classifyInputLevel(0.01)).toBe("quiet");
    expect(classifyInputLevel(0.5)).toBe("usable");
    expect(classifyInputLevel(0.99)).toBe("clipped");
  });
});

function readAscii(view: DataView, offset: number, length: number): string {
  return Array.from({ length }, (_, index) =>
    String.fromCharCode(view.getUint8(offset + index))
  ).join("");
}
