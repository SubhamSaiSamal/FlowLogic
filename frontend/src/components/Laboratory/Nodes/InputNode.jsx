import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSharedOptimizerStore } from '../../../store/optimizerStore';

const InputNode = memo(({ data }) => {
  const isBackpropActive = useSharedOptimizerStore(state => state.isBackpropActive);
  const updateGraphValue = useSharedOptimizerStore(state => state.updateGraphValue);
  const graphValues = useSharedOptimizerStore(state => state.graphValues);

  const storeKey = data.storeKey;
  const liveValue = storeKey != null ? graphValues[storeKey] : data.value;

  // y_pred is read-only (computed), x and y are editable
  const isEditable = storeKey != null;

  return (
    <div className={`px-3 py-2 shadow-md rounded-md bg-slate-900/80 backdrop-blur border-2 border-slate-600 transition-all min-w-[130px] max-w-[180px] overflow-hidden ${isBackpropActive && data.grad ? 'shadow-[0_0_12px_rgba(56,189,248,0.25)]' : ''}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-slate-400" />

      <div className="flex flex-col gap-1">
        {/* Label */}
        <div className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
          {data.label}
        </div>

        {/* Editable or computed value */}
        {isEditable ? (
          <input
            type="number"
            step="0.1"
            value={liveValue}
            onChange={(e) => updateGraphValue(storeKey, parseFloat(e.target.value) || 0)}
            className="nodrag w-full bg-slate-800 border border-slate-600 text-slate-100 font-mono text-sm px-2 py-1 rounded focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors"
          />
        ) : (
          // Pred f(x) is this branch — under 'exploding' pathology mode it's
          // a derived value that can print as a 20+ char e+NNN string with
          // nowhere to wrap. Truncate it, full value on hover.
          <div
            className="truncate text-sm font-mono text-slate-100 px-2 py-1 bg-slate-800 rounded border border-slate-700"
            title={String(data.value)}
          >
            {data.value}
          </div>
        )}

        {/* Gradient display */}
        {isBackpropActive && data.grad != null && (
          <div
            className={`truncate text-[10px] font-mono mt-0.5 pt-1 border-t border-slate-700 ${
              data.pathologyMode === 'vanishing' ? 'text-slate-500' :
              data.pathologyMode === 'exploding' ? 'text-red-400' :
              data.pathologyMode === 'chaotic'   ? 'text-yellow-400' :
              'text-cyan-400'
            }`}
            title={`∂L/∂pred = ${data.grad}`}
          >
            ∂L/∂pred = {data.grad}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-slate-400" />
    </div>
  );
});

export default InputNode;
