import { useMemo, useState } from "react";
import type { Motif } from "../../domain/motif/types";
import { MockTranscriptionClient } from "../../services/transcription/MockTranscriptionClient";
import { RemoteBasicPitchClient } from "../../services/transcription/RemoteBasicPitchClient";
import type {
  TranscriptionClient,
  TranscriptionEngineId
} from "../../services/transcription/contract";

type CapturePageProps = {
  onTranscribed: (motif: Motif) => void;
  onOpenEditor: () => void;
  onOpenLibrary: () => void;
};

export function CapturePage({
  onTranscribed,
  onOpenEditor,
  onOpenLibrary
}: CapturePageProps) {
  const remoteClient = useMemo<TranscriptionClient>(() => new RemoteBasicPitchClient(), []);
  const mockClient = useMemo<TranscriptionClient>(() => new MockTranscriptionClient(), []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bpm, setBpm] = useState(96);
  const [status, setStatus] = useState("Upload a short audio file to start.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleAnalyze(
    client: TranscriptionClient,
    engine: TranscriptionEngineId = "mock"
  ) {
    if (!selectedFile) {
      setStatus("Choose an audio file first.");
      return;
    }

    setIsAnalyzing(true);
    setStatus("Analyzing upload...");
    const response = await client.transcribe(selectedFile, {
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
        <div className="upload-zone">
          <span>Audio upload</span>
          <strong>{selectedFile ? selectedFile.name : "No file selected"}</strong>
          <input
            type="file"
            accept="audio/*,.wav"
            onChange={(event) => {
              setSelectedFile(event.currentTarget.files?.[0] ?? null);
              setStatus("Ready to analyze.");
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
            onClick={() => void handleAnalyze(remoteClient, "mock")}
            disabled={!selectedFile || isAnalyzing}
          >
            Analyze Mock
          </button>
          <button
            type="button"
            onClick={() => void handleAnalyze(remoteClient, "basic-pitch")}
            disabled={!selectedFile || isAnalyzing}
          >
            Basic Pitch
          </button>
          <button
            type="button"
            onClick={() => void handleAnalyze(mockClient, "mock")}
            disabled={!selectedFile || isAnalyzing}
          >
            Local Mock
          </button>
        </div>

        <p className="capture-status">{status}</p>
      </section>
    </main>
  );
}
