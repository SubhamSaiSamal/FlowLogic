"""
subgrad 2.0 — Health Check Route
A lightweight liveness endpoint confirming the API is operational.
"""

from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()


@router.get(
    "/",
    summary="Health Check",
    description="Returns the liveness status of the subgrad 2.0 API.",
    tags=["health"],
)
async def health_check() -> dict:
    """
    Liveness probe. Returns HTTP 200 with service metadata when the API is running.
    Used by deployment orchestrators and frontend startup checks.
    """
    return {
        "status": "healthy",
        "service": "subgrad 2.0 API",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "math_engine": "SymPy (deterministic)",
        "llm_integration": "Gemini (Socratic tutor, function-calling)",
    }
