# subgrad — Deployment Runbook

This is a checklist, not a tutorial — each step is a few clicks. Total time: ~15 minutes.
Do these **in order**: backend first, then frontend, then close the loop (CORS + OAuth).

Everything here is config the user must click through on Vercel/Render/Supabase/Google
dashboards — none of it can be done from this repo alone.

---

## 0. Prerequisites

- [ ] **Rotate both API keys first.** `backend/.env` holds a live `GEMINI_API_KEY` and
      `.gemini/settings.json` holds a live Google Stitch key. Neither was ever committed
      (git history is clean) and both are now covered by the root `.gitignore` — but they
      sat in a directory staged for a public push, so rotate them anyway:
      [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and the Google Cloud
      Console respectively.
- [ ] **Confirm nothing sensitive is staged** before the first push:
      `git add -An | grep -Ei "\.env$|\.gemini|\.pyc"` should print nothing.
- [ ] This repo is pushed to GitHub (Vercel/Render both deploy from a GitHub repo).
- [ ] `supabase/migrations/0001_init.sql` has been run in the Supabase SQL editor.
- [ ] Google OAuth is configured in Supabase (Authentication → Providers → Google) with a
      real Client ID/Secret from Google Cloud Console.
- [ ] You have a Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)).

## 1. Deploy the backend (Render)

1. [render.com](https://render.com) → **New** → **Blueprint** → connect this GitHub repo.
2. Render auto-detects [render.yaml](render.yaml) at the repo root. Click through.
3. When prompted for the env vars marked `sync: false`, set:
   - `GEMINI_API_KEY` — your real key.
   - `CORS_ORIGINS` — leave as `http://localhost:5173` for now; **you'll update this in
     step 3** once you have the Vercel URL.
4. Deploy. Once live, copy the backend URL — looks like `https://subgrad-backend.onrender.com`.
5. Sanity check: open `https://subgrad-backend.onrender.com/health/` in a browser — should
   return a JSON OK response. **Note the trailing slash** — `/health` without it is a 307
   redirect, which is fine in a browser but looks like a failure in `curl` without `-L`.

## 2. Deploy the frontend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import this GitHub repo.
2. **Root Directory**: set to `frontend` (Vercel auto-detects Vite once you do).
3. **Environment Variables** — add all three:
   - `VITE_API_BASE` = the Render URL from step 1 (no trailing slash).
   - `VITE_SUPABASE_URL` = your Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key.
4. Deploy. Copy the resulting URL — looks like `https://subgrad.vercel.app`.

[frontend/vercel.json](frontend/vercel.json) is already in place — it rewrites all paths to
`index.html` so deep links like `/app/surface` or `/app/compiler` work on reload instead of
404ing (Vercel's static file server doesn't know about React Router's client-side routes
without this).

## 3. Close the loop — point everything at the real URLs

Now that both are live, go back and update three places with the real Vercel URL:

- **Render** → your service → Environment → `CORS_ORIGINS` → set to a **comma-separated
  list** containing both your production alias and your branch URL:
  `https://subgrad.vercel.app,https://subgrad-git-main-<your-user>.vercel.app`
  → save (triggers a redeploy).

  Why both: Vercel serves every build at a per-deployment hostname
  (`subgrad-<hash>-<user>.vercel.app`) as well as the alias, and the dashboard's
  post-deploy **Visit** button sends you to the *deployment* URL, not the alias. If only
  the alias is allow-listed, that first click gives you a CORS-blocked page and it looks
  like the backend is broken when it isn't. Always test from the production alias
  (Vercel project → Domains).
- **Supabase** → Authentication → URL Configuration → **Site URL** → your Vercel URL.
  Also add it under **Redirect URLs**.
- **Google Cloud Console** → APIs & Services → Credentials → your OAuth client →
  **Authorized JavaScript origins** → add your Vercel URL.

## 4. Verify

- [ ] Open the Vercel URL → hero loads.
- [ ] Sign in with Google → lands in `/app/surface` signed in.
- [ ] Send a chat message → get a real tutor response (confirms `VITE_API_BASE` +
      `GEMINI_API_KEY` are both correct).
- [ ] Reload the page on `/app/compiler` directly → should NOT 404 (confirms `vercel.json`
      rewrite worked).
- [ ] Sign out, sign back in → past session reappears in the sidebar (confirms Supabase
      persistence + RLS).

## Notes

- **Render free tier spins down when idle** — the first request after inactivity takes
  ~30–60s to wake up. Fine for a demo; mention it if judges hit a slow first load.
- **Rate limiting** ([backend/app/core/rate_limit.py](backend/app/core/rate_limit.py)) is
  in-memory per-process — Render's free tier runs a single instance, so this works as-is.
  If you ever scale to multiple instances, it needs to move to Redis (each instance
  currently has its own counters).
- **Backend session store is in-memory too** — a Render redeploy or idle-spindown wipes
  live Gemini context, but conversation history persists in Supabase regardless (see the
  rehydrate endpoint, `MVP_SPRINT_LOG.md` iteration 3), so users don't lose anything.
