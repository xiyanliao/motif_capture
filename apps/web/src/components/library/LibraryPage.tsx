import { useEffect, useMemo, useState } from "react";
import type { Motif } from "../../domain/motif/types";
import { exportJsonBlob } from "../../services/export/exportJson";
import { datedFilename, triggerDownload } from "../../services/export/download";
import { motifRepository } from "../../services/storage/motifRepository";

type LibraryPageProps = {
  onOpenMotif: (motif: Motif) => void;
  onBackToEditor: () => void;
  onOpenCapture: () => void;
};

export function LibraryPage({
  onOpenMotif,
  onBackToEditor,
  onOpenCapture
}: LibraryPageProps) {
  const [motifs, setMotifs] = useState<Motif[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Library ready");

  useEffect(() => {
    void refresh();
  }, []);

  const filteredMotifs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return motifs;
    }

    return motifs.filter((motif) => {
      const haystack = [motif.title, motif.key?.tonic, motif.key?.mode, ...motif.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [motifs, query]);

  async function refresh() {
    const nextMotifs = await motifRepository.list();
    setMotifs(nextMotifs);
    setStatus(`${nextMotifs.length} motif${nextMotifs.length === 1 ? "" : "s"}`);
  }

  async function handleDelete(id: string) {
    await motifRepository.delete(id);
    await refresh();
  }

  async function handleDuplicate(id: string) {
    const copy = await motifRepository.duplicate(id);
    await refresh();
    setStatus(`Duplicated ${copy.title}`);
  }

  function handleExportJson(motif: Motif) {
    triggerDownload(exportJsonBlob(motif), datedFilename(motif.title, "json"));
    setStatus(`Exported ${motif.title}`);
  }

  return (
    <main className="library-shell">
      <header className="library-header">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Saved Motifs</h1>
        </div>
        <div className="library-actions">
          <button type="button" onClick={onOpenCapture}>
            Capture
          </button>
          <button type="button" onClick={onBackToEditor}>
            Editor
          </button>
          <button type="button" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      </header>

      <section className="library-toolbar" aria-label="Library tools">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, key, tag"
          aria-label="Search motifs"
        />
        <span>{status}</span>
      </section>

      <section className="motif-list" aria-label="Saved motifs">
        {filteredMotifs.length > 0 ? (
          filteredMotifs.map((motif) => (
            <article className="motif-card" key={motif.id}>
              <div className="motif-card-main">
                <div>
                  <h2>{motif.title}</h2>
                  <p>
                    {motif.key ? `${motif.key.tonic} ${motif.key.mode}` : "Key unknown"} ·{" "}
                    {motif.bpm} BPM · {motif.notes.length} notes
                  </p>
                </div>
                <MiniContour notes={motif.notes} />
              </div>
              <div className="motif-card-actions">
                <button type="button" onClick={() => onOpenMotif(motif)}>
                  Open
                </button>
                <button type="button" onClick={() => void handleDuplicate(motif.id)}>
                  Copy
                </button>
                <button type="button" onClick={() => handleExportJson(motif)}>
                  JSON
                </button>
                <button type="button" onClick={() => void handleDelete(motif.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="library-empty">
            <strong>No saved motifs</strong>
            <span>Save from the editor to keep a motif here.</span>
          </div>
        )}
      </section>
    </main>
  );
}

function MiniContour({ notes }: { notes: Motif["notes"] }) {
  const points = useMemo(() => {
    if (notes.length === 0) {
      return "";
    }

    const minPitch = Math.min(...notes.map((note) => note.pitch));
    const maxPitch = Math.max(...notes.map((note) => note.pitch));
    const maxEnd = Math.max(...notes.map((note) => note.startBeat + note.durationBeat));
    const pitchRange = Math.max(1, maxPitch - minPitch);

    return notes
      .map((note) => {
        const x = ((note.startBeat + note.durationBeat / 2) / maxEnd) * 120;
        const y = 34 - ((note.pitch - minPitch) / pitchRange) * 28;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [notes]);

  return (
    <svg className="mini-contour" viewBox="0 0 120 40" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}
