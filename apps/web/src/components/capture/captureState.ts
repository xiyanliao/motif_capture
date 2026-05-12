export type CaptureActionAvailability = {
  hasAudio: boolean;
  hasTranscriptionApi: boolean;
  isAnalyzing: boolean;
  isRecording: boolean;
};

export function canAnalyzeAudio({
  hasAudio,
  isAnalyzing,
  isRecording
}: Omit<CaptureActionAvailability, "hasTranscriptionApi">): boolean {
  return hasAudio && !isAnalyzing && !isRecording;
}

export function canRunBasicPitch({
  hasAudio,
  hasTranscriptionApi,
  isAnalyzing,
  isRecording
}: CaptureActionAvailability): boolean {
  return (
    canAnalyzeAudio({
      hasAudio,
      isAnalyzing,
      isRecording
    }) && hasTranscriptionApi
  );
}

export function productionApiStatusMessage(
  isProduction: boolean,
  hasTranscriptionApi: boolean
): string | null {
  if (!isProduction || hasTranscriptionApi) {
    return null;
  }

  return "Basic Pitch needs a deployed HTTPS API. Set VITE_API_BASE_URL in Cloudflare Pages.";
}
