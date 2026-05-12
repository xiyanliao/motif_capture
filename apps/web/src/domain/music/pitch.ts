const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToPitchName(pitch: number): string {
  const midiPitch = clampMidiPitch(Math.round(pitch));
  const octave = Math.floor(midiPitch / 12) - 1;
  return `${PITCH_NAMES[midiPitch % 12]}${octave}`;
}

export function clampMidiPitch(pitch: number): number {
  return Math.min(127, Math.max(0, Math.round(pitch)));
}
