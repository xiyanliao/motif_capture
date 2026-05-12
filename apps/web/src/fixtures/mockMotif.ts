import mockTranscription from "../../../../fixtures/mock_transcription.json";
import type { Motif } from "../domain/motif/types";
import type { TranscriptionSuccessResponse } from "../services/transcription/contract";

export const mockTranscriptionResponse =
  mockTranscription as TranscriptionSuccessResponse;

export const mockMotif = mockTranscriptionResponse.data.motif as Motif;
