import type { MotifNote } from "../motif/types";
import { sortNotes } from "../motif/editing";

export type QuantizeGrid = "off" | "1/8" | "1/16" | "1/32";

export function gridToBeat(grid: QuantizeGrid): number {
  switch (grid) {
    case "1/8":
      return 0.5;
    case "1/16":
      return 0.25;
    case "1/32":
      return 0.125;
    case "off":
      return 0;
  }
}

export function quantizeNotes(
  notes: MotifNote[],
  grid: QuantizeGrid = "1/16"
): MotifNote[] {
  if (grid === "off") {
    return notes.map((note) => ({ ...note }));
  }

  const gridBeat = gridToBeat(grid);

  return sortNotes(
    notes.map((note) => ({
      ...note,
      startBeat: quantizeBeat(note.startBeat, gridBeat),
      durationBeat: Math.max(gridBeat, quantizeBeat(note.durationBeat, gridBeat))
    }))
  );
}

function quantizeBeat(value: number, gridBeat: number): number {
  return Math.round((Math.round(value / gridBeat) * gridBeat) * 1000) / 1000;
}
