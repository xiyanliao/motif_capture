import * as Tone from "tone";
import type { MotifNote } from "../../domain/motif/types";
import { midiToPitchName } from "../../domain/music/pitch";

export type PlaybackOptions = {
  bpm: number;
  loop: boolean;
  onPlayheadBeat?: (beat: number) => void;
  onEnded?: () => void;
};

const LOOKAHEAD_MS = 33;

export class TonePlayback {
  private synth: Tone.PolySynth<Tone.Synth> | null = null;
  private auditionSynth: Tone.Synth | null = null;
  private auditionReleaseTimer: number | null = null;
  private auditionSequence = 0;
  private scheduledIds: number[] = [];
  private playheadTimer: number | null = null;
  private startedAtMs = 0;
  private durationBeats = 0;
  private options: PlaybackOptions | null = null;

  async start(notes: MotifNote[], options: PlaybackOptions): Promise<void> {
    await Tone.start();
    this.stop();
    this.options = options;
    this.durationBeats = getTotalBeats(notes);
    this.startedAtMs = performance.now();

    if (!this.synth) {
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "triangle"
        },
        envelope: {
          attack: 0.01,
          decay: 0.08,
          sustain: 0.38,
          release: 0.18
        }
      }).toDestination();
      this.synth.volume.value = -8;
    }

    Tone.Transport.cancel();
    Tone.Transport.bpm.value = options.bpm;
    Tone.Transport.position = 0;
    Tone.Transport.loop = options.loop;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = beatsToSeconds(Math.max(1, this.durationBeats), options.bpm);

    notes.forEach((note) => {
      const id = Tone.Transport.schedule((time) => {
        this.synth?.triggerAttackRelease(
          midiToPitchName(note.pitch),
          beatsToSeconds(note.durationBeat, options.bpm),
          time,
          note.velocity
        );
      }, beatsToSeconds(note.startBeat, options.bpm));
      this.scheduledIds.push(id);
    });

    Tone.Transport.start("+0.02");
    this.startPlayheadTimer();
  }

  async auditionPitch(
    pitch: number,
    durationSec = 0.28,
    velocity = 0.72
  ): Promise<void> {
    const sequence = this.auditionSequence + 1;
    this.auditionSequence = sequence;
    await Tone.start();
    if (sequence !== this.auditionSequence) {
      return;
    }

    this.releaseCurrentAudition();
    const synth = this.getAuditionSynth();

    synth.triggerAttack(midiToPitchName(pitch), Tone.now(), velocity);
    this.auditionReleaseTimer = window.setTimeout(() => {
      this.auditionReleaseTimer = null;
      synth.triggerRelease(Tone.now());
    }, durationSec * 1000);
  }

  stopAudition(): void {
    this.auditionSequence += 1;
    this.releaseCurrentAudition();
  }

  private releaseCurrentAudition(): void {
    if (this.auditionReleaseTimer !== null) {
      window.clearTimeout(this.auditionReleaseTimer);
      this.auditionReleaseTimer = null;
    }

    this.auditionSynth?.triggerRelease(Tone.now());
  }

  stop(): void {
    if (this.playheadTimer !== null) {
      window.clearInterval(this.playheadTimer);
      this.playheadTimer = null;
    }

    this.scheduledIds.forEach((id) => Tone.Transport.clear(id));
    this.scheduledIds = [];
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.synth?.releaseAll();
    this.stopAudition();
    this.options?.onPlayheadBeat?.(0);
  }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.synth = null;
    this.auditionSynth?.dispose();
    this.auditionSynth = null;
  }

  private getAuditionSynth(): Tone.Synth {
    if (!this.auditionSynth) {
      this.auditionSynth = new Tone.Synth({
        oscillator: {
          type: "triangle"
        },
        envelope: {
          attack: 0.005,
          decay: 0.05,
          sustain: 0.28,
          release: 0.08
        }
      }).toDestination();
      this.auditionSynth.volume.value = -10;
    }

    return this.auditionSynth;
  }

  private startPlayheadTimer(): void {
    if (!this.options) {
      return;
    }

    this.playheadTimer = window.setInterval(() => {
      if (!this.options) {
        return;
      }

      const elapsedMs = performance.now() - this.startedAtMs;
      const elapsedBeats = (elapsedMs / 1000 / 60) * this.options.bpm;
      const playheadBeat =
        this.options.loop && this.durationBeats > 0
          ? elapsedBeats % this.durationBeats
          : elapsedBeats;

      if (!this.options.loop && elapsedBeats >= this.durationBeats) {
        this.options.onPlayheadBeat?.(this.durationBeats);
        this.options.onEnded?.();
        this.stop();
        return;
      }

      this.options.onPlayheadBeat?.(playheadBeat);
    }, LOOKAHEAD_MS);
  }
}

export function getTotalBeats(notes: MotifNote[]): number {
  return Math.max(0, ...notes.map((note) => note.startBeat + note.durationBeat));
}

function beatsToSeconds(beats: number, bpm: number): number {
  return (beats * 60) / bpm;
}
