import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditorPage } from "../components/editor/EditorPage";
import type { Motif } from "../domain/motif/types";

const motif: Motif = {
  id: "m1",
  title: "Editor Settings",
  createdAt: "2026-05-13T00:00:00.000Z",
  updatedAt: "2026-05-13T00:00:00.000Z",
  durationSec: 1,
  bpm: 96,
  timeSignature: "4/4",
  notes: [
    {
      id: "n1",
      pitch: 60,
      startBeat: 0,
      durationBeat: 1,
      velocity: 0.8
    }
  ],
  tags: [],
  versions: []
};

describe("editor settings", () => {
  it("enables pitch audition by default", () => {
    const markup = renderToStaticMarkup(
      createElement(EditorPage, {
        initialMotif: motif,
        onImportMotif: () => undefined,
        onOpenCapture: () => undefined,
        onOpenLibrary: () => undefined,
        onSaveMotif: async (nextMotif: Motif) => nextMotif
      })
    );

    expect(markup).toContain("Audition");
    expect(markup).toContain('type="checkbox" checked=""');
  });
});
