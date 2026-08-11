"""
subgrad 2.0 — Application Configuration
Manages environment-driven settings using pydantic-settings.
All CORS, debug, and future API key settings live here.
"""

from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from pydantic import field_validator
from typing import Annotated, List


class Settings(BaseSettings):
    """
    Central settings object. Values are read from the environment (or .env file).
    Defaults are safe for local development.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "subgrad 2.0 API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Allow the React / Vite frontend during development.
    # Override via CORS_ORIGINS env var — either a bare URL, a comma-separated
    # list, or a JSON array. NoDecode is load-bearing: without it pydantic-settings
    # json.loads() this field before the validator below ever runs, so any non-JSON
    # value (e.g. the plain "https://subgrad.vercel.app" the deploy runbook tells you
    # to paste into Render) raises SettingsError at import and the app never boots.
    CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:3000",   # React CRA / Next.js
        "http://localhost:5173",   # Vite
        "http://localhost:8080",   # Generic dev
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Allow CORS_ORIGINS to be supplied as a comma-separated string or JSON array."""
        if isinstance(v, str):
            # Strip brackets if JSON array style
            v = v.strip("[]").replace('"', "").replace("'", "")
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # ── Gemini AI (Phase 2 — Socratic Tutor) ────────────────────────────────
    # gemini-2.5-flash was retired for new API keys/projects (still works for
    # older grandfathered ones, which is why this stayed hidden in dev — see
    # MVP_SPRINT_LOG.md). gemini-3.6-flash is the current stable (non-preview)
    # flash-tier model as of Aug 2026, confirmed available to a freshly-created
    # key: cheaper output tokens than 2.5-flash was, and explicitly built for
    # agentic/tool-calling workloads, which is exactly what the Socratic
    # function-calling loop in gemini_client.py needs.
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"


# Singleton — import this everywhere
settings = Settings()
