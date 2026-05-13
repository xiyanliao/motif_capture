import { useMemo, useRef, useState, type CSSProperties } from "react";
import {
  addNote,
  DEFAULT_GRID_BEAT,
  snapBeat,
  updateNote
} from "../../domain/motif/editing";
import type { MotifNote } from "../../domain/motif/types";
import { midiToPitchName } from "../../domain/music/pitch";

type PianoRollProps = {
  notes: MotifNote[];
  selectedNoteId: string | null;
  playheadBeat: number;
  onChangeNotes: (notes: MotifNote[]) => void;
  onAuditionPitch?: (pitch: number) => void;
  onSelectNote: (noteId: string | null) => void;
  onDeleteNote: (noteId: string) => void;
};

type DragState = {
  noteId: string;
  kind: "move" | "resize";
  startX: number;
  startY: number;
  originalNote: MotifNote;
  captureElement: SVGElement;
};

type RollPoint = {
  x: number;
  y: number;
};

const LABEL_WIDTH = 56;
const HEADER_HEIGHT = 28;
const ROW_HEIGHT = 24;
const PIXELS_PER_BEAT = 68;
const HANDLE_WIDTH = 12;
const HANDLE_HIT_WIDTH = 30;
const NOTE_HIT_PADDING_X = 8;
const NOTE_HIT_PADDING_Y = 7;
const MIN_NOTE_HIT_WIDTH = 44;
const MIN_VISIBLE_BEATS = 16;
const MIN_VISIBLE_PITCHES = 18;
const BLACK_KEY_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);
const ROLL_TOUCH_STYLE: CSSProperties = { touchAction: "pan-x pan-y" };
const NOTE_TOUCH_STYLE: CSSProperties = { touchAction: "none" };

export function PianoRoll({
  notes,
  selectedNoteId,
  playheadBeat,
  onChangeNotes,
  onAuditionPitch,
  onSelectNote,
  onDeleteNote
}: PianoRollProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragAuditionPitchRef = useRef<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const layout = useMemo(() => getPianoRollLayout(notes), [notes]);
  const selectedNote = notes.find((note) => note.id === selectedNoteId);

  function getSvgPoint(clientX: number, clientY: number): RollPoint {
    const svg = svgRef.current;
    if (!svg) {
      return { x: 0, y: 0 };
    }

    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * layout.width,
      y: ((clientY - rect.top) / rect.height) * layout.height
    };
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!dragState) {
      return;
    }

    const point = getSvgPoint(event.clientX, event.clientY);
    const deltaBeat = snapBeat((point.x - dragState.startX) / PIXELS_PER_BEAT);

    if (dragState.kind === "resize") {
      onChangeNotes(
        updateNote(notes, dragState.noteId, {
          durationBeat: Math.max(
            DEFAULT_GRID_BEAT,
            snapBeat(dragState.originalNote.durationBeat + deltaBeat)
          )
        })
      );
      return;
    }

    const deltaPitch = Math.round((dragState.startY - point.y) / ROW_HEIGHT);
    const nextStartBeat = Math.max(
      0,
      snapBeat(dragState.originalNote.startBeat + deltaBeat)
    );
    const nextPitch = clampPitch(dragState.originalNote.pitch + deltaPitch);

    auditionDraggedPitch(nextPitch);
    onChangeNotes(
      updateNote(notes, dragState.noteId, {
        startBeat: nextStartBeat,
        pitch: nextPitch
      })
    );
  }

  function handlePointerEnd(event: React.PointerEvent<SVGSVGElement>) {
    if (dragState) {
      releasePointerCapture(dragState.captureElement, event.pointerId);
    }
    dragAuditionPitchRef.current = null;
    setDragState(null);
  }

  function startDrag(
    event: React.PointerEvent<SVGRectElement>,
    note: MotifNote,
    kind: "move" | "resize"
  ) {
    event.preventDefault();
    event.stopPropagation();
    const point = getSvgPoint(event.clientX, event.clientY);
    capturePointer(event.currentTarget, event.pointerId);
    dragAuditionPitchRef.current = note.pitch;
    onSelectNote(note.id);
    onAuditionPitch?.(note.pitch);
    setDragState({
      noteId: note.id,
      kind,
      startX: point.x,
      startY: point.y,
      originalNote: note,
      captureElement: event.currentTarget
    });
  }

  function auditionDraggedPitch(pitch: number) {
    if (dragAuditionPitchRef.current === pitch) {
      return;
    }

    dragAuditionPitchRef.current = pitch;
    onAuditionPitch?.(pitch);
  }

  function handleNoteDoubleClick(
    event: React.MouseEvent<SVGRectElement>,
    note: MotifNote
  ) {
    event.preventDefault();
    event.stopPropagation();
    onDeleteNote(note.id);
  }

  function handleResizeDoubleClick(event: React.MouseEvent<SVGRectElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleBackgroundDoubleClick(event: React.MouseEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * layout.width;
    const y = ((event.clientY - rect.top) / rect.height) * layout.height;
    const startBeat = Math.max(0, (x - LABEL_WIDTH) / PIXELS_PER_BEAT);
    const pitch = yToPitch(y, layout.maxPitch);
    const id = `n${Date.now().toString(36)}`;
    const nextNotes = addNote(notes, startBeat, pitch, id);
    onChangeNotes(nextNotes);
    onSelectNote(id);
    onAuditionPitch?.(pitch);
  }

  return (
    <section className="editor-workspace" aria-label="Piano roll editor">
      <div className="roll-status">
        <div>
          <span>{notes.length} notes</span>
          <strong>{layout.totalBeats} beats</strong>
        </div>
        <div>
          <span>Grid</span>
          <strong>1/16</strong>
        </div>
        <div>
          <span>Selected</span>
          <strong>{selectedNote ? midiToPitchName(selectedNote.pitch) : "None"}</strong>
        </div>
      </div>

      <div className="roll-scroll" tabIndex={0} style={ROLL_TOUCH_STYLE}>
        <svg
          ref={svgRef}
          className="piano-roll"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="Editable piano roll"
          style={ROLL_TOUCH_STYLE}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <rect
            className="roll-background"
            x={0}
            y={0}
            width={layout.width}
            height={layout.height}
            onPointerDown={() => onSelectNote(null)}
            onDoubleClick={handleBackgroundDoubleClick}
          />

          {layout.pitches.map((pitch) => {
            const y = pitchToY(pitch, layout.maxPitch);
            return (
              <g key={pitch}>
                <rect
                  className={isBlackKey(pitch) ? "pitch-row pitch-row-black" : "pitch-row"}
                  x={LABEL_WIDTH}
                  y={y}
                  width={layout.gridWidth}
                  height={ROW_HEIGHT}
                />
                <text className="pitch-label" x={12} y={y + 16}>
                  {midiToPitchName(pitch)}
                </text>
              </g>
            );
          })}

          {layout.beatLines.map((beat) => {
            const isBar = Number.isInteger(beat / 4);
            const x = LABEL_WIDTH + beat * PIXELS_PER_BEAT;
            return (
              <g key={beat}>
                <line
                  className={isBar ? "beat-line beat-line-bar" : "beat-line"}
                  x1={x}
                  y1={HEADER_HEIGHT}
                  x2={x}
                  y2={layout.height}
                />
                {Number.isInteger(beat) ? (
                  <text className="beat-label" x={x + 4} y={18}>
                    {beat + 1}
                  </text>
                ) : null}
              </g>
            );
          })}

          <line
            className="header-divider"
            x1={0}
            y1={HEADER_HEIGHT}
            x2={layout.width}
            y2={HEADER_HEIGHT}
          />

          <line
            className="playhead-line"
            x1={LABEL_WIDTH + Math.min(playheadBeat, layout.totalBeats) * PIXELS_PER_BEAT}
            y1={HEADER_HEIGHT}
            x2={LABEL_WIDTH + Math.min(playheadBeat, layout.totalBeats) * PIXELS_PER_BEAT}
            y2={layout.height}
          />

          {notes.map((note) => {
            const x = LABEL_WIDTH + note.startBeat * PIXELS_PER_BEAT;
            const rowY = pitchToY(note.pitch, layout.maxPitch);
            const y = rowY + 3;
            const width = Math.max(18, note.durationBeat * PIXELS_PER_BEAT);
            const hitX = Math.max(LABEL_WIDTH, x - NOTE_HIT_PADDING_X);
            const hitWidth = Math.max(
              MIN_NOTE_HIT_WIDTH,
              width + (x - hitX) + NOTE_HIT_PADDING_X
            );
            const hitY = Math.max(HEADER_HEIGHT, rowY - NOTE_HIT_PADDING_Y);
            const hitHeight = ROW_HEIGHT + NOTE_HIT_PADDING_Y * 2;
            const handleHitWidth = Math.min(HANDLE_HIT_WIDTH, hitWidth);
            const handleHitX = Math.max(hitX, x + width - handleHitWidth);
            const isSelected = note.id === selectedNoteId;

            return (
              <g key={note.id} className="note-layer">
                <rect
                  className={isSelected ? "note-block note-block-selected" : "note-block"}
                  x={x}
                  y={y}
                  width={width}
                  height={ROW_HEIGHT - 6}
                  rx={5}
                  style={NOTE_TOUCH_STYLE}
                  onPointerDown={(event) => startDrag(event, note, "move")}
                  onDoubleClick={(event) => handleNoteDoubleClick(event, note)}
                />
                <rect
                  className={isSelected ? "note-handle note-handle-selected" : "note-handle"}
                  x={x + width - HANDLE_WIDTH}
                  y={y}
                  width={HANDLE_WIDTH}
                  height={ROW_HEIGHT - 6}
                  rx={4}
                  style={NOTE_TOUCH_STYLE}
                  onPointerDown={(event) => startDrag(event, note, "resize")}
                  onDoubleClick={handleResizeDoubleClick}
                />
                <rect
                  className="note-hit-area"
                  x={hitX}
                  y={hitY}
                  width={hitWidth}
                  height={hitHeight}
                  rx={8}
                  style={NOTE_TOUCH_STYLE}
                  onPointerDown={(event) => startDrag(event, note, "move")}
                  onDoubleClick={(event) => handleNoteDoubleClick(event, note)}
                />
                <rect
                  className="note-handle-hit-area"
                  x={handleHitX}
                  y={hitY}
                  width={handleHitWidth}
                  height={hitHeight}
                  rx={8}
                  style={NOTE_TOUCH_STYLE}
                  onPointerDown={(event) => startDrag(event, note, "resize")}
                  onDoubleClick={handleResizeDoubleClick}
                />
                <text
                  className={isSelected ? "note-text note-text-selected" : "note-text"}
                  x={x + 8}
                  y={y + 14}
                  pointerEvents="none"
                >
                  {midiToPitchName(note.pitch)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

export function getPianoRollLayout(notes: MotifNote[]) {
  const minPitch = notes.length
    ? Math.min(...notes.map((note) => note.pitch)) - 4
    : 48;
  const maxPitch = notes.length
    ? Math.max(...notes.map((note) => note.pitch)) + 4
    : 72;
  const visiblePitchCount = Math.max(MIN_VISIBLE_PITCHES, maxPitch - minPitch + 1);
  const lowPitch = Math.max(0, maxPitch - visiblePitchCount + 1);
  const highPitch = Math.min(127, Math.max(maxPitch, lowPitch + visiblePitchCount - 1));
  const totalBeats = Math.max(
    MIN_VISIBLE_BEATS,
    Math.ceil(Math.max(0, ...notes.map((note) => note.startBeat + note.durationBeat)))
  );
  const gridWidth = totalBeats * PIXELS_PER_BEAT;
  const height = HEADER_HEIGHT + (highPitch - lowPitch + 1) * ROW_HEIGHT;
  const beatLines = Array.from({ length: totalBeats * 4 + 1 }, (_, index) =>
    index * DEFAULT_GRID_BEAT
  );
  const pitches = Array.from(
    { length: highPitch - lowPitch + 1 },
    (_, index) => highPitch - index
  );

  return {
    beatLines,
    gridWidth,
    height,
    maxPitch: highPitch,
    minPitch: lowPitch,
    pitches,
    totalBeats,
    width: LABEL_WIDTH + gridWidth
  };
}

function pitchToY(pitch: number, maxPitch: number): number {
  return HEADER_HEIGHT + (maxPitch - pitch) * ROW_HEIGHT;
}

function yToPitch(y: number, maxPitch: number): number {
  return clampPitch(maxPitch - Math.floor((y - HEADER_HEIGHT) / ROW_HEIGHT));
}

function isBlackKey(pitch: number): boolean {
  return BLACK_KEY_PITCH_CLASSES.has(pitch % 12);
}

function clampPitch(pitch: number): number {
  return Math.min(127, Math.max(0, Math.round(pitch)));
}

function capturePointer(element: SVGElement, pointerId: number): void {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Some mobile browsers can reject capture during synthetic or interrupted touches.
  }
}

function releasePointerCapture(element: SVGElement, pointerId: number): void {
  try {
    element.releasePointerCapture(pointerId);
  } catch {
    // Pointer capture may already be released after a touch cancel.
  }
}
