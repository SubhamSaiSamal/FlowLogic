"""
subgrad 2.0 — Chat Router (Socratic Tutor API)
==================================================

Endpoints for the AI-powered Socratic tutoring interface.
All mathematical claims made by the AI are backed by the SymPy engine
via Gemini function calling — enforcing the Zero-Hallucination Policy.

Routes:
  POST   /api/v1/chat/session              — Create a new tutoring session
  GET    /api/v1/chat/session/{session_id}  — Get session info and history
  DELETE /api/v1/chat/session/{session_id}  — End a session
  POST   /api/v1/chat/message              — Send a message and get Socratic response

Ref: subgrad-2.0-Master-PRD.md §4.A (Socratic Dialogue Engine)
     subgrad-Architecture-Guide.md §3 (Socratic Tutor Directive)
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.session import session_store, Session, MessageRole, HintLevel
from app.core.gemini_client import get_tutor
from app.core.rate_limit import enforce_chat_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Request / Response Models ─────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    """Request body for creating a new tutoring session."""
    goal: Optional[str] = Field(
        default=None,
        description=(
            "The mathematical goal for this session. "
            "e.g., 'Learn to differentiate products of functions using the product rule.' "
            "If omitted, the tutor will determine the goal from the conversation."
        ),
        examples=[
            "Find the derivative of x*sin(x)",
            "Learn the chain rule for composite functions",
            "Understand gradient descent on a loss surface",
        ],
    )


class CreateSessionResponse(BaseModel):
    """Response body for session creation."""
    session_id: str
    goal: Optional[str]
    message: str


class RehydrateMessage(BaseModel):
    """A single saved message replayed into a rehydrated session's history."""
    role: str = Field(..., description="'user' or 'tutor'.")
    content: str = Field(..., min_length=1, max_length=8192)


class RehydrateSessionRequest(BaseModel):
    """
    Request body for rebuilding Gemini context from a session saved client-side
    (e.g. in Supabase). The backend session store is in-memory only, so any
    session_id from a previous process is gone after a restart/reload — this
    endpoint mints a fresh in-memory Session and replays the saved transcript
    into its history so the tutor has real conversational context again,
    instead of just the bare goal text.
    """
    messages: list[RehydrateMessage] = Field(default_factory=list)
    goal: Optional[str] = Field(default=None)
    hint_level: int = Field(default=1, ge=1, le=4)


class RehydrateSessionResponse(BaseModel):
    """Response body for session rehydration."""
    session_id: str
    goal: Optional[str]
    hint_level: int
    replayed_messages: int
    message: str


class ChatMessageRequest(BaseModel):
    """Request body for sending a chat message."""
    session_id: str = Field(
        ...,
        description="The session ID returned from POST /session.",
    )
    message: str = Field(
        ...,
        description="The user's message to the Socratic tutor.",
        min_length=1,
        max_length=2048,
        examples=[
            "What is the derivative of x*sin(x)?",
            "I think the answer is sin(x) + x*cos(x)",
            "I'm stuck, can you give me a hint?",
        ],
    )


class ChatMessageResponse(BaseModel):
    """Response body from the Socratic tutor."""
    session_id: str
    tutor_response: str = Field(
        description="The tutor's Socratic response, possibly containing LaTeX.",
    )
    hint_level: int = Field(
        description="Current hint specificity level (1-4).",
    )
    current_goal: Optional[str] = Field(
        description="The active mathematical goal for this session.",
    )
    tool_used: Optional[str] = Field(
        default=None,
        description="If a SymPy tool was called during this turn, the name of the verification engine.",
    )
    outcome: Optional[str] = Field(
        default=None,
        description="'correct' or 'incorrect' if the tutor judged a submission this turn, else null.",
    )
    error_category: Optional[str] = Field(
        default=None,
        description="When outcome is 'incorrect': 'syntax', 'arithmetic', or 'conceptual'.",
    )


class SessionInfoResponse(BaseModel):
    """Detailed session information."""
    session_id: str
    current_goal: Optional[str]
    hint_level: int
    consecutive_errors: int
    total_errors: int
    total_correct: int
    error_categories: dict[str, int]
    message_count: int
    created_at: float
    updated_at: float


# ── Route Handlers ────────────────────────────────────────────────────────────

@router.post(
    "/session",
    response_model=CreateSessionResponse,
    summary="Create a new tutoring session",
    description=(
        "Initialize a new Socratic tutoring session. Optionally provide a "
        "mathematical goal to focus the tutor's guidance. Returns a session_id "
        "to use in subsequent /message calls."
    ),
)
async def create_session(request: CreateSessionRequest) -> CreateSessionResponse:
    """Create a new tutoring session with optional mathematical goal."""
    session = session_store.create(goal=request.goal)

    logger.info(f"Session created: {session.session_id} | Goal: {request.goal}")

    return CreateSessionResponse(
        session_id=session.session_id,
        goal=session.current_goal,
        message=(
            f"Session created. "
            f"{'Goal set: ' + session.current_goal if session.current_goal else 'No specific goal set — the tutor will adapt to your questions.'} "
            f"Send your first message to begin."
        ),
    )


@router.post(
    "/session/rehydrate",
    response_model=RehydrateSessionResponse,
    summary="Rebuild a Socratic session's Gemini context from a saved transcript",
    description=(
        "The backend session store is in-memory only — restarting the server "
        "or reloading the page loses all live sessions. A client that persists "
        "transcripts elsewhere (e.g. Supabase) can call this to mint a fresh "
        "session and replay the saved messages into its history, so the tutor "
        "has real conversational context instead of starting cold with only "
        "the goal text."
    ),
)
async def rehydrate_session(request: RehydrateSessionRequest) -> RehydrateSessionResponse:
    """Mint a new in-memory Session and replay a saved transcript into its history."""
    session = session_store.create(goal=request.goal)
    session.hint_level = HintLevel(request.hint_level)

    replayed = 0
    for msg in request.messages:
        role = MessageRole.USER if msg.role == "user" else MessageRole.TUTOR
        session.add_message(role, msg.content)
        replayed += 1

    logger.info(
        f"Session rehydrated: {session.session_id} | Goal: {request.goal} | "
        f"Replayed {replayed} messages"
    )

    return RehydrateSessionResponse(
        session_id=session.session_id,
        goal=session.current_goal,
        hint_level=session.hint_level.value,
        replayed_messages=replayed,
        message=f"Session rehydrated with {replayed} prior messages.",
    )


@router.get(
    "/session/{session_id}",
    response_model=SessionInfoResponse,
    summary="Get session information",
    description="Retrieve the current state of a tutoring session including history stats.",
)
async def get_session(session_id: str) -> SessionInfoResponse:
    """Get detailed information about a tutoring session."""
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found. Create a new session first.",
        )

    return SessionInfoResponse(
        session_id=session.session_id,
        current_goal=session.current_goal,
        hint_level=session.hint_level.value,
        consecutive_errors=session.consecutive_errors,
        total_errors=session.total_errors,
        total_correct=session.total_correct,
        error_categories=session.error_categories,
        message_count=len(session.history),
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.delete(
    "/session/{session_id}",
    summary="End a tutoring session",
    description="Delete a tutoring session and its conversation history.",
)
async def delete_session(session_id: str) -> dict:
    """End and delete a tutoring session."""
    existed = session_store.delete(session_id)
    if not existed:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found.",
        )

    logger.info(f"Session deleted: {session_id}")
    return {"deleted": True, "session_id": session_id}


@router.post(
    "/message",
    response_model=ChatMessageResponse,
    summary="Send a message to the Socratic tutor",
    description=(
        "Send a user message and receive a Socratic response from the AI tutor. "
        "The tutor will guide you through mathematical concepts using questions, "
        "hints, and step-by-step decomposition — it will NEVER give the final "
        "answer directly. All mathematical verification is performed by the "
        "deterministic SymPy engine via function calling. "
        "Rate-limited to 20 requests/minute per client to bound Gemini API cost."
    ),
    dependencies=[Depends(enforce_chat_rate_limit)],
)
async def send_message(request: ChatMessageRequest) -> ChatMessageResponse:
    """
    Main chat endpoint. Implements the full Socratic dialogue loop:

    1. Retrieve the user's session (with history + hint state)
    2. Forward the message to the Gemini tutor
    3. Gemini may call SymPy tools (derivative, equivalence, etc.)
    4. Tool results fed back → Gemini generates Socratic response
    5. Response + updated session state returned to frontend

    Ref: PRD §5 (Data Flow), Architecture Guide §4 (Strict Decoupling)
    """
    # Look up session
    session = session_store.get(request.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Session '{request.session_id}' not found. "
                "Please create a new session first via POST /api/v1/chat/session."
            ),
        )

    try:
        # Get the Socratic tutor and send the message
        tutor = get_tutor()
        response_text, tools_used, outcome = await tutor.send_message(request.message, session)

        return ChatMessageResponse(
            session_id=session.session_id,
            tutor_response=response_text,
            hint_level=session.hint_level.value,
            current_goal=session.current_goal,
            tool_used="SymPy Verifier" if tools_used else None,
            outcome=(None if outcome is None else ("correct" if outcome["is_correct"] else "incorrect")),
            error_category=(None if outcome is None else outcome["error_category"]),
        )

    except ValueError as e:
        # Gemini API key not configured
        raise HTTPException(
            status_code=503,
            detail={
                "error": "ai_unavailable",
                "message": str(e),
                "fallback": (
                    "The Socratic AI tutor is not configured. "
                    "The deterministic math engine at /api/v1/math/ is still available."
                ),
            },
        )

    except Exception as e:
        logger.error(f"Chat error for session {request.session_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "internal_error",
                "message": "An unexpected error occurred. Please try again.",
            },
        )
