from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import router as api_router

app = FastAPI(title="Analytics Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origins.strip() for origins in settings.BACKEND_CORS_ORIGINS.split(",") if origins.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "ok"}


app.include_router(api_router, prefix="/api")
