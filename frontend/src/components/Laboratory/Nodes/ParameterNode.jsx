import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSharedOptimizerStore } from '../../../store/optimizerStore';

const ParameterNode = memo(({ data }) => {
  const isBackpropActive = useSharedOptimizerStore(state => state.isBackpropActive);
  const updateGraphValue = useSharedOptimizerStore(state => state.updateGraphValue);
  const graphValues = useSharedOptimizerStore(state => state.graphValues);

  const storeKey = data.storeKey;
  const liveValue = storeKey != null ? graphValues[storeKey] : data.value;
  const paramStyle = data.paramStyle || (isBackpropActive
    ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
    : 'border-emerald-600');

  return (
    <div className={`px-3 py-2 shadow-md rounded-md bg-slate-900/80 backdrop-blur border-2 transition-all min-w-[130px] max-w-[180px] overflow-hidden ${paramStyle}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-emerald-500" />

      <div className="flex flex-col gap-1">
        {/* Label */}
        <div className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest">
          {data.label}
        </div>

        {/* Editable Value */}
        {storeKey ? (
          <input
            type="number"
            step="0.1"
            value={liveValue}
            onChange={(e) => updateGraphValue(storeKey, parseFloat(e.target.value) || 0)}
            className="nodrag w-full bg-slate-800 border border-slate-600 text-slate-100 font-mono text-sm px-2 py-1 rounded focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
          />
        ) : (
          // Read-only (no storeKey) means this is a derived value, which under
          // 'exploding' pathology mode can print as a 20+ char e+NNN string
          // with nowhere to wrap — truncate it, full value on hover.
          <div className="truncate text-sm font-mono text-slate-200 px-2 py-1" title={String(liveValue)}>
            {liveValue}
          </div>
        )}

        {/* Gradient display (backprop active) */}
        {isBackpropActive && data.grad != null && (
          <div
            className={`truncate text-[10px] font-mono mt-0.5 pt-1 border-t border-slate-700 ${
              data.pathologyMode === 'vanishing' ? 'text-slate-500' :
              data.pathologyMode === 'exploding' ? 'text-red-400' :
              data.pathologyMode === 'chaotic'   ? 'text-yellow-400' :
              'text-cyan-400'
            }`}
            title={`∂L/∂${storeKey} = ${data.grad}`}
          >
            ∂L/∂{storeKey} = {data.grad}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-emerald-500" />
    </div>
  );
});

export default ParameterNode;
