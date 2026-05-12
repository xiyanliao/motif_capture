import { createEmptyMotif } from "./domain/motif/factory";

const scaffoldMotif = createEmptyMotif("phase-0", "Motif Capture MVP");

export function App() {
  return (
    <main className="app-shell">
      <section className="capture-panel" aria-labelledby="app-title">
        <p className="eyebrow">Phase 0 Scaffold</p>
        <h1 id="app-title">Motif Capture</h1>
        <p className="summary">把哼唱变成可编辑旋律卡片。</p>
        <dl className="contract-grid">
          <div>
            <dt>Motif</dt>
            <dd>{scaffoldMotif.title}</dd>
          </div>
          <div>
            <dt>BPM</dt>
            <dd>{scaffoldMotif.bpm}</dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{scaffoldMotif.notes.length}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
