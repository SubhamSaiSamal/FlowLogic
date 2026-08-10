"""
subgrad 2.0 — Chat & Session Tests
======================================

Tests for Phase 2 (Socratic AI Integration):
  - Session CRUD (create, get, delete)
  - Session state management (hint escalation, error tracking)
  - Chat endpoint validation (missing session, empty message)
  - Tool dispatch (verifier.py function routing)
  - System prompt construction

NOTE: Tests that require a live Gemini API key are marked with
@pytest.mark.skipif and will only run when GEMINI_API_KEY is set.
The core session and dispatch logic is tested without any API calls.
"""

import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.session import (
    Session,
    SessionStore,
    MessageRole,
    HintLevel,
)
from app.core.gemini_client import _dispatch_tool_call

client = TestClient(app)


# ════════════════════════════════════════════════════════════════════════════
# 1. SESSION STATE MANAGEMENT (No API key needed)
# ════════════════════════════════════════════════════════════════════════════

class TestSession:

    def test_create_session(self):
        session = Session()
        assert session.session_id is not None
        assert len(session.session_id) == 32  # UUID hex

    def test_create_session_with_goal(self):
        session = Session()
        session.set_goal("Differentiate x*sin(x)")
        assert session.current_goal == "Differentiate x*sin(x)"
        assert session.hint_level == HintLevel.CONCEPTUAL_NUDGE

    def test_add_message(self):
        session = Session()
        session.add_message(MessageRole.USER, "Hello")
        session.add_message(MessageRole.TUTOR, "Welcome!")
        assert len(session.history) == 2
        assert session.history[0].role == MessageRole.USER
        assert session.history[1].role == MessageRole.TUTOR

    def test_hint_escalation_requires_3_errors(self):
        """Hint level shouldn't escalate until 3 consecutive errors."""
        session = Session()
        assert session.hint_level == HintLevel.CONCEPTUAL_NUDGE

        session.escalate_hint()  # 1 error
        assert session.hint_level == HintLevel.CONCEPTUAL_NUDGE

        session.escalate_hint()  # 2 errors
        assert session.hint_level == HintLevel.CONCEPTUAL_NUDGE

        session.escalate_hint()  # 3 errors → escalate
        assert session.hint_level == HintLevel.STRUCTURAL_HINT

    def test_hint_escalation_full_progression(self):
        session = Session()

        # Level 1 → 2
        for _ in range(3):
            session.escalate_hint()
        assert session.hint_level == HintLevel.STRUCTURAL_HINT

        # Level 2 → 3
        for _ in range(3):
            session.escalate_hint()
        assert session.hint_level == HintLevel.MECHANICAL_GUIDANCE

        # Level 3 → 4
        for _ in range(3):
            session.escalate_hint()
        assert session.hint_level == HintLevel.NEAR_ANSWER

    def test_hint_caps_at_near_answer(self):
        """Hint level must NEVER exceed NEAR_ANSWER (PRD: never reveal solution)."""
        session = Session()

        # Force to max level
        for _ in range(20):
            session.escalate_hint()
        assert session.hint_level == HintLevel.NEAR_ANSWER

    def test_correct_answer_resets_hints(self):
        session = Session()
        for _ in range(3):
            session.escalate_hint()
        assert session.hint_level == HintLevel.STRUCTURAL_HINT

        session.record_correct()
        assert session.hint_level == HintLevel.CONCEPTUAL_NUDGE
        assert session.consecutive_errors == 0

    def test_error_categorization(self):
        session = Session()
        session.record_error("syntax")
        session.record_error("arithmetic")
        session.record_error("conceptual")
        session.record_error("conceptual")

        assert session.error_categories["syntax"] == 1
        assert session.error_categories["arithmetic"] == 1
        assert session.error_categories["conceptual"] == 2
        assert session.total_errors == 4


class TestSessionStore:

    def test_create_and_get(self):
        store = SessionStore()
        session = store.create(goal="Test goal")
        retrieved = store.get(session.session_id)
        assert retrieved is not None
        assert retrieved.current_goal == "Test goal"

    def test_get_nonexistent(self):
        store = SessionStore()
        assert store.get("nonexistent") is None

    def test_delete(self):
        store = SessionStore()
        session = store.create()
        assert store.delete(session.session_id) is True
        assert store.get(session.session_id) is None

    def test_delete_nonexistent(self):
        store = SessionStore()
        assert store.delete("nonexistent") is False

    def test_list_sessions(self):
        store = SessionStore()
        s1 = store.create()
        s2 = store.create()
        ids = store.list_sessions()
        assert s1.session_id in ids
        assert s2.session_id in ids

    def test_count(self):
        store = SessionStore()
        store.create()
        store.create()
        store.create()
        assert store.count == 3


# ════════════════════════════════════════════════════════════════════════════
# 2. TOOL DISPATCH (No API key needed — tests SymPy routing)
# ════════════════════════════════════════════════════════════════════════════

class TestToolDispatch:

    def test_dispatch_derivative(self):
        result = _dispatch_tool_call("compute_derivative", {
            "expression": "x**2 + 3*x",
            "variable": "x",
            "order": 1,
        })
        assert result["success"] is True
        assert "derivative_expr" in result

    def test_dispatch_equivalence_true(self):
        result = _dispatch_tool_call("check_equivalence", {
            "expression1": "x*(x + 1)",
            "expression2": "x**2 + x",
        })
        assert result["equivalent"] is True

    def test_dispatch_equivalence_false(self):
        result = _dispatch_tool_call("check_equivalence", {
            "expression1": "x**2",
            "expression2": "x**3",
        })
        assert result["equivalent"] is False

    def test_dispatch_integral(self):
        result = _dispatch_tool_call("compute_integral", {
            "expression": "2*x + 3",
            "variable": "x",
        })
        assert result["success"] is True

    def test_dispatch_validate_valid(self):
        result = _dispatch_tool_call("validate_expression", {
            "expression": "x**2 + sin(x)",
        })
        assert result["valid"] is True
        assert "latex" in result

    def test_dispatch_validate_invalid(self):
        result = _dispatch_tool_call("validate_expression", {
            "expression": "import os",
        })
        assert result["valid"] is False
        assert "error" in result

    def test_dispatch_unknown_function(self):
        result = _dispatch_tool_call("nonexistent_function", {})
        assert "error" in result

    def test_dispatch_parse_error(self):
        result = _dispatch_tool_call("compute_derivative", {
            "expression": "",
        })
        assert "error" in result
        assert result["error_type"] == "parse_error"


# ════════════════════════════════════════════════════════════════════════════
# 3. FASTAPI ENDPOINT TESTS (No API key needed for session endpoints)
# ════════════════════════════════════════════════════════════════════════════

class TestSessionEndpoints:

    def test_create_session(self):
        response = client.post("/api/v1/chat/session", json={})
        assert response.status_code == 200
        body = response.json()
        assert "session_id" in body
        assert body["message"]

    def test_create_session_with_goal(self):
        response = client.post("/api/v1/chat/session", json={
            "goal": "Find the derivative of x*sin(x)"
        })
        assert response.status_code == 200
        assert response.json()["goal"] == "Find the derivative of x*sin(x)"

    def test_get_session(self):
        # Create first
        create_resp = client.post("/api/v1/chat/session", json={})
        session_id = create_resp.json()["session_id"]

        # Get
        response = client.get(f"/api/v1/chat/session/{session_id}")
        assert response.status_code == 200
        body = response.json()
        assert body["session_id"] == session_id
        assert body["hint_level"] == 1

    def test_get_nonexistent_session(self):
        response = client.get("/api/v1/chat/session/nonexistent")
        assert response.status_code == 404

    def test_delete_session(self):
        create_resp = client.post("/api/v1/chat/session", json={})
        session_id = create_resp.json()["session_id"]

        response = client.delete(f"/api/v1/chat/session/{session_id}")
        assert response.status_code == 200
        assert response.json()["deleted"] is True

        # Verify it's gone
        assert client.get(f"/api/v1/chat/session/{session_id}").status_code == 404

    def test_delete_nonexistent_session(self):
        response = client.delete("/api/v1/chat/session/nonexistent")
        assert response.status_code == 404


class TestChatMessageEndpoint:

    def test_message_missing_session(self):
        """Sending to a non-existent session should return 404."""
        response = client.post("/api/v1/chat/message", json={
            "session_id": "nonexistent",
            "message": "Hello",
        })
        assert response.status_code == 404

    def test_message_empty_body(self):
        """Empty message should fail Pydantic validation."""
        create_resp = client.post("/api/v1/chat/session", json={})
        session_id = create_resp.json()["session_id"]

        response = client.post("/api/v1/chat/message", json={
            "session_id": session_id,
            # missing "message"
        })
        assert response.status_code == 422


# ════════════════════════════════════════════════════════════════════════════
# 4. LIVE GEMINI INTEGRATION (requires API key)
# ════════════════════════════════════════════════════════════════════════════

HAS_API_KEY = bool(os.environ.get("GEMINI_API_KEY"))


@pytest.mark.skipif(not HAS_API_KEY, reason="GEMINI_API_KEY not set")
class TestLiveGeminiIntegration:

    def test_chat_roundtrip(self):
        """Full roundtrip: create session → send message → get Socratic response."""
        # Create session
        create_resp = client.post("/api/v1/chat/session", json={
            "goal": "Find the derivative of x^2"
        })
        session_id = create_resp.json()["session_id"]

        # Send message
        response = client.post("/api/v1/chat/message", json={
            "session_id": session_id,
            "message": "What is the derivative of x squared?",
        })
        assert response.status_code == 200
        body = response.json()
        assert body["tutor_response"]
        assert len(body["tutor_response"]) > 10
        assert body["session_id"] == session_id
