import type {
  ApiError,
  TranscriptionClient,
  TranscriptionOptions,
  TranscriptionResponse
} from "./contract";

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const API_UNCONFIGURED_MESSAGE =
  "Transcription API is not configured for this deployment.";
const API_UNREACHABLE_MESSAGE =
  "The Basic Pitch API is still waking up or unreachable. Try again in a minute; for production, use an always-on backend and confirm CORS allows this site.";
const DEFAULT_WARMUP_RETRY_DELAYS_MS = [2000, 5000, 10000, 20000, 30000];
const DEFAULT_TRANSCRIPTION_RETRY_DELAYS_MS = [3000, 10000, 20000];
const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

type ApiRuntimeEnv = {
  PROD?: boolean;
  VITE_API_BASE_URL?: string;
};

type RemoteBasicPitchClientConfig = {
  sleep?: (delayMs: number) => Promise<void>;
  transcriptionRetryDelaysMs?: number[];
  warmupRetryDelaysMs?: number[];
};

class TransientApiError extends Error {
  constructor(
    message: string,
    readonly details: Record<string, unknown> = {}
  ) {
    super(message);
  }
}

export class RemoteBasicPitchClient implements TranscriptionClient {
  private readonly sleep: (delayMs: number) => Promise<void>;
  private readonly transcriptionRetryDelaysMs: number[];
  private readonly warmupRetryDelaysMs: number[];

  constructor(
    private readonly apiBaseUrl: string | null = resolveApiBaseUrl(),
    config: RemoteBasicPitchClientConfig = {}
  ) {
    this.sleep = config.sleep ?? delay;
    this.transcriptionRetryDelaysMs =
      config.transcriptionRetryDelaysMs ?? DEFAULT_TRANSCRIPTION_RETRY_DELAYS_MS;
    this.warmupRetryDelaysMs =
      config.warmupRetryDelaysMs ?? DEFAULT_WARMUP_RETRY_DELAYS_MS;
  }

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

    const warmupError = await this.warmUpApi();
    if (warmupError) {
      return {
        ok: false,
        error: warmupError
      };
    }

    return this.postTranscriptionWithRetry(file, options);
  }

  private async warmUpApi(): Promise<ApiError | null> {
    let lastError: TransientApiError | null = null;
    const healthUrl = `${this.apiBaseUrl}/api/health`;

    for (let attempt = 0; attempt <= this.warmupRetryDelaysMs.length; attempt += 1) {
      try {
        const response = await fetch(healthUrl, {
          method: "GET",
          cache: "no-store"
        });

        if (response.ok) {
          return null;
        }

        const error = new TransientApiError(
          `Health check failed with HTTP ${response.status}.`,
          {
            phase: "warmup",
            status: response.status
          }
        );

        if (!isTransientStatus(response.status)) {
          return toApiUnreachableError(error);
        }

        lastError = error;
      } catch (error) {
        lastError = new TransientApiError(toErrorMessage(error), {
          phase: "warmup"
        });
      }

      if (attempt < this.warmupRetryDelaysMs.length) {
        await this.sleep(this.warmupRetryDelaysMs[attempt]);
      }
    }

    return toApiUnreachableError(lastError);
  }

  private async postTranscriptionWithRetry(
    file: Blob,
    options: TranscriptionOptions
  ): Promise<TranscriptionResponse> {
    let lastError: TransientApiError | null = null;

    for (
      let attempt = 0;
      attempt <= this.transcriptionRetryDelaysMs.length;
      attempt += 1
    ) {
      try {
        return await this.postTranscription(file, options);
      } catch (error) {
        if (!(error instanceof TransientApiError)) {
          return {
            ok: false,
            error: toApiError(error)
          };
        }

        lastError = error;
      }

      if (attempt < this.transcriptionRetryDelaysMs.length) {
        await this.sleep(this.transcriptionRetryDelaysMs[attempt]);
      }
    }

    return {
      ok: false,
      error: toApiUnreachableError(lastError)
    };
  }

  private async postTranscription(
    file: Blob,
    options: TranscriptionOptions
  ): Promise<TranscriptionResponse> {
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
      const payload = await readTranscriptionResponse(response);

      if (payload) {
        if (!response.ok && payload.ok) {
          return {
            ok: false,
            error: {
              code: "TRANSCRIPTION_FAILED",
              message: `Transcription request failed with HTTP ${response.status}.`,
              details: {
                status: response.status
              }
            }
          };
        }

        return payload;
      }

      if (!response.ok && isTransientStatus(response.status)) {
        throw new TransientApiError(
          `Transcription request failed with HTTP ${response.status}.`,
          {
            phase: "transcribe",
            status: response.status
          }
        );
      }

      if (!response.ok) {
        return {
          ok: false,
          error: {
            code: "TRANSCRIPTION_FAILED",
            message: `Transcription request failed with HTTP ${response.status}.`,
            details: {
              status: response.status
            }
          }
        };
      }

      return {
        ok: false,
        error: {
          code: "TRANSCRIPTION_FAILED",
          message: "Transcription API returned an invalid response.",
          details: {}
        }
      };
    } catch (error) {
      if (error instanceof TransientApiError) {
        throw error;
      }

      throw new TransientApiError(toErrorMessage(error), {
        phase: "transcribe"
      });
    }
  }
}

async function readTranscriptionResponse(
  response: Response
): Promise<TranscriptionResponse | null> {
  try {
    return (await response.json()) as TranscriptionResponse;
  } catch {
    return null;
  }
}

function isTransientStatus(status: number): boolean {
  return TRANSIENT_HTTP_STATUSES.has(status);
}

function toApiUnreachableError(error: TransientApiError | null): ApiError {
  return {
    code: "API_UNREACHABLE",
    message: API_UNREACHABLE_MESSAGE,
    details: error?.details ?? {}
  };
}

function delay(delayMs: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delayMs));
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Could not reach transcription API.";
}

function toApiError(error: unknown): ApiError {
  if (error instanceof TransientApiError) {
    return toApiUnreachableError(error);
  }

  return {
    code: "TRANSCRIPTION_FAILED",
    message: toErrorMessage(error),
    details: {}
  };
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

export function resolveApiBaseUrl(
  env: ApiRuntimeEnv = import.meta.env,
  currentOrigin = typeof window === "undefined" ? undefined : window.location.origin
): string | null {
  const configured = env.VITE_API_BASE_URL?.trim();
  if (configured) {
    const normalized = configured.replace(/\/+$/, "");
    const configuredOrigin = getOrigin(normalized);
    if (
      env.PROD &&
      (!configuredOrigin || (currentOrigin && configuredOrigin === currentOrigin))
    ) {
      return null;
    }
    return normalized;
  }

  return env.PROD ? null : DEFAULT_API_BASE_URL;
}

function getUploadName(file: Blob): string {
  return file instanceof File && file.name ? file.name : "upload.wav";
}

function getOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
