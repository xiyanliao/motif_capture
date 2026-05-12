from typing import Annotated, Literal

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse

from app.schemas import ApiError, TranscriptionOptions, TranscriptionSuccessResponse
from app.services.mock_transcription import create_mock_transcription
from app.services.transcription_pipeline import (
    EngineUnavailableError,
    PostprocessError,
    TranscriptionEngineError,
    transcribe_with_basic_pitch,
)

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
    engine: Annotated[Literal["mock", "basic-pitch"], Form()] = "mock",
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

    if engine == "mock":
        return create_mock_transcription(file.filename or "uploaded.wav", options)

    try:
        return transcribe_with_basic_pitch(file.filename or "uploaded.wav", content, options)
    except EngineUnavailableError as exc:
        return error_response(
            503,
            "ENGINE_NOT_AVAILABLE",
            "Basic Pitch is not available in this environment.",
            {"reason": str(exc)},
        )
    except TranscriptionEngineError as exc:
        return error_response(
            500,
            "TRANSCRIPTION_FAILED",
            "Could not transcribe audio.",
            {"reason": str(exc)},
        )
    except PostprocessError as exc:
        return error_response(
            500,
            "POSTPROCESS_FAILED",
            "Could not normalize transcribed notes.",
            {"reason": str(exc)},
        )


def error_response(
    status_code: int,
    code: Literal[
        "INVALID_AUDIO",
        "TRANSCRIPTION_FAILED",
        "ENGINE_NOT_AVAILABLE",
        "POSTPROCESS_FAILED",
    ],
    message: str,
    details: dict,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "ok": False,
            "error": ApiError(
                code=code,
                message=message,
                details=details,
            ).model_dump(),
        },
    )
