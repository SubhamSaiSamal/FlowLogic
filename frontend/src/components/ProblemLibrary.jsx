import { useEffect, useState } from "react";
import { listProblems } from "../lib/db";

const DIFFICULTY_STYLE = {
  intro: "text-emerald-400 border-emerald-800/60 bg-emerald-950/30",
  core: "text-amber-400 border-amber-800/60 bg-amber-950/30",
  challenge: "text-red-400 border-red-800/60 bg-red-950/30",
};

/**
 * Curated problem library — the active-learning seed (research finding R2:
 * AI tutoring with active-learning design teaches ~2x faster than reactive
 * chat alone). Picking a problem pre-sets the Socratic goal so the tutor
 * knows immediately what to guide toward.
 */
export default function ProblemLibrary({ onStart, onClose }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listProblems().then((rows) => {
      if (!cancelled) {
        setProblems(rows);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const byTopic = problems.reduce((acc, p) => {
    (acc[p.topic] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div>
            <h2 className="font-mono text-sm font-semibold text-slate-100">Problem Library</h2>
            <p className="font-mono text-[11px] text-slate-500">Pick a goal — the tutor guides you there.</p>
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
          {loading && (
            <p className="font-mono text-xs text-slate-500">Loading problems...</p>
          )}

          {!loading && problems.length === 0 && (
            <div className="border border-slate-800 bg-slate-950/60 p-4 font-mono text-xs text-slate-500">
              No problems found. Run <code className="text-emerald-400">supabase/migrations/0001_init.sql</code>{" "}
              in your Supabase SQL editor to seed the library.
            </div>
          )}

          {Object.entries(byTopic).map(([topic, items]) => (
            <div key={topic} className="mb-6">
              <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-slate-500">
                {topic}
              </h3>
              <div className="space-y-2">
                {items.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onStart(p)}
                    className="group flex w-full items-start justify-between gap-3 border border-slate-800 bg-slate-950/40 px-4 py-3 text-left transition-colors hover:border-emerald-700/60 hover:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-slate-200">{p.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{p.statement}</div>
                    </div>
                    <span
                      className={`shrink-0 border px-2 py-0.5 font-mono text-[10px] uppercase ${DIFFICULTY_STYLE[p.difficulty] || "text-slate-400 border-slate-700"}`}
                    >
                      {p.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
