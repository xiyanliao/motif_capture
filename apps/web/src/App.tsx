import { useEffect, useState } from "react";
import { CapturePage } from "./components/capture/CapturePage";
import { EditorPage } from "./components/editor/EditorPage";
import { LibraryPage } from "./components/library/LibraryPage";
import type { Motif } from "./domain/motif/types";
import { mockMotif } from "./fixtures/mockMotif";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { motifRepository } from "./services/storage/motifRepository";

type AppView = "capture" | "editor" | "library";
type AppBootState = "loading" | "ready" | "failed";

export function App() {
  const [activeMotif, setActiveMotif] = useState<Motif>(mockMotif);
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootState, setBootState] = useState<AppBootState>("loading");
  const [view, setView] = useState<AppView>("capture");
  const isOnline = useOnlineStatus();

  useEffect(() => {
    let isCancelled = false;

    async function hydrateLatestMotif() {
      try {
        const motifs = await motifRepository.list();
        if (isCancelled) {
          return;
        }

        if (motifs[0]) {
          setActiveMotif(motifs[0]);
        }
        setBootState("ready");
      } catch (error) {
        if (isCancelled) {
          return;
        }
        setBootError(error instanceof Error ? error.message : "Could not open local library.");
        setBootState("failed");
      }
    }

    void hydrateLatestMotif();

    return () => {
      isCancelled = true;
    };
  }, []);

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

  if (bootState === "loading") {
    return (
      <main className="app-shell-state">
        <p className="eyebrow">Motif Capture</p>
        <h1>Opening library</h1>
        <p>Loading local motifs...</p>
      </main>
    );
  }

  if (bootState === "failed") {
    return (
      <main className="app-shell-state">
        <p className="eyebrow">Motif Capture</p>
        <h1>Local storage unavailable</h1>
        <p>{bootError}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </main>
    );
  }

  const offlineBanner = !isOnline ? (
    <div className="offline-banner" role="status">
      Offline mode. Saved motifs stay available; Basic Pitch analysis needs the API.
    </div>
  ) : null;

  if (view === "library") {
    return (
      <>
        {offlineBanner}
        <LibraryPage
          onOpenMotif={handleOpenMotif}
          onBackToEditor={() => setView("editor")}
          onOpenCapture={() => setView("capture")}
        />
      </>
    );
  }

  if (view === "capture") {
    return (
      <>
        {offlineBanner}
        <CapturePage
          onTranscribed={handleTranscribed}
          onOpenEditor={() => setView("editor")}
          onOpenLibrary={() => setView("library")}
        />
      </>
    );
  }

  return (
    <>
      {offlineBanner}
      <EditorPage
        key={`${activeMotif.id}-${activeMotif.updatedAt}`}
        initialMotif={activeMotif}
        onSaveMotif={handleSaveMotif}
        onOpenLibrary={() => setView("library")}
        onOpenCapture={() => setView("capture")}
        onImportMotif={setActiveMotif}
      />
    </>
  );
}
