import { useMemo, useState } from "react";
import type { Motif } from "../../domain/motif/types";
import {
  useWavRecorder,
  type WavRecorderStatus
} from "../../hooks/useWavRecorder";
import { MockTranscriptionClient } from "../../services/transcription/MockTranscriptionClient";
import {
  RemoteBasicPitchClient,
  resolveApiBaseUrl
} from "../../services/transcription/RemoteBasicPitchClient";
import type {
  TranscriptionClient,
  TranscriptionEngineId
} from "../../services/transcription/contract";
import {
  canAnalyzeAudio,
  canRunBasicPitch,
  productionApiStatusMessage
} from "./captureState";

type CapturePageProps = {
  onTranscribed: (motif: Motif) => void;
  onOpenEditor: () => void;
  onOpenLibrary: () => void;
};

type CaptureFlowState = "idle" | "recording" | "recorded" | "analyzing" | "failed";

export function CapturePage({
  onTranscribed,
  onOpenEditor,
  onOpenLibrary
}: CapturePageProps) {
  const remoteClient = useMemo<TranscriptionClient>(() => new RemoteBasicPitchClient(), []);
  const mockClient = useMemo<TranscriptionClient>(() => new MockTranscriptionClient(), []);
  const hasTranscriptionApi = useMemo(() => resolveApiBaseUrl() !== null, []);
  const isProductionBuild = import.meta.env.PROD;
  const apiConfigMessage = productionApiStatusMessage(
    isProductionBuild,
    hasTranscriptionApi
  );
  const recorder = useWavRecorder();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bpm, setBpm] = useState(96);
  const [status, setStatus] = useState(
    apiConfigMessage ?? "Record or upload a short audio file to start."
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const activeFile = selectedFile ?? recorder.recordedFile;
  const activeInputLabel = selectedFile
    ? selectedFile.name
    : recorder.recordedFile?.name ?? "No audio selected";
  const canAnalyze = canAnalyzeAudio({
    hasAudio: Boolean(activeFile),
    isAnalyzing,
    isRecording: recorder.status === "recording"
  });
  const canAnalyzeWithBasicPitch = canRunBasicPitch({
    hasAudio: Boolean(activeFile),
    hasTranscriptionApi,
    isAnalyzing,
    isRecording: recorder.status === "recording"
  });
  const flowState = getCaptureFlowState(recorder.status, Boolean(activeFile), isAnalyzing);

  async function handleAnalyze(
    client: TranscriptionClient,
    engine: TranscriptionEngineId = "mock"
  ) {
    if (!activeFile) {
      setStatus("Record or choose an audio file first.");
      return;
    }

    setIsAnalyzing(true);
    setStatus(
      engine === "basic-pitch"
        ? "Connecting to Basic Pitch API. If the backend was idle, the first analysis can take up to 2 minutes."
        : "Analyzing audio..."
    );
    const response = await client.transcribe(activeFile, {
      bpm,
      quantizeGrid: "1/16",
      forceMonophonic: true,
      engine
    });
    setIsAnalyzing(false);

    if (response.ok) {
      onTranscribed(response.data.motif);
      setStatus(
        response.warnings.length > 0
          ? `Opened editor. ${response.warnings.join(", ")}`
          : "Opened editor."
      );
      return;
    }

    setStatus(response.error.message);
  }

  async function handleDemoMotif() {
    setIsAnalyzing(true);
    setStatus("Opening demo motif...");
    const response = await mockClient.transcribe(new Blob(["demo"], { type: "audio/wav" }), {
      bpm,
      quantizeGrid: "1/16",
      forceMonophonic: true,
      engine: "mock"
    });
    setIsAnalyzing(false);

    if (response.ok) {
      onTranscribed(response.data.motif);
      setStatus("Opened demo motif.");
      return;
    }

    setStatus(response.error.message);
  }

  async function handleStartRecording() {
    setSelectedFile(null);
    setStatus("Requesting microphone...");
    const started = await recorder.start();
    setStatus(started ? "Recording..." : "Could not start recording.");
  }

  function handleStopRecording() {
    const stopped = recorder.stop();
    setStatus(stopped ? "Recording ready." : "Recording failed.");
  }

  function handleResetRecording() {
    recorder.reset();
    setStatus(selectedFile ? "Upload selected." : "Record or upload a short audio file to start.");
  }

  return (
    <main className="capture-shell">
      <header className="capture-header">
        <div>
          <p className="eyebrow">Capture</p>
          <h1>Motif Capture</h1>
        </div>
        <div className="capture-nav">
          <button type="button" onClick={onOpenEditor}>
            Editor
          </button>
          <button type="button" onClick={onOpenLibrary}>
            Library
          </button>
        </div>
      </header>

      <section className="capture-workspace" aria-label="Upload and analyze audio">
        <div className="recording-panel" data-state={flowState}>
          <div className="recording-main">
            <div>
              <span className="field-label">Microphone</span>
              <strong>{recordingReadout(recorder.status, isAnalyzing)}</strong>
            </div>
            <div className="recording-time">
              {formatElapsed(recorder.elapsedSec)}
            </div>
          </div>

          <div className="level-meter" aria-label="Input level">
            <span style={{ width: `${Math.round(recorder.level * 100)}%` }} />
          </div>

          <div className="recording-actions">
            <button
              type="button"
              onClick={() => void handleStartRecording()}
              disabled={!recorder.isSupported || recorder.status === "recording" || isAnalyzing}
            >
              Record
            </button>
            <button
              type="button"
              onClick={handleStopRecording}
              disabled={recorder.status !== "recording"}
            >
              Stop
            </button>
            <button
              type="button"
              onClick={handleResetRecording}
              disabled={recorder.status === "recording" || isAnalyzing}
            >
              Clear
            </button>
          </div>

          {recorder.audioUrl ? (
            <audio
              className="recording-preview"
              controls
              src={recorder.audioUrl}
              aria-label="Recorded audio preview"
            />
          ) : null}

          {!recorder.isSupported ? (
            <p className="capture-error">This browser does not support microphone recording.</p>
          ) : null}
          {apiConfigMessage ? <p className="capture-warning">{apiConfigMessage}</p> : null}
          {recorder.warning ? <p className="capture-warning">{recorder.warning}</p> : null}
          {recorder.error ? <p className="capture-error">{recorder.error}</p> : null}
        </div>

        <div className="upload-zone">
          <span>Audio upload</span>
          <strong>{activeInputLabel}</strong>
          <input
            type="file"
            accept="audio/*,.wav"
            onChange={(event) => {
              const nextFile = event.currentTarget.files?.[0] ?? null;
              setSelectedFile(nextFile);
              recorder.reset();
              setStatus(nextFile ? "Ready to analyze." : "Record or upload a short audio file to start.");
            }}
            aria-label="Choose audio file"
          />
        </div>

        <label className="bpm-control">
          <span>BPM</span>
          <input
            type="number"
            min={40}
            max={240}
            value={bpm}
            onChange={(event) => setBpm(Number(event.currentTarget.value))}
          />
        </label>

        <div className="capture-actions">
          <button
            type="button"
            onClick={() => void handleAnalyze(remoteClient, "basic-pitch")}
            disabled={!canAnalyzeWithBasicPitch}
            title={
              hasTranscriptionApi
                ? "Analyze with deployed Basic Pitch API"
                : "Set VITE_API_BASE_URL to enable Basic Pitch"
            }
          >
            Basic Pitch
          </button>
          {!isProductionBuild ? (
            <button
              type="button"
              onClick={() => void handleAnalyze(remoteClient, "mock")}
              disabled={!canAnalyze}
            >
              Analyze Mock
            </button>
          ) : null}
          <button
            type="button"
            className={isProductionBuild ? "button-secondary" : undefined}
            onClick={() => void handleDemoMotif()}
            disabled={isAnalyzing || recorder.status === "recording"}
          >
            Demo Motif
          </button>
        </div>

        <p className="capture-status">{status}</p>
      </section>
    </main>
  );
}

function getCaptureFlowState(
  recorderStatus: WavRecorderStatus,
  hasAudio: boolean,
  isAnalyzing: boolean
): CaptureFlowState {
  if (isAnalyzing) {
    return "analyzing";
  }

  if (recorderStatus === "recording") {
    return "recording";
  }

  if (recorderStatus === "failed") {
    return "failed";
  }

  if (recorderStatus === "recorded" || hasAudio) {
    return "recorded";
  }

  return "idle";
}

function recordingReadout(status: WavRecorderStatus, isAnalyzing: boolean): string {
  if (isAnalyzing) {
    return "Analyzing";
  }

  if (status === "recording") {
    return "Recording";
  }

  if (status === "recorded") {
    return "Ready";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Idle";
}

function formatElapsed(elapsedSec: number): string {
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = Math.floor(elapsedSec % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}
