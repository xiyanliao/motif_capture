import type { Motif } from "../../domain/motif/types";

export type QuantizeGrid = "off" | "1/8" | "1/16" | "1/32";
export type TranscriptionEngineId = "mock" | "basic-pitch";

export type TranscriptionOptions = {
  bpm?: number;
  quantizeGrid?: QuantizeGrid;
  forceMonophonic?: boolean;
  keyHint?: string;
  minNoteDurationMs?: number;
  mergeGapMs?: number;
  engine?: TranscriptionEngineId;
};

export type ApiErrorCode =
  | "INVALID_AUDIO"
  | "TRANSCRIPTION_FAILED"
  | "ENGINE_NOT_AVAILABLE"
  | "POSTPROCESS_FAILED";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type TranscriptionSuccessResponse = {
  ok: true;
  data: {
    motif: Motif;
  };
  warnings: string[];
};

export type TranscriptionErrorResponse = {
  ok: false;
  error: ApiError;
};

export type TranscriptionResponse =
  | TranscriptionSuccessResponse
  | TranscriptionErrorResponse;

export interface TranscriptionClient {
  transcribe(
    file: Blob,
    options: TranscriptionOptions
  ): Promise<TranscriptionResponse>;
}
