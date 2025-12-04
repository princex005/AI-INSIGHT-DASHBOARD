from fastapi import APIRouter

from . import auth

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])

# TODO: include upload, summary, forecast, ai, reports routers here as they are implemented.
