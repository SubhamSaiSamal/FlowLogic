import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSharedOptimizerStore } from '../../store/optimizerStore';

import ParameterNode from './Nodes/ParameterNode';
import InputNode from './Nodes/InputNode';
import OperationNode from './Nodes/OperationNode';
import LossNode from './Nodes/LossNode';
import GradientEdge from './Nodes/GradientEdge';

const nodeTypes = {
  parameterNode: ParameterNode,
  inputNode: InputNode,
  operationNode: OperationNode,
  lossNode: LossNode,
};

const edgeTypes = {
  gradientEdge: GradientEdge,
};

const PATHOLOGY_MODES = [
  { key: 'normal',    label: 'Normal',  style: 'text-emerald-400 border-emerald-700 hover:border-emerald-500' },
  { key: 'vanishing', label: 'Vanish',  style: 'text-slate-400  border-slate-700  hover:border-slate-500' },
  { key: 'exploding', label: 'Explode', style: 'text-red-400    border-red-800    hover:border-red-500' },
  { key: 'chaotic',   label: 'Chaos',   style: 'text-yellow-400 border-yellow-800 hover:border-yellow-500' },
];

export default function GraphLaboratory() {
  const graphState        = useSharedOptimizerStore(state => state.graphState);
  const isBackpropActive  = useSharedOptimizerStore(state => state.isBackpropActive);
  const pathologyMode     = useSharedOptimizerStore(state => state.pathologyMode);
  const triggerBackprop   = useSharedOptimizerStore(state => state.triggerBackpropAnimation);
  const setPathologyMode  = useSharedOptimizerStore(state => state.setPathologyMode);
  const graphValues       = useSharedOptimizerStore(state => state.graphValues);

  const isTraining        = useSharedOptimizerStore(state => state.isTraining);
  const graphEpoch        = useSharedOptimizerStore(state => state.graphEpoch);
  const graphLearningRate = useSharedOptimizerStore(state => state.graphLearningRate);
  const startTraining     = useSharedOptimizerStore(state => state.startTraining);
  const pauseTraining     = useSharedOptimizerStore(state => state.pauseTraining);
  const resetGraph        = useSharedOptimizerStore(state => state.resetGraph);
  const setGraphLearningRate = useSharedOptimizerStore(state => state.setGraphLearningRate);

  // Derived stats for the info ticker
  const pred = graphValues.w * graphValues.x + graphValues.b;
  const loss = Math.pow(pred - graphValues.y, 2).toFixed(4);

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden" style={{ pointerEvents: 'auto' }}>

      {/* ── Pathology HUD ── */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        {/* Mode Selector */}
        <div className="flex bg-slate-900/80 backdrop-blur border border-slate-700 rounded-md shadow-lg p-0.5 gap-0.5">
          {PATHOLOGY_MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setPathologyMode(m.key)}
              className={`px-3 py-1 text-[10px] font-mono rounded transition-all border ${m.style} ${
                pathologyMode === m.key
                  ? 'bg-slate-800 opacity-100 font-bold'
                  : 'bg-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Backprop Toggle */}
        <button
          onClick={triggerBackprop}
          className={`px-3 py-1 text-[10px] font-mono rounded border transition-all shadow-sm ${
            isBackpropActive
              ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900/80 border-slate-600 text-slate-400 hover:border-cyan-700 hover:text-cyan-400'
          }`}
        >
          {isBackpropActive ? '⬅ Backprop ON' : '⬅ Backprop OFF'}
        </button>
      </div>

      {/* ── Info Ticker ── */}
      <div className="absolute bottom-3 left-3 z-50 flex gap-4 font-mono text-[10px]">
        <span className="text-slate-500">f(x) = <span className="text-slate-300">{pred.toFixed(4)}</span></span>
        <span className="text-slate-500">Loss = <span className={`${Number(loss) > 10 ? 'text-red-400' : 'text-orange-400'}`}>{loss}</span></span>
        <span className={`${
          pathologyMode === 'normal'    ? 'text-emerald-500' :
          pathologyMode === 'vanishing' ? 'text-slate-500' :
          pathologyMode === 'exploding' ? 'text-red-500' :
          'text-yellow-500'
        }`}>Mode: {pathologyMode.toUpperCase()}</span>
      </div>

      {/* ── Autonomous Training Controls (Bottom Center HUD) ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-md shadow-lg px-4 py-2">
        <button
          onClick={isTraining ? pauseTraining : startTraining}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all border ${
            isTraining
              ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
              : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-emerald-500 hover:text-emerald-400'
          }`}
        >
          {isTraining ? '⏸' : '▶'}
        </button>

        <button
          onClick={resetGraph}
          className="px-3 py-1.5 text-[10px] font-mono rounded bg-slate-800 border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
        >
          Reset
        </button>

        <div className="h-6 w-px bg-slate-700"></div>

        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Epoch</span>
          <span className="text-sm font-mono text-slate-200 font-bold">{graphEpoch}</span>
        </div>

        <div className="h-6 w-px bg-slate-700"></div>

        <div className="flex flex-col gap-1 w-32">
          <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest">
            <span className="text-slate-500">Learning Rate</span>
            <span className="text-slate-300">{graphLearningRate.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.001"
            max="1.0"
            step="0.001"
            value={graphLearningRate}
            onChange={(e) => setGraphLearningRate(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      {/* ── React Flow Canvas ── */}
      <ReactFlow
        nodes={graphState.nodes}
        edges={graphState.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="dark"
        minZoom={0.4}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-slate-900/80 !border-slate-700 [&>button]:!bg-slate-900 [&>button]:!fill-slate-400 [&>button:hover]:!bg-slate-800"
        />
      </ReactFlow>
    </div>
  );
}
