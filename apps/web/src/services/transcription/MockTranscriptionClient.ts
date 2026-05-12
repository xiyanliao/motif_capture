import { mockTranscriptionResponse } from "../../fixtures/mockMotif";
import type {
  TranscriptionClient,
  TranscriptionOptions,
  TranscriptionResponse
} from "./contract";

export class MockTranscriptionClient implements TranscriptionClient {
  async transcribe(
    _file: Blob,
    _options: TranscriptionOptions
  ): Promise<TranscriptionResponse> {
    return structuredClone(mockTranscriptionResponse);
  }
}
