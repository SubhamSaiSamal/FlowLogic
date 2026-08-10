"""
subgrad 2.0 — FastAPI Application Entry Point
================================================

Architecture:
  ┌─────────────────────────────────────────────────┐
  │  Frontend (React/Vite) — Phase 3               │
  │  Sends JSON payloads, renders structured        │
  │  responses. Never calls SymPy or the LLM.       │
  └────────────────────────┬────────────────────────┘
                           │ HTTP / WebSocket
  ┌────────────────────────▼────────────────────────┐
  │  FastAPI (this file)                            │
  │  Routes requests to:                            │
  │    • Math Engine (SymPy/NumPy) — deterministic │
  │    • LLM Layer (Gemini) — Phase 2 ✅            │
  └─────────────────────────────────────────────────┘

Ref: subgrad-Architecture-Guide.md §4, subgrad-2.0-Master-PRD.md §5
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import health, math as math_routes, chat as chat_routes


# ── Application Factory ───────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Deterministic math engine and AI-driven Socratic tutor for Calculus & ML. "
        "All mathematical operations are computed by SymPy — the LLM is prohibited "
        "from performing math directly (Zero-Hallucination Policy)."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc UI
    openapi_url="/openapi.json",
)


# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ───────────────────────────────────────────────────────────────────

# Health check — liveness probe for the API
app.include_router(
    health.router,
    prefix="/health",
    tags=["health"],
)

# Math engine — deterministic SymPy computation endpoints
app.include_router(
    math_routes.router,
    prefix="/api/v1/math",
    tags=["math"],
)

# Socratic AI Tutor — Gemini-powered chat with function calling to SymPy
app.include_router(
    chat_routes.router,
    prefix="/api/v1/chat",
    tags=["chat"],
)


# ── Root ──────────────────────────────────────────────────────────────────────

@app.get("/", tags=["root"], include_in_schema=False)
async def root() -> dict:
    """Redirect hint for the API root."""
    return {
        "message": "subgrad 2.0 API is running.",
        "docs": "/docs",
        "health": "/health",
        "math_engine": "/api/v1/math",
        "chat": "/api/v1/chat",
    }
