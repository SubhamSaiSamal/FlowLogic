import { motion } from 'motion/react';

interface LiveExplanationProps {
  step: number;
  derivative: number;
  learningRate: number;
  lossChange: number;
  status: string;
}

export function LiveExplanation({ step, derivative, learningRate, lossChange, status }: LiveExplanationProps) {
  const getStatusBadge = () => {
    if (Math.abs(lossChange) < 0.01) {
      return { label: 'Near Minimum', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    } else if (Math.abs(lossChange) > 0.5) {
      return { label: 'Overshoot', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    } else if (Math.abs(derivative) < 0.5) {
      return { label: 'Slow Convergence', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    } else {
      return { label: 'Optimal', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Live Explanation</h3>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          key={badge.label}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}
        >
          {badge.label}
        </motion.div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400 mb-2">Step {step}</p>
          <p className="text-sm text-slate-200 leading-relaxed">
            {status === 'Converged' 
              ? 'The algorithm has converged! The gradient is near zero, indicating we\'ve found a minimum.'
              : Math.abs(lossChange) > 0.5
              ? 'Large step detected. Consider reducing the learning rate to prevent overshooting the minimum.'
              : Math.abs(derivative) < 0.5
              ? 'Moving slowly towards the minimum. The gradient is getting smaller as we approach the optimal point.'
              : 'Making steady progress! The gradient is guiding us efficiently towards the minimum.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Derivative" value={derivative.toFixed(3)} color="text-blue-400" />
          <MetricCard label="Learning Rate" value={learningRate.toFixed(3)} color="text-purple-400" />
          <MetricCard label="Loss Change" value={Math.abs(lossChange).toFixed(3)} color="text-amber-400" />
          <MetricCard label="Convergence" value={`${Math.min(100, Math.max(0, 100 - Math.abs(derivative) * 20)).toFixed(0)}%`} color="text-green-400" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}
