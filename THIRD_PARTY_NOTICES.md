# Third Party Notices

This project tracks third-party components used by the Motif Capture MVP.

## Phase 0 Dependencies

| Component | Purpose | License |
| --- | --- | --- |
| React | Frontend UI runtime | MIT |
| React DOM | Browser rendering for React | MIT |
| Vite | Frontend dev server and build tool | MIT |
| TypeScript | Static type checking | Apache-2.0 |
| Vitest | Frontend unit tests | MIT |
| Tone.js | Browser audio playback | MIT |
| @tonejs/midi | MIDI file export | MIT |
| Dexie | IndexedDB wrapper | Apache-2.0 |
| fake-indexeddb | IndexedDB implementation for tests | Apache-2.0 |
| Spotify Basic Pitch | Audio-to-MIDI transcription | Apache-2.0 |
| NumPy | Numerical runtime dependency for Basic Pitch | BSD-3-Clause |
| FastAPI | Backend web framework | MIT |
| Pydantic | Backend schema validation | MIT |
| python-multipart | Multipart form parsing for FastAPI uploads | Apache-2.0 |
| setuptools | Python packaging/runtime compatibility dependency | MIT |
| Uvicorn | ASGI server | BSD-3-Clause |
| pytest | Backend tests | MIT |
| httpx | TestClient transport dependency | BSD-3-Clause |

MVP should avoid FFmpeg unless a later requirement explicitly needs it and the LGPL/GPL implications are documented.
