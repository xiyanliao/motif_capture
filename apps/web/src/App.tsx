import { useState } from "react";
import { CapturePage } from "./components/capture/CapturePage";
import { EditorPage } from "./components/editor/EditorPage";
import { LibraryPage } from "./components/library/LibraryPage";
import type { Motif } from "./domain/motif/types";
import { mockMotif } from "./fixtures/mockMotif";
import { motifRepository } from "./services/storage/motifRepository";

type AppView = "capture" | "editor" | "library";

export function App() {
  const [activeMotif, setActiveMotif] = useState<Motif>(mockMotif);
  const [view, setView] = useState<AppView>("capture");

  async function handleSaveMotif(motif: Motif): Promise<Motif> {
    const savedMotif = await motifRepository.save(motif);
    setActiveMotif(savedMotif);
    return savedMotif;
  }

  function handleOpenMotif(motif: Motif) {
    setActiveMotif(motif);
    setView("editor");
  }

  function handleTranscribed(motif: Motif) {
    setActiveMotif(motif);
    setView("editor");
  }

  if (view === "library") {
    return (
      <LibraryPage
        onOpenMotif={handleOpenMotif}
        onBackToEditor={() => setView("editor")}
        onOpenCapture={() => setView("capture")}
      />
    );
  }

  if (view === "capture") {
    return (
      <CapturePage
        onTranscribed={handleTranscribed}
        onOpenEditor={() => setView("editor")}
        onOpenLibrary={() => setView("library")}
      />
    );
  }

  return (
    <EditorPage
      key={`${activeMotif.id}-${activeMotif.updatedAt}`}
      initialMotif={activeMotif}
      onSaveMotif={handleSaveMotif}
      onOpenLibrary={() => setView("library")}
      onOpenCapture={() => setView("capture")}
      onImportMotif={setActiveMotif}
    />
  );
}
