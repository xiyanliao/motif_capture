from typing import Any, Literal

from pydantic import BaseModel, Field


class MusicKey(BaseModel):
    tonic: str
    mode: Literal["major", "minor", "unknown"]
    confidence: float = Field(ge=0, le=1)


class MotifNote(BaseModel):
    id: str
    pitch: int = Field(ge=0, le=127)
    startBeat: float = Field(ge=0)
    durationBeat: float = Field(gt=0)
    velocity: float = Field(ge=0, le=1)
    confidence: float | None = Field(default=None, ge=0, le=1)
    startSec: float | None = Field(default=None, ge=0)
    durationSec: float | None = Field(default=None, ge=0)
    rawPitch: float | None = None


class MotifVersion(BaseModel):
    id: str
    createdAt: str
    label: str
    notes: list[MotifNote]


class MotifSource(BaseModel):
    type: Literal["recording", "upload", "manual"]
    audioBlobId: str | None = None
    engine: str | None = None
    engineVersion: str | None = None


class Motif(BaseModel):
    id: str
    title: str
    createdAt: str
    updatedAt: str
    durationSec: float = Field(ge=0)
    bpm: float = Field(gt=0)
    timeSignature: Literal["4/4", "3/4", "6/8"]
    key: MusicKey | None = None
    notes: list[MotifNote]
    tags: list[str]
    source: MotifSource | None = None
    versions: list[MotifVersion]


class HealthResponse(BaseModel):
    ok: bool
    engine: str
    version: str


class TranscriptionOptions(BaseModel):
    bpm: float | None = Field(default=None, gt=0)
    quantizeGrid: Literal["off", "1/8", "1/16", "1/32"] | None = None
    forceMonophonic: bool | None = None
    keyHint: str | None = None
    minNoteDurationMs: int | None = Field(default=None, ge=0)
    mergeGapMs: int | None = Field(default=None, ge=0)


class TranscriptionData(BaseModel):
    motif: Motif


class TranscriptionSuccessResponse(BaseModel):
    ok: Literal[True]
    data: TranscriptionData
    warnings: list[str]


class ApiError(BaseModel):
    code: Literal[
        "INVALID_AUDIO",
        "TRANSCRIPTION_FAILED",
        "ENGINE_NOT_AVAILABLE",
        "POSTPROCESS_FAILED"
    ]
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class TranscriptionErrorResponse(BaseModel):
    ok: Literal[False]
    error: ApiError
