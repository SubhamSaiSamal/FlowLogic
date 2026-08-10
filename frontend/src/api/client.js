/**
 * subgrad 2.0 — API Client
 * ============================
 *
 * All communication with the FastAPI backend goes through this module.
 * The frontend knows nothing about the LLM — it only sends user inputs
 * and renders structured JSON responses.
 *
 * Ref: subgrad-Architecture-Guide.md §4 (Strict Decoupling)
 */

// Configurable per environment. Set VITE_API_BASE in .env for deploys;
// falls back to the local FastAPI dev server.
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/**
 * Create a new tutoring session.
 * @param {string|null} goal - Optional mathematical goal for the session.
 * @returns {Promise<{session_id: string, goal: string|null, message: string}>}
 */
export async function createSession(goal = null) {
  const res = await fetch(`${API_BASE}/api/v1/chat/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create session: ${res.status}`);
  }

  return res.json();
}

/**
 * Send a message to the Socratic tutor and get a response.
 * @param {string} sessionId - The active session ID.
 * @param {string} message   - The user's message.
 * @returns {Promise<{session_id: string, tutor_response: string, hint_level: number, current_goal: string|null}>}
 */
export async function sendMessage(sessionId, message) {
  const res = await fetch(`${API_BASE}/api/v1/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      message,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const detail = errorBody?.detail?.message || errorBody?.detail || `Server error: ${res.status}`;
    throw new Error(detail);
  }

  return res.json();
}

/**
 * Rebuild a session's Gemini context from a saved transcript.
 *
 * The backend session store is in-memory only, so reopening a session saved
 * in a previous process (page reload, server restart) has no live context
 * for the tutor — this replays the saved messages into a fresh in-memory
 * session so the tutor responds with real continuity instead of just the
 * bare goal text.
 *
 * @param {Array<{role: string, content: string}>} messages - Saved transcript, oldest first.
 * @param {string|null} goal - The session's mathematical goal, if known.
 * @param {number} hintLevel - The hint level to restore (1-4).
 * @returns {Promise<{session_id: string, goal: string|null, hint_level: number, replayed_messages: number}>}
 */
export async function rehydrateSession(messages, goal = null, hintLevel = 1) {
  const res = await fetch(`${API_BASE}/api/v1/chat/session/rehydrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages
        .filter((m) => m.role === "user" || m.role === "tutor")
        .map((m) => ({ role: m.role, content: m.content })),
      goal,
      hint_level: hintLevel,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to rehydrate session: ${res.status}`);
  }

  return res.json();
}

/**
 * Get session information.
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export async function getSession(sessionId) {
  const res = await fetch(`${API_BASE}/api/v1/chat/session/${sessionId}`);

  if (!res.ok) {
    throw new Error(`Failed to get session: ${res.status}`);
  }

  return res.json();
}

/**
 * Delete / end a tutoring session.
 * @param {string} sessionId
 * @returns {Promise<{deleted: boolean, session_id: string}>}
 */
export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/api/v1/chat/session/${sessionId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Failed to delete session: ${res.status}`);
  }

  return res.json();
}

/**
 * Derive a short session title from the user's first message.
 *
 * This used to round-trip through the Gemini chat endpoint with a
 * never-created `session_id`, which 404'd on every call and silently fell
 * back to this same word-slicing anyway — pure wasted latency. Doing it
 * client-side is instant, deterministic, and doesn't burn an LLM call.
 *
 * @param {string} firstMessage - The user's first message.
 * @returns {Promise<string>} Resolves for API-shape compatibility with callers.
 */
export async function generateSessionTitle(firstMessage) {
  const cleaned = firstMessage
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ");
  const MAX_WORDS = 6;
  const title = words.slice(0, MAX_WORDS).join(" ");

  return title + (words.length > MAX_WORDS ? "..." : "");
}
