export const WAV_MIME_TYPE = "audio/wav";

export type InputLevelQuality = "quiet" | "usable" | "clipped";

export type SignalStats = {
  peak: number;
  rms: number;
};

const WAV_HEADER_BYTES = 44;
const PCM_BYTES_PER_SAMPLE = 2;
const MONO_CHANNELS = 1;
const PCM_FORMAT = 1;
const PCM_BITS_PER_SAMPLE = 16;
const MIN_USABLE_PEAK = 0.02;
const CLIPPED_PEAK = 0.98;

export function encodePcm16Wav(samples: Float32Array, sampleRate: number): Blob {
  const dataBytes = samples.length * PCM_BYTES_PER_SAMPLE;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataBytes);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, PCM_FORMAT, true);
  view.setUint16(22, MONO_CHANNELS, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * MONO_CHANNELS * PCM_BYTES_PER_SAMPLE, true);
  view.setUint16(32, MONO_CHANNELS * PCM_BYTES_PER_SAMPLE, true);
  view.setUint16(34, PCM_BITS_PER_SAMPLE, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  let offset = WAV_HEADER_BYTES;
  for (const sample of samples) {
    view.setInt16(offset, floatToPcm16(sample), true);
    offset += PCM_BYTES_PER_SAMPLE;
  }

  return new Blob([buffer], { type: WAV_MIME_TYPE });
}

export function mergeFloat32Chunks(chunks: Float32Array[]): Float32Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

export function calculateSignalStats(samples: Float32Array): SignalStats {
  if (samples.length === 0) {
    return { peak: 0, rms: 0 };
  }

  let peak = 0;
  let squareSum = 0;

  for (const sample of samples) {
    const absolute = Math.abs(sample);
    peak = Math.max(peak, absolute);
    squareSum += sample * sample;
  }

  return {
    peak: Math.min(1, peak),
    rms: Math.sqrt(squareSum / samples.length)
  };
}

export function classifyInputLevel(peak: number): InputLevelQuality {
  if (peak < MIN_USABLE_PEAK) {
    return "quiet";
  }

  if (peak >= CLIPPED_PEAK) {
    return "clipped";
  }

  return "usable";
}

export function inputLevelMessage(quality: InputLevelQuality): string | null {
  if (quality === "quiet") {
    return "Recording level is very low. Move closer or sing a little louder.";
  }

  if (quality === "clipped") {
    return "Recording level is clipping. Move back or sing a little softer.";
  }

  return null;
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function floatToPcm16(sample: number): number {
  const clamped = Math.max(-1, Math.min(1, sample));
  return clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
}
