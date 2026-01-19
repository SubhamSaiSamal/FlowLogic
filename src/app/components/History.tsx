import { Clock, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ExperimentRecord, loadExperiments } from '../experimentHistory';
import { useNavigate } from 'react-router-dom';

export function History() {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setExperiments(loadExperiments().sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });

  if (!experiments.length) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Clock className="w-6 h-6 text-blue-400" />
          Experiment History
        </h1>
        <p className="mt-2 text-slate-400 max-w-xl">
          You haven&apos;t saved any runs yet. Try running a gradient descent experiment in Visualize or Sandbox mode,
          and we&apos;ll log the outcome here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-4">
        <Clock className="w-6 h-6 text-blue-400" />
        Experiment History
      </h1>
      <div className="mt-4 space-y-3">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
          >
            <div className="flex items-center gap-4">
              <div className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                {exp.mode.toUpperCase()}
              </div>
              <div>
                <div className="text-sm text-slate-100">
                  {exp.functionId} · lr={exp.learningRate} · iters={exp.iterations}
                </div>
                <div className="text-xs text-slate-500">{formatDate(exp.timestamp)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium ${
                  exp.outcome === 'converged'
                    ? 'text-green-400'
                    : exp.outcome === 'diverged'
                    ? 'text-red-400'
                    : 'text-amber-400'
                }`}
              >
                {exp.outcome.toUpperCase()}
              </span>
              <button
                onClick={() => navigate(`/${exp.mode}`)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-100"
              >
                <PlayCircle className="w-3 h-3" />
                Re-open
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

