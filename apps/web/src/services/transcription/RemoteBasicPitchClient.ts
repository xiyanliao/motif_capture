import type {
  ApiError,
  TranscriptionClient,
  TranscriptionOptions,
  TranscriptionResponse
} from "./contract";

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const API_UNCONFIGURED_MESSAGE =
  "Transcription API is not configured for this deployment.";

type ApiRuntimeEnv = {
  PROD?: boolean;
  VITE_API_BASE_URL?: string;
};

export class RemoteBasicPitchClient implements TranscriptionClient {
  constructor(private readonly apiBaseUrl: string | null = resolveApiBaseUrl()) {}

  async transcribe(
    file: Blob,
    options: TranscriptionOptions
  ): Promise<TranscriptionResponse> {
    if (!this.apiBaseUrl) {
      return {
        ok: false,
        error: {
          code: "API_UNCONFIGURED",
          message: API_UNCONFIGURED_MESSAGE,
          details: {
            env: "VITE_API_BASE_URL"
          }
        }
      };
    }

    const formData = new FormData();
    formData.append("file", file, getUploadName(file));
    appendOption(formData, "bpm", options.bpm);
    appendOption(formData, "quantizeGrid", options.quantizeGrid);
    appendOption(formData, "forceMonophonic", options.forceMonophonic);
    appendOption(formData, "keyHint", options.keyHint);
    appendOption(formData, "minNoteDurationMs", options.minNoteDurationMs);
    appendOption(formData, "mergeGapMs", options.mergeGapMs);
    appendOption(formData, "engine", options.engine);

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/transcribe`, {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as TranscriptionResponse;

      if (!response.ok && payload.ok) {
        return {
          ok: false,
          error: {
            code: "TRANSCRIPTION_FAILED",
            message: `Transcription request failed with HTTP ${response.status}.`,
            details: {}
          }
        };
      }

      return payload;
    } catch (error) {
      return {
        ok: false,
        error: toApiError(error)
      };
    }
  }
}

function appendOption(
  formData: FormData,
  key: string,
  value: string | number | boolean | undefined
): void {
  if (value !== undefined && value !== "") {
    formData.append(key, String(value));
  }
}

export function resolveApiBaseUrl(env: ApiRuntimeEnv = import.meta.env): string | null {
  const configured = env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  return env.PROD ? null : DEFAULT_API_BASE_URL;
}

function getUploadName(file: Blob): string {
  return file instanceof File && file.name ? file.name : "upload.wav";
}

function toApiError(error: unknown): ApiError {
  return {
    code: "TRANSCRIPTION_FAILED",
    message: error instanceof Error ? error.message : "Could not reach transcription API.",
    details: {}
  };
}
