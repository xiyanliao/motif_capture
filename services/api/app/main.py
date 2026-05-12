from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.transcription import router as transcription_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Motif Capture API",
        version="0.0.0",
        description="Backend scaffold for humming motif transcription."
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    app.include_router(health_router, prefix="/api")
    app.include_router(transcription_router, prefix="/api")
    return app


app = create_app()
