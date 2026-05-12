import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.transcription import router as transcription_router

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def create_app() -> FastAPI:
    app = FastAPI(
        title="Motif Capture API",
        version="0.0.0",
        description="Backend scaffold for humming motif transcription."
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    app.include_router(health_router, prefix="/api")
    app.include_router(transcription_router, prefix="/api")
    return app


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv("MOTIF_CORS_ORIGINS", "")
    if not raw_origins.strip():
        return DEFAULT_CORS_ORIGINS

    return [
        origin.strip().rstrip("/")
        for origin in raw_origins.split(",")
        if origin.strip()
    ]


app = create_app()
