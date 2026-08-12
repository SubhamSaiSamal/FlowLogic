import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const OperationNode = memo(({ data }) => {
  return (
    <div className="w-12 h-12 shadow-md rounded-full bg-slate-900 border-2 border-cyan-500 flex items-center justify-center text-cyan-400 font-mono text-xl transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]">
      <Handle type="target" position={Position.Left} className="w-1.5 h-1.5 !bg-cyan-500" />
      <span className="select-none">{data.symbol}</span>
      <Handle type="source" position={Position.Right} className="w-1.5 h-1.5 !bg-cyan-500" />
    </div>
  );
});

export default OperationNode;
