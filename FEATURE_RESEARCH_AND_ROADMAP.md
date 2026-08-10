# subgrad — Feature Research & Implementation Plan

**Author:** drafted with Claude Code (Opus 4.8) · **Date:** 2026-06-21
**Purpose:** Research-backed roadmap answering "what do students actually want, and what do we build next?" — grounded in the *real* current codebase, scoped for a **3-day MVP ship** with short- and long-term backlogs.

> Read this top-to-bottom once, then work from **§5 (3-Day Sprint)** tomorrow. Everything is mapped to actual files/endpoints so there's no re-discovery cost.

---

## 1. TL;DR

**The thesis is validated by the research.** Students don't lack *answers* — they lack *verified understanding* and the discipline of productive struggle. subgrad's three pillars (Socratic refusal, SymPy zero-hallucination verification, interactive labs) each map onto a documented, measurable student preference. We are not pivoting; we are **finishing the product** around a strong core.

**The 3-day MVP, in one breath:** turn the beautiful demo into a product people return to — accounts that *persist your work*, a curated *problem library* so there's always something to do, a *daily streak* so you come back, a prominent *"✓ Verified by SymPy"* trust badge on every checked step, and *a live deployment* so anyone can use it.

**The single biggest gap right now:** there is **no persistence**. Backend sessions live in an in-memory dict ([backend/app/core/session.py](backend/app/core/session.py)) and vanish on restart; Supabase auth is wired on the frontend ([frontend/src/lib/supabaseClient.js](frontend/src/lib/supabaseClient.js)) but **nothing is saved per user**. A tutor that forgets you is a demo, not a product. Fixing this is Day 1.

---

## 2. What students actually want (research synthesis)

Each row is an evidence-backed student preference, what it implies, and how it maps to subgrad. Full sources in §10.

| # | What students want | Evidence (2025–26) | Implication for subgrad |
|---|---|---|---|
| R1 | **Guided discovery, not answers** | Khanmigo's Socratic approach drove **+23%** on follow-up tests; Photomath's answer-giving only **+8%**. RCTs: Socratic AI rated *significantly more motivating for independent thought* (large effect size), with bigger gains in critical thinking & self-efficacy. | **Direct validation of our core.** Keep the refusal strict. Make the Socratic behavior *visible* (show hint level, "I won't give the answer — here's a nudge"). |
| R2 | **Active learning / active recall** | Harvard 2025: AI tutoring built on active-learning design taught **2× more in less time**. Quizzes, timed challenges, flashcards, spaced repetition are top-requested. | Our chat is reactive (user must drive). Add a **practice loop**: problem library → guided attempt → verified step-check → spaced review. This is the highest-leverage learning feature we don't have. |
| R3 | **Trust / verifiable correctness** | Students **cannot reliably detect hallucinations** — LLM fluency *erodes* epistemic vigilance; subtle reasoning errors need domain expertise novices lack. "Deceptively confident" wrong answers go unnoticed. | **Our deepest moat.** SymPy gives provable correctness pure-LLM tutors can't. Surface a **"✓ Verified by SymPy"** badge prominently. This is cheap to ship and impossible for ChatGPT-wrapper competitors to copy. |
| R4 | **Persistence & progress tracking** | "Data-driven progress tracking" and adaptive pacing are repeatedly cited must-haves; personalization (knowing what *and how* you learn) is the 2026 expectation. | We already track `total_correct`, `error_categories`, `hint_level` per session — but throw it away on restart. **Persist it, then visualize it** as a mastery dashboard. |
| R5 | **Engagement loops (streaks/XP)** | Streaks → **3× more likely** to return daily; leaderboards → **+15%** completions; streak-freeze → **48%** longer streaks. Duolingo cut churn 47%→28%. | Add a **daily streak** + lightweight XP for *verified* steps (reward the rigor, not vanity). Caution (R8) on dark patterns. |
| R6 | **Low-friction input (photo/handwriting/voice)** | Photomath's edge is reading messy handwriting; OCR now **95%+** accurate; top tools accept image/text/speech/handwriting (e.g. Thetawise). | LaTeX-only input is a real barrier for our "Visual Synthesizer" persona. Add **photo/handwriting → LaTeX** and **voice input** (short-term, not MVP). |
| R7 | **Direct-manipulation visual intuition** | TensorFlow Playground, CNN/Diffusion Explainers, 3Blue1Brown: students love *tinkering* — real-time decision boundaries, no-code hyperparameter play, "lowering entry barriers." | **We're already in this lineage and arguably ahead** (AI-steered labs). Double down: finish the PRD-promised **Derivative Explorer** and **Matrix Transformation Animator** that aren't built yet, and make labs shareable. |
| R8 | **No over-reliance / dark patterns** | Same RCTs warn over-reliance on AI *undermines* intrinsic motivation; guilt-based streaks have backlash. | Design engagement to reward *struggle + verification*, not raw time. Streak counts a day only if you complete a *verified* step. Keep XP tied to mastery. |
| R9 | **Competitive / olympiad rigor** (our stated persona) | Olympiad platforms (WOOT, Talent Scholar) center on **structured problem sets, feedback on full solutions, weekly concept mastery, mock exams, community**. | Our INAIO/ZCO positioning needs **curated problem sets** and eventually **community problem sharing + mock-exam mode**. Problem library is the MVP seed of this. |

### Strategic takeaways
1. **Our moat is verification + Socratic discipline.** Lean into it loudly (R1, R3). It's the one thing a generic GPT wrapper cannot replicate.
2. **The product's missing half is the *active-learning loop*** (R2): library → practice → verify → review. Building this is what turns "cool demo" into "I use this every day."
3. **Engagement is cheap and high-ROI** (R5) but must be rigor-aligned (R8).
4. **We're already ahead on visualization** (R7) — finish the calculus-side labs to balance the ML-heavy current set.

---

## 3. Where subgrad stands today (honest audit)

### ✅ Built and working
- **Deterministic math engine** ([backend/app/math_engine/verifier.py](backend/app/math_engine/verifier.py), [routes/math.py](backend/app/api/routes/math.py)): `validate`, `derivative`, `equivalence`, `integral`. Solid, the crown jewel.
- **Socratic chat** ([routes/chat.py](backend/app/api/routes/chat.py), [core/gemini_client.py](backend/app/core/gemini_client.py)): session create/message/get/delete, Gemini function-calling, hint escalation (1–4), error categorization.
- **Interactive labs** (frontend): 3D Gradient Surface, Graph Lab (backprop/pathologies), Data Poisoning Sandbox, Pseudo-Compiler (shape checking), Dimension Graph Lab.
- **AI agency**: Socratic Watcher auto-intervention ([hooks/useSocraticWatcher.js](frontend/src/hooks/useSocraticWatcher.js)), `[ACTION:]` choreography ([utils/mathParser.jsx](frontend/src/utils/mathParser.jsx)), notation tooltips.
- **New**: marketing landing page + routing + back button + session markdown export ([utils/exportSession.js](frontend/src/utils/exportSession.js)).
- **Auth (frontend only)**: Supabase Google sign-in wired.

### ⚠️ Gaps / risks (ranked by ship-impact)
| Gap | Where | Severity |
|---|---|---|
| **No persistence** — sessions/history/progress lost on restart | [core/session.py](backend/app/core/session.py) in-memory dict | 🔴 Ship-blocking |
| **Auth does nothing** — no `user_id` link; data not per-user | backend has no auth; Supabase unused for data | 🔴 Ship-blocking |
| **Not deployable** — `API_BASE` hardcoded `localhost:8000`; Supabase keys committed | [api/client.js:12](frontend/src/api/client.js), [supabaseClient.js](frontend/src/lib/supabaseClient.js) | 🔴 Ship-blocking |
| **No active-learning loop** — no problem library, no practice/review | — | 🟠 Core value missing |
| **Verification not surfaced** — `tool_used` returned but trust badge weak | [routes/chat.py:231](backend/app/api/routes/chat.py), MessageBubble | 🟠 Cheap moat unshipped |
| **No streaming** — chat waits for full Gemini response | [gemini_client.py](backend/app/core/gemini_client.py) | 🟡 Perceived latency |
| **Desktop-only** — `body{overflow:hidden}`, lab panes assume wide screens | [index.css](frontend/src/index.css), [pages/Workspace.jsx](frontend/src/pages/Workspace.jsx) | 🟡 Mobile users blocked |
| **Wasteful title-gen** — spins a throwaway session per call | [api/client.js:95](frontend/src/api/client.js) | 🟢 Polish |
| **No rate limiting** — 429 referenced but not enforced | backend | 🟢 Infra |
| **PRD widgets unbuilt** — Derivative Explorer, Matrix Transform Animator | — | 🟢 Roadmap |

---

## 4. Prioritization framework

We rank by **(student-impact from §2) × (1 / effort)**, with a hard filter: *does it move us from "demo" to "product people return to"?* Effort = S (≤2h), M (½–1 day), L (1–2 days), XL (3+ days).

```
                        HIGH IMPACT
                            │
   Verified badge (S) ●     │   ● Persistence+history (L)   ← DO FIRST
   Streak (S) ●             │   ● Problem library (M)
   Deploy/env (M) ●         │   ● Practice+step-verify loop (M)
 ───────────────────────────┼─────────────────────────────── LOW EFFORT → HIGH EFFORT
   Title-gen fix (S) ●       │   ● SSE streaming (L)
   Rate limit (S) ●         │   ● Mobile chat (L)
                            │   ● Adaptive curriculum (XL)
                        LOW IMPACT
```

**MVP = the top-right + the cheap top-left.** Everything else is short/long-term.

---

## 5. The 3-Day MVP Sprint (do this tomorrow)

**Goal:** A deployed product where a signed-in student picks a problem, gets Socratically tutored with verified steps, sees their streak, and finds their session waiting when they return.

> **Decision baked in:** persist via **Supabase Postgres directly from the frontend** (RLS-protected), since auth is already there. Keep the in-memory backend session for live Gemini context; add a lightweight **rehydrate** path so reopening a session rebuilds context. This avoids building backend auth in 3 days while making accounts real.

### Day 1 — Persistence + Accounts (the foundation) 🔴
- [ ] **Supabase schema** (SQL in dashboard). Tables, all RLS `auth.uid() = user_id`:
  - `sessions(id, user_id, title, goal, created_at, updated_at, hint_level, total_correct, total_errors, error_categories jsonb)`
  - `messages(id, session_id, user_id, role, content, tool_used bool, created_at)`
  - `progress(user_id, topic, attempts, correct, last_seen, mastery numeric)` (mastery 0–1)
  - `streaks(user_id, current_streak, longest_streak, last_active_date, freezes_left)`
- [ ] **Persist on every turn**: in [ChatContainer.jsx](frontend/src/components/ChatContainer.jsx) / [chatStore.js](frontend/src/store/chatStore.js), after each user msg and tutor response, `insert` into `messages`; upsert `sessions` stats from the `ChatMessageResponse` (hint_level, current_goal, tool_used).
- [ ] **Sidebar = real history**: [Sidebar.jsx](frontend/src/components/Sidebar.jsx) lists the user's `sessions` from Supabase (newest first); clicking one loads its `messages` into the chat.
- [ ] **Rehydrate path**: backend `POST /api/v1/chat/session/rehydrate` accepting `{history: [...]}` to seed a `Session`'s history so the tutor has context when a saved session is reopened. (If time-boxed: skip and just replay the visible transcript with a fresh goal — acceptable for MVP.)
- [ ] **Auth gating**: require sign-in before entering `/app` (redirect to a sign-in modal). Anonymous users can still see the landing page.
- **Acceptance:** sign in → chat → refresh/relogin → past session + messages reappear; signing in as a different account shows different data.

### Day 2 — Active-learning loop + trust + engagement 🟠
- [ ] **Problem Library (seeded)**: `problems(id, topic, difficulty, title, statement, goal_text)` table + seed **15–20 problems** across Calculus (product/chain rule, limits, definite integrals) and ML (gradient descent, MSE, backprop). New `ProblemLibrary` panel/route; "Start this problem" creates a session with `goal = goal_text` (the chat API already accepts a goal).
- [ ] **Verified-step badge (the moat, R3)**: backend already returns `tool_used` → render a prominent **`✓ Verified by SymPy`** chip on those tutor messages in [MessageBubble.jsx](frontend/src/components/MessageBubble.jsx). Add a one-line "Every ✓ is checked by a deterministic engine, not guessed" explainer. Cheap, differentiating.
- [ ] **Daily streak (R5, rigor-aligned per R8)**: increment `streaks.current_streak` only when the user completes a **verified** step that day (not just opening the app). Show a flame + count in the header; offer a `streak freeze` token. 
- [ ] **Lightweight XP**: +10 XP per verified step, +25 per completed problem; show in header. (Mastery, not vanity.)
- **Acceptance:** pick a library problem → tutor guides it → a verified step shows the badge, bumps streak + XP; counts persist across reloads.

### Day 3 — Deploy + polish + demo-readiness 🔴🟢
- [ ] **Env config**: replace `API_BASE` with `import.meta.env.VITE_API_BASE` ([api/client.js](frontend/src/api/client.js)); move Supabase URL/key to `VITE_` env; backend `CORS_ORIGINS` + `GEMINI_API_KEY` via env (already supported in [config.py](backend/app/core/config.py)). Rotate the committed anon key.
- [ ] **Deploy**: frontend → Vercel; backend → Render/Railway/Fly; Supabase already hosted. Smoke-test the deployed chat end-to-end.
- [ ] **Progress glimpse**: a small "mastery" strip on the home/dashboard from `progress` (topics attempted, % correct) — even minimal closes the R4 loop.
- [ ] **Polish**: fix title-gen to reuse the real session ([api/client.js:95](frontend/src/api/client.js)); empty states; loading/error states on history load; mobile = landing perfect + "best experienced on desktop" notice on `/app`.
- [ ] **Demo script** for Hack Club: sign in → pick problem → struggle → verified guidance → streak/XP → reopen later.
- **Acceptance:** a stranger can open the public URL, sign in, learn something, and come back tomorrow to their streak.

**Cut-line if behind:** Day 1 (persistence) and Day 3 (deploy) are non-negotiable. From Day 2, ship the **verified badge** (hours) and **problem library** first; streak/XP can slip to short-term.

---

## 6. Short-term backlog (week 1–2, post-MVP)

| Feature | Why (research) | Effort | Notes / files |
|---|---|---|---|
| **SSE token streaming** | Perceived latency; already in PRD roadmap | L | Stream Gemini tokens; execute `[ACTION]` tags as they arrive ([gemini_client.py](backend/app/core/gemini_client.py), [mathParser.jsx](frontend/src/utils/mathParser.jsx)). |
| **Proof Pad (step-by-step verifier)** | R2 + R3; "Step Verifier" is already in our hero copy | M | Multi-step derivation UI; each step → `/api/v1/math/equivalence`, green/red. Calculus analog of the compiler. |
| **Spaced-repetition review queue** | R2; reintroduces concepts before forgetting | M | Use `progress.last_seen` + simple SM-2; "Review (5)" prompt seeds a session of due problems. |
| **Progress / mastery dashboard** | R4 personalization | M | Visualize `progress` + `error_categories`; "you confuse product vs chain rule." |
| **Photo / handwriting → LaTeX** | R6; Photomath's core edge | L | OCR (Mathpix API or client model) → prefill the LaTeX input; verify via `/validate`. |
| **Voice input** | R6 conversational | M | Web Speech API → text → existing pipeline. |
| **Mobile chat layout** | R6; desktop-only today | L | Make chat usable on phones; keep labs desktop-gated initially. |
| **Shareable session links** | build-in-public ethos; R7 | M | Extend Horizon Exporter → public read-only session URL (Supabase row + `/s/:id`). |
| **Backend auth (JWT verify)** | hardens persistence | M | Verify Supabase JWT server-side; attach `user_id`; move writes server-side if desired. |
| **Rate limiting + cost guard** | infra/abuse | S | slowapi or middleware; cap Gemini calls/user/day. |

---

## 7. Long-term roadmap (the moat — quarter+ horizon)

Grouped by strategic bet. These are what make subgrad uncopyable.

### A. Finish the "Intuition Engine" (visualization leadership, R7)
- **Derivative Explorer** (PRD-promised, unbuilt): drag a secant line, watch Δx→0 become the tangent, slope updates live. Fills the calculus-side gap.
- **Matrix Transformation Animator** (PRD-promised, unbuilt): grids stretch/rotate → eigenvectors, PCA intuition.
- **Multi-variable / 3D sandbox**: planes of best fit, curse of dimensionality (PRD §9.3).
- **Generalized `ActionRegistry`** (PRD §9.2): plugin command handlers so new labs register their own AI-steerable actions.

### B. Adaptive intelligence (personalization, R4)
- **Adaptive curriculum generation** (PRD §9.4): LLM compiles custom interactive lessons from the student's `error_categories`/`progress` — "you keep missing the chain rule; here's a generated sequence."
- **Dynamic Socratic thresholds**: replace hardcoded watcher triggers (`mseLoss>100`) with per-student calibration.

### C. Community & competition (R9, engagement)
- **Community problem sharing**: users publish problems/derivations; upvotes; olympiad sets (INAIO/ZCO).
- **Mock-exam / timed mode** + **leaderboards** (R5/R9) — rigor-aligned.
- **Classroom / teacher dashboards**: cohort progress, assignable problem sets (big TAM expansion; every olympiad platform has this).

### D. Reach & platform
- **Native mobile app** (or PWA) once mobile web is solid.
- **Multimodal voice tutor** (full conversational, R6).
- **Model-agnostic + self-host**: pluggable LLM; the SymPy verification layer is the durable asset regardless of model.
- **Expand the verified domains**: linear algebra, probability/stats, ODEs via SymPy — each new verified domain widens the moat.

---

## 8. Deliberate non-goals (scope discipline)
- ❌ **Don't build backend auth in the 3-day window** — use Supabase RLS from the client; harden later.
- ❌ **Don't make labs mobile-responsive for MVP** — gate them to desktop; they're not the return-driver.
- ❌ **Don't add leaderboards/social in MVP** — needs a user base first; streak/XP is enough loop.
- ❌ **Don't chase OCR/voice for MVP** — high effort, not the floor of "usable product."
- ❌ **Don't weaken the Socratic refusal to boost "helpfulness" metrics** — that's the moat (R1); an "answer button" would commoditize us into Photomath (+8%).

---

## 9. Risks & mitigations
| Risk | Mitigation |
|---|---|
| 3-day scope overrun | Hard cut-line (§5): persistence + deploy are non-negotiable; badge + library next; streak/XP slip-able. |
| Gemini cost/latency under real users | Rate limit (§6), cache title-gen, SSE for perceived speed, cap free-tier calls. |
| Supabase RLS misconfig leaks data | Test cross-account isolation explicitly (Day 1 acceptance); never use service-role key in the client. |
| Engagement loop feels like a dark pattern (R8) | Streak requires a *verified* step, not mere presence; XP tied to mastery; offer streak-freeze. |
| Over-reliance hurts learning (R8) | Keep refusal strict; surface hint level so students see they're being *guided*, not fed. |
| Committed Supabase key | Rotate on Day 3; move to env; add `.env` to gitignore (verify). |

---

## 10. Sources
**Student wants & AI-tutor trends**
- [7 best AI tutors for students and educators 2026 — Jotform](https://www.jotform.com/ai/best-ai-tutor/)
- [Best AI Study Tools for Students 2026 — YouLearn](https://www.youlearn.ai/blogs/best-ai-study-tools-students-2026)
- [AI Tutor Trends 2026 — Wise](https://www.wise.live/blog/top-ai-tutor-trends/)
- [Top 10 AI Tutoring Systems 2026 — is4.ai](https://is4.ai/blog/our-blog-1/top-10-ai-tutoring-systems-2026-learning-outcomes-208)

**Math-tutor competitor comparison (Khanmigo/Photomath/Symbolab)**
- [Best AI Math Tutor 2025 — Astra AI](https://astra-ai.co/blog/the-best-ai-math-tutor/)
- [11 Best AI Math Tutoring Tools 2026 — Taskade](https://www.taskade.com/blog/ai-math-tutoring)
- [Best AI for Math 2026 — Geleza](https://www.geleza.app/blog/best-ai-for-math-2026)

**Socratic AI effectiveness & motivation**
- [Socratic AI in K–12 Science Classrooms (RCT) — ResearchGate](https://www.researchgate.net/publication/398686102_Socratic_AI_in_K-12_Science_Classrooms_Effects_on_Critical_Thinking_Motivation_and_Self-Regulation_in_a_Randomized_Controlled_Trial)
- [ChatGPT vs human tutors, critical thinking — Frontiers in Education](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1528603/full)
- [Student perspectives on a Socratic-method chatbot — JLDHE](https://journal.aldinhe.ac.uk/index.php/jldhe/article/view/1724)

**Gamification / retention**
- [Duolingo gamification — StriveCloud](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)
- [Duolingo gamification case study 2026 — Trophy](https://trophy.so/blog/duolingo-gamification-case-study)

**Input modality (photo/handwriting/voice)**
- [Take a Picture and Solve Math 2026 — ThinkAssist](https://thinkassist.app/blog/take-picture-and-solve-math-problem)
- [Best Math AI Apps 2025 — Tutor AI](https://tutorai.me/blog/best-math-ai-apps/)

**Interactive ML visualization**
- [TensorFlow Playground walkthrough — GeeksforGeeks](https://www.geeksforgeeks.org/deep-learning/tensorflow-playground-a-walkthrough/)
- [CNN Explainer — arXiv](https://arxiv.org/pdf/2004.15004)

**Competitive-math platforms**
- [MathWOOT — Art of Problem Solving](https://artofproblemsolving.com/school/course/woot-math)
- [Math Olympiad Prep — Talent Scholar](https://thetalentscholar.com/math-olympiad-preparatory-series/)

**Trust / hallucination detection**
- [AI Hallucination from Students' Perspective: A Thematic Analysis — arXiv](https://arxiv.org/pdf/2602.17671)
- [Warning About AI Fallibility Increases Help-Seeking — arXiv](https://arxiv.org/html/2606.03822)
- [Addressing AI Hallucinations and Bias — MIT Sloan EdTech](https://mitsloanedtech.mit.edu/ai/basics/addressing-ai-hallucinations-and-bias/)
```
