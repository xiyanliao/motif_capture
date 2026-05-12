export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    || "motif";
}

export function datedFilename(title: string, extension: string, date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `${sanitizeFilename(title)}-${stamp}.${extension}`;
}
