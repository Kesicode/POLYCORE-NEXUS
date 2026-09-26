"""Health check router for the AI service."""
import time
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
_start_time = time.time()


class HealthResponse(BaseModel):
    service: str
    status: str
    uptime_seconds: float


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        service="ai-service",
        status="ok",
        uptime_seconds=round(time.time() - _start_time, 2),
    )


@router.get("/ready")
async def ready():
    return {"service": "ai-service", "status": "ready"}
