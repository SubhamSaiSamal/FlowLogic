import { HelpCircle } from 'lucide-react';

interface HeaderProps {
  status: 'Ready' | 'Running' | 'Paused' | 'Converged';
}

export function Header({ status }: HeaderProps) {
  const statusColors = {
    Ready: 'bg-slate-600 text-slate-200',
    Running: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    Paused: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    Converged: 'bg-green-500/20 text-green-400 border border-green-500/30',
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">FlowLogic</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gradient Descent Visualizer</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status}
        </div>
      </div>
      <button className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-700">
        <HelpCircle className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
}
