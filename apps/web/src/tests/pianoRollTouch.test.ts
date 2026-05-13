import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PianoRoll } from "../components/editor/PianoRoll";
import type { MotifNote } from "../domain/motif/types";

const note: MotifNote = {
  id: "n1",
  pitch: 64,
  startBeat: 18,
  durationBeat: 1,
  velocity: 0.82
};

function renderPianoRoll(notes: MotifNote[] = []): string {
  return renderToStaticMarkup(
    createElement(PianoRoll, {
      notes,
      selectedNoteId: notes[0]?.id ?? null,
      playheadBeat: 0,
      onChangeNotes: () => undefined,
      onDeleteNote: () => undefined,
      onSelectNote: () => undefined
    })
  );
}

describe("piano roll touch behavior", () => {
  it("allows the mobile piano roll viewport to scroll in both directions", () => {
    const markup = renderPianoRoll();

    expect(markup).toContain('class="roll-scroll"');
    expect(markup).toContain('class="piano-roll"');
    expect(markup).toContain('style="touch-action:pan-x pan-y"');
    expect(markup).not.toContain('class="piano-roll" style="touch-action:none"');
  });

  it("keeps note editing gestures scoped to draggable note elements", () => {
    const markup = renderPianoRoll([note]);

    expect(markup).toContain('class="note-hit-area"');
    expect(markup).toContain('class="note-handle-hit-area"');
    expect(markup.match(/style="touch-action:none"/g)).toHaveLength(4);
  });
});
