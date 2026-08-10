"""
subgrad — Lightweight in-memory rate limiter
=================================================

Deliberately dependency-free (no slowapi/redis) so it doesn't require a
fresh `pip install` mid-sprint — matches the existing in-memory
SessionStore pattern in app/core/session.py. Scoped to the Gemini-calling
chat endpoint, which is the one with real per-call cost; the deterministic
SymPy math endpoints stay unthrottled (they're meant to be safe to call on
every keystroke per their own docstrings).

Production note: like SessionStore, this is single-process only. Swap for
Redis if you scale beyond one worker.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class FixedWindowRateLimiter:
    """Per-key fixed-window limiter: at most `limit` calls per `window_seconds`."""

    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque] = defaultdict(deque)

    def check(self, key: str) -> None:
        """Raise HTTP 429 if `key` has exceeded its quota; otherwise record the hit."""
        now = time.time()
        hits = self._hits[key]

        # Evict timestamps outside the current window.
        while hits and hits[0] <= now - self.window_seconds:
            hits.popleft()

        if len(hits) >= self.limit:
            retry_after = int(self.window_seconds - (now - hits[0])) + 1
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limited",
                    "message": (
                        f"Whoa there, speedster — that's {self.limit} requests in "
                        f"{self.window_seconds}s. Try again in {retry_after}s."
                    ),
                },
                headers={"Retry-After": str(retry_after)},
            )

        hits.append(now)


# 20 chat messages per minute per client — generous for real use, tight
# enough to blunt a runaway loop or scripted abuse hitting the Gemini API.
chat_rate_limiter = FixedWindowRateLimiter(limit=20, window_seconds=60)


def enforce_chat_rate_limit(request: Request) -> None:
    """FastAPI dependency: apply the chat rate limit keyed on client IP."""
    client_key = request.client.host if request.client else "unknown"
    chat_rate_limiter.check(client_key)
