export type PitchNameMode = "letter" | "solfege";

export type MusicKey = {
  tonic: string;
  mode: "major" | "minor" | "unknown";
  confidence: number;
};

export type MotifNote = {
  id: string;
  pitch: number;
  startBeat: number;
  durationBeat: number;
  velocity: number;
  confidence?: number;
  startSec?: number;
  durationSec?: number;
  rawPitch?: number;
};

export type MotifVersion = {
  id: string;
  createdAt: string;
  label: string;
  notes: MotifNote[];
};

export type MotifSource = {
  type: "recording" | "upload" | "manual";
  audioBlobId?: string;
  engine?: string;
  engineVersion?: string;
};

export type Motif = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  durationSec: number;
  bpm: number;
  timeSignature: "4/4" | "3/4" | "6/8";
  key?: MusicKey;
  notes: MotifNote[];
  tags: string[];
  source?: MotifSource;
  versions: MotifVersion[];
};
