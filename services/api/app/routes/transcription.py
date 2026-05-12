from typing import Annotated, Literal

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse

from app.schemas import ApiError, TranscriptionOptions, TranscriptionSuccessResponse
from app.services.mock_transcription import create_mock_transcription

router = APIRouter(tags=["transcription"])


@router.post("/transcribe", response_model=TranscriptionSuccessResponse)
async def transcribe(
    file: Annotated[UploadFile, File()],
    bpm: Annotated[float | None, Form()] = None,
    quantizeGrid: Annotated[Literal["off", "1/8", "1/16", "1/32"] | None, Form()] = None,
    forceMonophonic: Annotated[bool | None, Form()] = None,
    keyHint: Annotated[str | None, Form()] = None,
    minNoteDurationMs: Annotated[int | None, Form()] = None,
    mergeGapMs: Annotated[int | None, Form()] = None,
) -> TranscriptionSuccessResponse | JSONResponse:
    content = await file.read()
    if not content:
        return JSONResponse(
            status_code=400,
            content={
                "ok": False,
                "error": ApiError(
                    code="INVALID_AUDIO",
                    message="Uploaded audio file is empty.",
                    details={"filename": file.filename},
                ).model_dump(),
            },
        )

    options = TranscriptionOptions(
        bpm=bpm,
        quantizeGrid=quantizeGrid,
        forceMonophonic=forceMonophonic,
        keyHint=keyHint,
        minNoteDurationMs=minNoteDurationMs,
        mergeGapMs=mergeGapMs,
    )
    return create_mock_transcription(file.filename or "uploaded.wav", options)
