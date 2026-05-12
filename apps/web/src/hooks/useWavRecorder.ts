import { useCallback, useEffect, useRef, useState } from "react";
import {
  calculateSignalStats,
  classifyInputLevel,
  encodePcm16Wav,
  inputLevelMessage,
  mergeFloat32Chunks
} from "../services/recording/wav";

export type WavRecorderStatus = "idle" | "recording" | "recorded" | "failed";

export type WavRecorderState = {
  audioUrl: string | null;
  elapsedSec: number;
  error: string | null;
  isSupported: boolean;
  level: number;
  peak: number;
  recordedFile: File | null;
  status: WavRecorderStatus;
  warning: string | null;
};

type AudioContextConstructor = typeof AudioContext;

type WindowWithWebkitAudioContext = Window &
  typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };

const INPUT_BUFFER_SIZE = 4096;
const RECORDING_FILENAME_PREFIX = "motif-recording";

export function useWavRecorder() {
  const [state, setState] = useState<WavRecorderState>({
    audioUrl: null,
    elapsedSec: 0,
    error: null,
    isSupported: isBrowserRecorderSupported(),
    level: 0,
    peak: 0,
    recordedFile: null,
    status: "idle",
    warning: null
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const levelPeakRef = useRef(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanupAudio();
    clearObjectUrl();
    chunksRef.current = [];
    levelPeakRef.current = 0;
    recordingStartedAtRef.current = null;
    setState({
      audioUrl: null,
      elapsedSec: 0,
      error: null,
      isSupported: isBrowserRecorderSupported(),
      level: 0,
      peak: 0,
      recordedFile: null,
      status: "idle",
      warning: null
    });
  }, [cleanupAudio, clearObjectUrl]);

  const start = useCallback(async () => {
    if (!isBrowserRecorderSupported()) {
      setState((current) => ({
        ...current,
        error: "This browser does not support microphone recording.",
        status: "failed"
      }));
      return false;
    }

    cleanupAudio();
    clearObjectUrl();
    chunksRef.current = [];
    levelPeakRef.current = 0;
    recordingStartedAtRef.current = performance.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false
        }
      });
      mediaStreamRef.current = stream;
      const AudioContextClass = getAudioContextConstructor();
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(INPUT_BUFFER_SIZE, 1, 1);
      processorRef.current = processor;
      sourceRef.current = source;

      processor.onaudioprocess = (event) => {
        const monoSamples = copyMonoChannel(event.inputBuffer);
        chunksRef.current.push(monoSamples);

        const output = event.outputBuffer.getChannelData(0);
        output.fill(0);

        const stats = calculateSignalStats(monoSamples);
        levelPeakRef.current = Math.max(levelPeakRef.current, stats.peak);
        setState((current) => ({
          ...current,
          level: Math.min(1, stats.rms * 5),
          peak: levelPeakRef.current
        }));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      timerRef.current = window.setInterval(() => {
        const startedAt = recordingStartedAtRef.current;
        if (startedAt === null) {
          return;
        }
        setState((current) => ({
          ...current,
          elapsedSec: Math.round((performance.now() - startedAt) / 100) / 10
        }));
      }, 100);

      setState((current) => ({
        ...current,
        audioUrl: null,
        elapsedSec: 0,
        error: null,
        level: 0,
        peak: 0,
        recordedFile: null,
        status: "recording",
        warning: null
      }));
      return true;
    } catch (error) {
      cleanupAudio();
      setState((current) => ({
        ...current,
        error: toRecordingErrorMessage(error),
        status: "failed"
      }));
      return false;
    }
  }, [cleanupAudio, clearObjectUrl]);

  const stop = useCallback(() => {
    const audioContext = audioContextRef.current;
    if (!audioContext || chunksRef.current.length === 0) {
      cleanupAudio();
      setState((current) => ({
        ...current,
        error: "No microphone samples were captured.",
        status: "failed"
      }));
      return false;
    }

    const sampleRate = audioContext.sampleRate;
    const samples = mergeFloat32Chunks(chunksRef.current);
    cleanupAudio();

    if (samples.length === 0) {
      setState((current) => ({
        ...current,
        error: "No microphone samples were captured.",
        status: "failed"
      }));
      return false;
    }

    const wavBlob = encodePcm16Wav(samples, sampleRate);
    const recordedFile = new File([wavBlob], createRecordingFilename(), {
      type: wavBlob.type
    });
    const audioUrl = URL.createObjectURL(recordedFile);
    objectUrlRef.current = audioUrl;

    const quality = classifyInputLevel(levelPeakRef.current);
    setState((current) => ({
      ...current,
      audioUrl,
      error: null,
      level: 0,
      peak: levelPeakRef.current,
      recordedFile,
      status: "recorded",
      warning: inputLevelMessage(quality)
    }));
    return true;
  }, [cleanupAudio]);

  useEffect(() => {
    return () => {
      cleanupAudio();
      clearObjectUrl();
    };
  }, [cleanupAudio, clearObjectUrl]);

  return {
    ...state,
    reset,
    start,
    stop
  };
}

function copyMonoChannel(audioBuffer: AudioBuffer): Float32Array {
  const samples = new Float32Array(audioBuffer.length);
  const channelCount = audioBuffer.numberOfChannels;

  for (let channel = 0; channel < channelCount; channel += 1) {
    const channelSamples = audioBuffer.getChannelData(channel);
    for (let index = 0; index < channelSamples.length; index += 1) {
      samples[index] += channelSamples[index] / channelCount;
    }
  }

  return samples;
}

function createRecordingFilename(): string {
  return `${RECORDING_FILENAME_PREFIX}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.wav`;
}

function getAudioContextConstructor(): AudioContextConstructor {
  const audioWindow = window as WindowWithWebkitAudioContext;
  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext!;
}

function isBrowserRecorderSupported(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const audioWindow = window as WindowWithWebkitAudioContext;
  const mediaDevices = navigator.mediaDevices as
    | { getUserMedia?: unknown }
    | undefined;
  return Boolean(
    typeof mediaDevices?.getUserMedia === "function" &&
      (audioWindow.AudioContext || audioWindow.webkitAudioContext)
  );
}

function toRecordingErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Microphone permission was denied.";
    }

    if (error.name === "NotFoundError") {
      return "No microphone was found.";
    }
  }

  return error instanceof Error ? error.message : "Could not start microphone recording.";
}
