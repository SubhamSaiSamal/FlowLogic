import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSharedOptimizerStore } from '../../../store/optimizerStore';

const LossNode = memo(({ data }) => {
  const isBackpropActive = useSharedOptimizerStore(state => state.isBackpropActive);

  const lossStyle = data.lossStyle || (isBackpropActive
    ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]'
    : 'border-orange-700');

  return (
    <div className={`px-4 py-3 shadow-md rounded-md bg-slate-900/80 backdrop-blur border-2 transition-all min-w-[120px] max-w-[200px] overflow-hidden text-center ${lossStyle}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-orange-500" />

      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-bold font-mono text-orange-400 uppercase tracking-widest">
          {data.label}
        </div>
        {/* Exploding-gradient runs can push this into e+300 territory — an
            unbroken string with nowhere to wrap, so it used to blow the
            card (and the viewport) wide open. Truncate with the full value
            still on hover. */}
        <div className="truncate text-2xl font-mono font-bold text-slate-100" title={String(data.value)}>
          {data.value}
        </div>
        {isBackpropActive && (
          <div
            className="truncate text-[10px] font-mono text-orange-300 mt-0.5 pt-1 border-t border-slate-700"
            title={`∂L/∂L = ${data.grad}`}
          >
            ∂L/∂L = {data.grad}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-orange-500" />
    </div>
  );
});

export default LossNode;
