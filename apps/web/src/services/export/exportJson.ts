import type { Motif } from "../../domain/motif/types";

export type MotifJsonEnvelope = {
  version: 1;
  exportedAt: string;
  motif: Motif;
};

export function serializeMotifJson(motif: Motif, exportedAt = new Date().toISOString()): string {
  const envelope: MotifJsonEnvelope = {
    version: 1,
    exportedAt,
    motif
  };

  return `${JSON.stringify(envelope, null, 2)}\n`;
}

export function parseMotifJson(json: string): Motif {
  const parsed = JSON.parse(json) as Partial<MotifJsonEnvelope> | Motif;

  if (isEnvelope(parsed)) {
    return parsed.motif;
  }

  if (isMotif(parsed)) {
    return parsed;
  }

  throw new Error("Invalid Motif JSON.");
}

export function exportJsonBlob(motif: Motif): Blob {
  return new Blob([serializeMotifJson(motif)], {
    type: "application/json;charset=utf-8"
  });
}

async function readFileText(file: File): Promise<string> {
  return file.text();
}

export async function importMotifFromJsonFile(file: File): Promise<Motif> {
  return parseMotifJson(await readFileText(file));
}

function isEnvelope(value: Partial<MotifJsonEnvelope> | Motif): value is MotifJsonEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    value.version === 1 &&
    "motif" in value &&
    isMotif(value.motif)
  );
}

function isMotif(value: unknown): value is Motif {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "title" in value &&
    "notes" in value &&
    Array.isArray((value as { notes: unknown }).notes)
  );
}
