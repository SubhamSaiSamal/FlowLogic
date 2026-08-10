import { supabase } from "../lib/supabaseClient";

/**
 * Blocks entry to the workspace until the user signs in. Persistence,
 * session history, and streak/XP are all per-account, so a guest has
 * nothing meaningful to do here — this keeps that explicit instead of
 * silently losing their work on reload.
 */
export default function SignInGate({ onBack }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 px-6 text-slate-300">
      <div className="w-full max-w-sm border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border border-slate-700 bg-slate-900 font-mono text-2xl font-bold text-emerald-400">
          λ
        </div>
        <h2 className="font-mono text-lg font-semibold text-slate-100">
          Sign in to continue
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Your sessions, streak, and verified-step history are saved to your
          account. Sign in to pick up where you left off.
        </p>

        <button
          type="button"
          onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
          className="mt-6 flex w-full items-center justify-center gap-2 border border-slate-700 bg-slate-900/50 px-4 py-2.5 font-mono text-xs text-slate-200 transition-colors hover:border-emerald-500 hover:text-emerald-400"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Sign in with Google
        </button>

        <button
          type="button"
          onClick={onBack}
          className="mt-3 w-full font-mono text-xs text-slate-600 transition-colors hover:text-slate-400"
        >
          ← back to home
        </button>
      </div>
    </div>
  );
}
