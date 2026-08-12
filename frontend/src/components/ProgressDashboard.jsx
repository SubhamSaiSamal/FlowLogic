import { useEffect, useState } from "react";
import { listProgress } from "../lib/db";
import { useSharedOptimizerStore } from "../store/optimizerStore";

function masteryColor(m) {
  if (m >= 0.75) return "text-emerald-400 border-emerald-700/60 bg-emerald-950/30";
  if (m >= 0.4) return "text-amber-400 border-amber-700/60 bg-amber-950/30";
  return "text-red-400 border-red-700/60 bg-red-950/30";
}

/**
 * Per-topic mastery dashboard (research R4: students want data-driven
 * progress tracking / personalization). Reads the `progress` table, written
 * to by ChatContainer whenever the tutor judges a submission (see
 * ChatMessageResponse.outcome, backed by the new record_outcome tool).
 */
export default function ProgressDashboard({ onClose }) {
  const user = useSharedOptimizerStore((state) => state.user);
  const [rows, setRows] = useState([]);
  const [fetched, setFetched] = useState(false);

  // Derived rather than stored. Previously the signed-out branch called
  // setLoading(false) synchronously inside the effect, which triggered a
  // cascading render on open. There's nothing to wait for without a user, so
  // "loading" is just: we have a user and their rows haven't landed yet.
  const loading = !!user?.id && !fetched;

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    listProgress(user.id).then((data) => {
      if (!cancelled) {
        setRows(data);
        setFetched(true);
      }
    });
    return () => { cancelled = true; };
  }, [user]);

  const totalAttempts = rows.reduce((sum, r) => sum + (r.attempts || 0), 0);
  const totalCorrect = rows.reduce((sum, r) => sum + (r.correct || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div>
            <h2 className="font-mono text-sm font-semibold text-slate-100">Mastery Dashboard</h2>
            <p className="font-mono text-[11px] text-slate-500">
              {totalAttempts > 0
                ? `${totalCorrect}/${totalAttempts} verified steps correct overall`
                : "Tracks accuracy per topic as the tutor verifies your steps."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 font-mono text-xs text-slate-500 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && <p className="font-mono text-xs text-slate-500">Loading progress...</p>}

          {!loading && rows.length === 0 && (
            <div className="border border-slate-800 bg-slate-950/60 p-4 font-mono text-xs text-slate-500">
              No judged steps yet. Start a problem from the Problem Library and submit an
              answer — once the tutor verifies it, this fills in automatically.
            </div>
          )}

          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.topic}
                className="flex items-center justify-between gap-3 border border-slate-800 bg-slate-950/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm text-slate-200">{r.topic}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                    {r.correct}/{r.attempts} correct
                  </div>
                </div>
                <span
                  className={`shrink-0 border px-2.5 py-1 font-mono text-xs ${masteryColor(r.mastery || 0)}`}
                >
                  {Math.round((r.mastery || 0) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
