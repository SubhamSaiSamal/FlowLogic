"""
subgrad 2.0 — In-Memory Session State Manager
=================================================

Implements stateful conversation management as mandated by:
  - PRD §4.A (Stateful Conversation Management)
  - Architecture Guide §4 (State and conversation history managed in backend)

Each session tracks:
  - Conversation history (full message list for Gemini context)
  - The current mathematical goal (e.g., "Find the derivative of x*sin(x)")
  - Hint escalation level per problem
  - User's error history for adaptive pedagogy

This is an in-memory store suitable for single-process development.
For production, swap the dict with Redis/Postgres.
"""

import uuid
import time
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


# ── Enums ─────────────────────────────────────────────────────────────────────

class MessageRole(str, Enum):
    """Role labels for conversation history entries."""
    USER = "user"
    TUTOR = "tutor"
    SYSTEM = "system"
    TOOL = "tool"


class HintLevel(int, Enum):
    """
    Progressive hint escalation levels (PRD §4.A — Progressive Hinting).
    The AI starts at CONCEPTUAL_NUDGE and escalates only on repeated struggles.
    """
    CONCEPTUAL_NUDGE = 1      # "What rule applies here?"
    STRUCTURAL_HINT = 2       # "Can you identify u and v?"
    MECHANICAL_GUIDANCE = 3   # "The product rule says... now compute u'"
    NEAR_ANSWER = 4           # "Your u'v term is correct, check v'"


# ── Data Models ───────────────────────────────────────────────────────────────

class ConversationMessage(BaseModel):
    """A single message in the conversation history."""
    role: MessageRole
    content: str
    timestamp: float = Field(default_factory=time.time)


class Session(BaseModel):
    """
    Complete state for a single tutoring session.

    Stores everything the backend needs to maintain Socratic continuity
    across multiple exchanges — the mathematical goal, conversation history,
    current hint level, and error tracking.
    """
    session_id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)

    # ── Mathematical Context ──
    current_goal: Optional[str] = Field(
        default=None,
        description=(
            "The overarching mathematical problem being worked on. "
            "e.g., 'Find the derivative of x*sin(x) using the product rule.'"
        ),
    )

    # ── Conversation History ──
    # Full message history. This is sent to Gemini for context continuity.
    history: list[ConversationMessage] = Field(default_factory=list)

    # ── Hint Escalation ──
    hint_level: HintLevel = Field(
        default=HintLevel.CONCEPTUAL_NUDGE,
        description="Current hint specificity level. Escalates on repeated failures.",
    )
    consecutive_errors: int = Field(
        default=0,
        description="Number of consecutive incorrect attempts on the current sub-step.",
    )

    # ── Error Tracking ──
    total_errors: int = 0
    total_correct: int = 0
    error_categories: dict[str, int] = Field(
        default_factory=lambda: {"syntax": 0, "arithmetic": 0, "conceptual": 0},
    )

    def add_message(self, role: MessageRole, content: str) -> None:
        """Append a message and update the session timestamp."""
        self.history.append(ConversationMessage(role=role, content=content))
        self.updated_at = time.time()

    def escalate_hint(self) -> HintLevel:
        """
        Escalate the hint level after a wrong answer.
        Caps at NEAR_ANSWER (Level 4) — we never give away the full solution.
        """
        self.consecutive_errors += 1
        self.total_errors += 1

        if self.consecutive_errors >= 3 and self.hint_level.value < HintLevel.NEAR_ANSWER.value:
            self.hint_level = HintLevel(self.hint_level.value + 1)
            self.consecutive_errors = 0  # Reset counter after escalation

        return self.hint_level

    def record_correct(self) -> None:
        """Record a correct answer and reset hint escalation."""
        self.total_correct += 1
        self.consecutive_errors = 0
        self.hint_level = HintLevel.CONCEPTUAL_NUDGE

    def record_error(self, category: str) -> None:
        """Record an error of a specific category (syntax, arithmetic, conceptual)."""
        if category in self.error_categories:
            self.error_categories[category] += 1
        self.escalate_hint()

    def set_goal(self, goal: str) -> None:
        """Set or update the current mathematical goal and reset hint level."""
        self.current_goal = goal
        self.hint_level = HintLevel.CONCEPTUAL_NUDGE
        self.consecutive_errors = 0
        self.updated_at = time.time()


# ── In-Memory Session Store ───────────────────────────────────────────────────

class SessionStore:
    """
    Thread-safe in-memory session store.

    Production note: Replace this dict-based store with Redis or a database
    for multi-process deployments.
    """

    def __init__(self):
        self._sessions: dict[str, Session] = {}

    def create(self, goal: Optional[str] = None) -> Session:
        """Create and register a new session."""
        session = Session()
        if goal:
            session.set_goal(goal)
        self._sessions[session.session_id] = session
        return session

    def get(self, session_id: str) -> Optional[Session]:
        """Retrieve a session by ID. Returns None if not found."""
        return self._sessions.get(session_id)

    def delete(self, session_id: str) -> bool:
        """Delete a session. Returns True if it existed."""
        return self._sessions.pop(session_id, None) is not None

    def list_sessions(self) -> list[str]:
        """Return all active session IDs."""
        return list(self._sessions.keys())

    @property
    def count(self) -> int:
        """Number of active sessions."""
        return len(self._sessions)


# ── Singleton ─────────────────────────────────────────────────────────────────
# Import and use this everywhere.
session_store = SessionStore()
