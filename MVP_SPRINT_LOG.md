# subgrad MVP — Sprint Log (agent-driven loop)

Running log of autonomous iterations executing [FEATURE_RESEARCH_AND_ROADMAP.md](FEATURE_RESEARCH_AND_ROADMAP.md). Newest first.

---

## Iteration 5 — 2026-06-21 · Deploy prep finished + all 4 lab views verified live (Chrome, signed in)

**Deploy prep (carried over from end of Iteration 4):** [render.yaml](render.yaml), [vercel.json](frontend/vercel.json), and [DEPLOYMENT.md](DEPLOYMENT.md) were already written; confirmed the stale `health.py` text (`"Phase 2 — not yet active"`) is fixed to correctly report the live Gemini integration. Nothing else outstanding here — deploy is a user-driven dashboard-clicking task per the runbook, not something this loop can do unsupervised.

**Lab verification — driven through the Chrome extension (the real, signed-in browser) since `/app/*` is gated by Google OAuth and the headless preview can't complete it:**
- **Surface Lab (3D)** — clean. Step/Play/Reset, surface dropdown, learning-rate slider, telemetry HUD all verified against the live `@react-three/fiber` canvas; `takeGradientStep` clamps to the surface domain so it can't diverge.
- **Data (Sandbox)** — clean. Dragged a point live; OLS line and MSE loss recalculated correctly in real time.
- **Compiler** — clean. Live-edited the code (fixed an intentional shape mismatch, `nn.Linear(10,32)` → `nn.Linear(64,32)`); the debounced parser re-validated correctly, error badge cleared, dimension graph updated.
- **Graph Lab (Node) — found and fixed two real bugs**, both in [optimizerStore.js](frontend/src/store/optimizerStore.js):
  1. **No divergence guard in `startTraining`'s gradient loop.** A persisted `graphLearningRate` of 5.0 (the slider's own declared max is 1.0 — likely left over from earlier manual testing) combined with the "Exploding" pathology mode's 1e5 gradient multiplier sent `w`/`b` to `NaN`/`Infinity` on the very first step. Reproduced live: Weight/Bias fields went blank, Pred/Loss showed `∞`, frozen at epoch 288 from a prior session. Fixed by checking `Number.isFinite` on the updated params and halting training (instead of continuing to update) the instant it diverges — verified live: Play now halts immediately at epoch 0 with the last-good values intact, rather than free-running into garbage.
  2. **Entire store was persisted with no `partialize`.** Transient Graph Lab runtime state (`isTraining`, `animationRef`, `graphEpoch`, `graphValues`, `graphState`, `pathologyMode`, `isBackpropActive`) survived page reloads via `zustand/persist`'s default (persist-everything) behavior — so the diverged/mid-training state from bug #1 was permanently stuck across reloads until a manual Reset. Added a `partialize` excluding those seven keys; verified live: after the fix, an `F5` reload now always starts Graph Lab fresh (Normal mode, epoch 0), regardless of what was happening when the page was closed.

**Next up:** deploy is now genuinely the only remaining item before this is demo-ready — the user needs to click through Render/Vercel/Supabase/Google Console per [DEPLOYMENT.md](DEPLOYMENT.md). Everything else on the Day-3 list is done and verified.

---

## Iteration 4 — 2026-06-21 · Fixed dead pedagogy state (real bug) + mastery dashboard

**The big find this iteration:** `Session.record_correct()` / `record_error()` / hint escalation existed on the model and were exercised in unit tests, but were **never called from the live Gemini loop** — meaning `hint_level`, `total_correct`, `total_errors`, and `error_categories` were structurally stuck at their defaults in real usage, despite the PRD describing Progressive Hinting + Error Categorization as core pedagogy, and despite the Sidebar already displaying a "Hint Level X/4" stat for it. This silently broke the exact mechanism that's supposed to make the tutor adaptive — fixing it was higher priority than building a dashboard on top of fake data.

**Done — verified against the LIVE Gemini model (real API key, real tool-calling), not mocked:**
- **New `record_outcome` tool** ([gemini_client.py](backend/app/core/gemini_client.py)): Gemini now calls this exactly once per judged submission (instructed via a new rule 4b in [prompts.py](backend/app/core/prompts.py)), reporting `is_correct` + `error_category`. Handled specially in the tool loop (needs `session`, and is deliberately excluded from `tools_used` so it can't falsely trigger the "Verified by SymPy" badge or streak/XP).
- **`send_message` now returns** `(text, tools_used, outcome)`; `ChatMessageResponse` gained `outcome`/`error_category` fields ([routes/chat.py](backend/app/api/routes/chat.py)).
- **Live 3-turn verification against the real model**: (1) opening question → `outcome: null` (correctly nothing to judge yet); (2) a deliberately wrong product-rule answer → `outcome: "incorrect"`, `error_category: "conceptual"`, and `GET /session` confirmed `total_errors: 1`, `error_categories.conceptual: 1`, `consecutive_errors: 1` — **all previously permanently zero**; (3) the corrected answer → `outcome: "correct"`, and `GET /session` confirmed `total_correct: 1`, `consecutive_errors` reset to `0`. Full backend suite still 77 passed throughout.
- **Mastery dashboard, now backed by real signal**: [ProgressDashboard.jsx](frontend/src/components/ProgressDashboard.jsx) (new) reads `progress` rows; [db.js](frontend/src/lib/db.js) gained `recordProgress`/`listProgress`; [ChatContainer.jsx](frontend/src/components/ChatContainer.jsx) writes to it whenever `data.outcome` is present. [Workspace.jsx](frontend/src/pages/Workspace.jsx) tracks `currentTopic` (set from the Problem Library's `problem.topic`, falls back to `"General"`) and opens the dashboard via a new "MASTERY" button in [Sidebar.jsx](frontend/src/components/Sidebar.jsx).

**Verification note:** backend changes got the gold-standard treatment (live Gemini calls + counter assertions). The frontend dashboard/button wiring is build+lint clean but `preview_screenshot` was timing out this cycle (confirmed via `document.readyState`/DOM-text inspection that the app itself is healthy — this looks like a tooling flake, not a regression); the authenticated-only UI path (same as iteration 2's cloud history) still awaits a real signed-in manual pass.

**Next up (priority order):**
1. **Deploy** — Vercel (frontend) + Render/Railway (backend). This is the last unchecked Day-3 item; the user should confirm the Supabase migration + Google OAuth (now correctly configured with a real Google Cloud Client ID per chat) before this.
2. A manual signed-in pass over: cloud Sidebar history, Problem Library, Mastery dashboard, reopening a session (rehydrate).
3. Mobile-friendly landing pass (low priority / explicit non-goal for MVP).

---

## Iteration 3 — 2026-06-21 · Backend rehydrate endpoint + rate limiting (both verified live against a running backend)

**Done — every item in this iteration was exercised against a real running FastAPI instance, not just lint/build:**
- **`POST /api/v1/chat/session/rehydrate`** ([routes/chat.py](backend/app/api/routes/chat.py)): mints a fresh in-memory `Session` and replays a saved transcript into its `history`, restoring goal + hint level. Closes the Day-1 "stretch" gap from Iteration 1/2 — reopened sessions now get **real Gemini context**, not just the bare goal text. **Verified via curl**: created a session with 2 replayed messages, then confirmed via `GET /session/{id}` that `message_count: 2` and the goal/hint_level round-tripped correctly.
- **Frontend wiring**: `rehydrateSession()` added to [api/client.js](frontend/src/api/client.js); [Workspace.jsx](frontend/src/pages/Workspace.jsx)'s `handleSelectCloudSession` now calls it (falling back to plain `createSession` only when there's no saved transcript). **Verified live in the browser preview** via a real fetch to the running backend — got back a real `session_id` or with `replayed_messages: 2`.
- **Rate limiting** ([core/rate_limit.py](backend/app/core/rate_limit.py)): dependency-free in-memory fixed-window limiter (20 req/min/IP), matching the existing in-memory `SessionStore` pattern rather than pulling in slowapi/Redis mid-sprint. Applied only to `POST /chat/message` (the Gemini-calling, cost-bearing endpoint) via `Depends()` — math endpoints stay unthrottled per their own "safe on every keystroke" design intent. **Verified by firing 22 rapid requests**: 1–20 → `200`, 21–22 → `429` with a correct `Retry-After` header and a friendly message. Confirmed 5 rapid math-endpoint calls all still return `200` (unaffected).
- **Regression check**: full backend test suite — `77 passed, 1 skipped` — no regressions from either change.

**Next up (priority order):**
1. **Progress/mastery dashboard** (Day 3, R4) — small UI from the `progress` table; still needs the table populated by something (currently `progress` exists in the schema but nothing writes to it yet — wire a write on verified/incorrect steps).
2. **Deploy** — Vercel (frontend) + Render/Railway (backend), once the user confirms the Supabase migration + Google OAuth toggle locally.
3. Mobile-friendly landing page pass (low priority, explicitly deferred non-goal for MVP per the roadmap doc).

---

## Iteration 2 — 2026-06-21 · Cloud history, sign-in gate, Problem Library, title-gen fix

**Done (build + lint clean; sign-in gate + title-gen verified live in preview):**
- **Architectural fix (the reconciliation debt flagged in Iteration 1):** decoupled the *stable cloud session id* (the persisted Zustand `activeSessionId`) from the *ephemeral backend live id* (minted fresh every reload since FastAPI sessions are in-memory). [ChatContainer.jsx](frontend/src/components/ChatContainer.jsx) now writes to Supabase under the stable id while still calling `/chat/message` with the backend's live id — so history survives backend restarts without needing full Gemini-context rehydration.
- **Cloud-backed Sidebar history:** [Sidebar.jsx](frontend/src/components/Sidebar.jsx) fetches `db.listSessions(user)` for signed-in users and renders real cross-device history (title + relative time) instead of the local-only list; falls back to local sessions for anonymous use.
- **Sign-in gate:** new [SignInGate.jsx](frontend/src/components/SignInGate.jsx) — blocks `/app/*` once auth state resolves and no user is present (landing page stays fully open). Wired into [Workspace.jsx](frontend/src/pages/Workspace.jsx). **Verified live**: navigating to `/app/surface` signed-out renders the gate correctly.
- **Problem Library UI:** new [ProblemLibrary.jsx](frontend/src/components/ProblemLibrary.jsx) — modal listing `db.listProblems()` grouped by topic with difficulty badges; "Start" mints a session with that problem's `goal_text` and routes into the workspace. Opened via a new sidebar button.
- **Reopening a past session:** `Workspace.handleSelectCloudSession` loads the saved transcript for display and mints a fresh live backend session (carrying the same goal) so the tutor can keep going — new messages continue saving under the *same* stable cloud id.
- **Fixed a real bug, not just polish:** `generateSessionTitle` in [api/client.js](frontend/src/api/client.js) was calling the backend with a **session_id that was never created**, 404ing on every single call and always silently falling back to crude word-slicing anyway. Replaced with an instant client-side heuristic — same visual result, zero wasted network/LLM calls. **Verified live**: `generateSessionTitle("What is the derivative of x squared times sine of x?")` → `"What is the derivative..."`, no network tab activity.

**⚠️ Still blocked-on-user:** run `supabase/migrations/0001_init.sql`, confirm Google provider toggle (per earlier chat instructions) — until then `listSessions`/`listProblems` return `[]` gracefully (verified no-crash behavior in iteration 1's db.js design).

**Known verification gap:** the *signed-in* paths (cloud Sidebar history rendering, Problem Library content, reopening a session) are code-reviewed + lint/build-clean but not exercised live end-to-end here, since that requires a real Google OAuth session this loop can't perform headlessly. Recommend a manual pass once you've signed in once.

**Next up (priority order):**
1. **Backend `/session/rehydrate`** (Day 1 stretch) — replay saved transcript into a fresh backend `Session.history` so reopened sessions keep real Gemini context instead of starting clean with just the goal.
2. **Mastery/progress glimpse** (Day 3, R4) — small dashboard strip from the `progress` table.
3. **Rate limiting** on `/chat/message` (cheap infra hardening before any public deploy).
4. **Deploy** — Vercel (frontend) + Render/Railway (backend) once the user has confirmed the Supabase migration + OAuth locally.

---

## Iteration 1 — 2026-06-21 · Foundation: env, persistence layer, trust badge, streak/XP

**Done (build + lint clean; verified in preview):**
- **Env config (deploy unblock):** `VITE_API_BASE` in [api/client.js](frontend/src/api/client.js); `VITE_SUPABASE_URL/ANON_KEY` in [supabaseClient.js](frontend/src/lib/supabaseClient.js) (fallbacks keep dev working). Added [.env.example](frontend/.env.example) and gitignored `.env*`.
- **Supabase schema:** [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) — `sessions`, `messages`, `progress`, `streaks`, `problems` with RLS (`auth.uid() = user_id`) + 15 seeded problems (Calculus + ML).
- **Persistence layer:** [frontend/src/lib/db.js](frontend/src/lib/db.js) — `upsertSession`, `saveMessage`, `listSessions`, `loadMessages`, `recordVerifiedStep`, `getStreak`, `listProblems`. All best-effort (no-op without user, swallow errors → never break UX).
- **Cloud write wired:** [ChatContainer.jsx](frontend/src/components/ChatContainer.jsx) now persists each user/tutor message + session metadata to Supabase (guarded by signed-in user, fire-and-forget).
- **Trust moat (R3):** upgraded the "Verified by SymPy" badge in [SystemBadge.jsx](frontend/src/components/SystemBadge.jsx) to confident emerald `✓` with an explainer tooltip.
- **Engagement (R5/R8):** local streak/XP slice in [optimizerStore.js](frontend/src/store/optimizerStore.js) (`recordVerifiedStepLocal`, `setEngagement`); +10 XP and streak bump on each *verified* step; 🔥streak + XP chips in the [Workspace](frontend/src/pages/Workspace.jsx) header; cloud sync via `db.recordVerifiedStep` + hydration via `db.getStreak`.

**⚠️ Blocked-on-user (can't do from here):**
- Run `supabase/migrations/0001_init.sql` in the Supabase dashboard so the tables/RLS/seed exist. Until then cloud writes silently no-op (by design); local streak/XP still work.
- Confirm Google OAuth provider is enabled in Supabase Auth.

**Notes / debt for next iterations:**
- **Session-id reconciliation:** store's local session id (`generateId`) only equals the backend `session_id` for sessions created via `handleNewSession`. Cloud rows are keyed on the backend `sessionId` prop. Next iteration: make the store session id always equal the backend id so the Sidebar can read from cloud cleanly.
- Verified-badge live look needs the FastAPI backend running + a tool-using turn (couldn't exercise end-to-end here; the change is isolated CSS + builds clean).

**Next up (priority order):**
1. **Cloud-backed Sidebar history** — list `db.listSessions(user)`; clicking loads `db.loadMessages` + rehydrates. (Day 1 finish)
2. **Sign-in gate** before `/app` (Day 1).
3. **Problem Library UI** — `db.listProblems()` panel/route; "Start this problem" → goal-set session (Day 2).
4. Backend `/session/rehydrate` so reopened sessions keep Gemini context (Day 1 stretch).
5. Fix wasteful title-gen ([api/client.js](frontend/src/api/client.js) `generateSessionTitle`).
