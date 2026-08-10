import React, { useMemo } from 'react';
import { usePseudoCompilerStore } from '../../store/pseudoCompilerStore';
import DebugAction from './DebugAction';

// ============================================================================
//  LAYOUT CONSTANTS
//  All geometry is defined in one place for easy tuning.
// ============================================================================
const NODE_WIDTH = 200;
const NODE_HEIGHT = 70;
const NODE_GAP_Y = 40;
const PADDING_X = 40;
const PADDING_TOP = 50;
const CONNECTOR_OFFSET_Y = NODE_HEIGHT; // Exit point = bottom of the node

// Layer-type specific color accents
const TYPE_ACCENTS = {
  Linear:    { border: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  text: '#67e8f9' },   // cyan
  ReLU:      { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)', text: '#fcd34d' },   // amber
  Sigmoid:   { border: '#a78bfa', bg: 'rgba(167,139,250,0.08)', text: '#c4b5fd' },  // violet
  Tanh:      { border: '#a78bfa', bg: 'rgba(167,139,250,0.08)', text: '#c4b5fd' },  // violet
  Softmax:   { border: '#f472b6', bg: 'rgba(244,114,182,0.08)', text: '#f9a8d4' },  // pink
  Dropout:   { border: '#64748b', bg: 'rgba(100,116,139,0.08)', text: '#94a3b8' },  // slate
  Conv2d:    { border: '#2dd4bf', bg: 'rgba(45,212,191,0.08)',  text: '#5eead4' },   // teal
  Conv1d:    { border: '#2dd4bf', bg: 'rgba(45,212,191,0.08)',  text: '#5eead4' },   // teal
  Embedding: { border: '#fb923c', bg: 'rgba(251,146,60,0.08)',  text: '#fdba74' },   // orange
  default:   { border: '#06b6d4', bg: 'rgba(6,182,212,0.05)',   text: '#67e8f9' },   // cyan fallback
};

function getAccent(type) {
  return TYPE_ACCENTS[type] || TYPE_ACCENTS.default;
}

/**
 * Renders a single layer node as an SVG group.
 */
function LayerNode({ layer, x, y }) {
  const accent = getAccent(layer.type);
  const dimLabel = (!layer.isPassthrough && layer.in !== null && layer.out !== null)
    ? `${layer.in} → ${layer.out}`
    : null;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Background rectangle */}
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={8}
        ry={8}
        fill={accent.bg}
        stroke={accent.border}
        strokeWidth={1.5}
        style={{
          filter: `drop-shadow(0 0 6px ${accent.border}40)`,
        }}
      />

      {/* Layer type label */}
      <text
        x={NODE_WIDTH / 2}
        y={dimLabel ? 28 : 38}
        textAnchor="middle"
        fill={accent.text}
        fontSize={14}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontWeight="600"
      >
        nn.{layer.type}
      </text>

      {/* Dimension label (only for dimensional layers) */}
      {dimLabel && (
        <text
          x={NODE_WIDTH / 2}
          y={50}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={12}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        >
          {dimLabel}
        </text>
      )}

      {/* Subtle ID badge */}
      <text
        x={10}
        y={16}
        fill="#475569"
        fontSize={9}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      >
        {layer.id}
      </text>
    </g>
  );
}

/**
 * Renders an edge (connector) between two layer nodes.
 * Red + dashed if there is a shape mismatch on this edge. Emerald otherwise.
 */
function EdgeConnector({ x1, y1, x2, y2, error }) {
  const isError = !!error;
  const strokeColor = isError ? '#ef4444' : '#10b981';
  const midY = (y1 + y2) / 2;

  // Cubic bezier path for a smooth S-curve between nodes
  const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

  return (
    <g>
      {/* Glow layer (wider, more transparent) */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isError ? 4 : 3}
        strokeOpacity={0.2}
        strokeDasharray={isError ? '8 4' : 'none'}
      />

      {/* Main line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isError ? 2 : 1.5}
        strokeDasharray={isError ? '8 4' : 'none'}
        style={{
          filter: `drop-shadow(0 0 ${isError ? '8' : '4'}px ${strokeColor})`,
        }}
      />

      {/* Error badge */}
      {isError && (
        <g>
          {/* Badge background */}
          <rect
            x={Math.min(x1, x2) + NODE_WIDTH / 2 - 90}
            y={midY - 12}
            width={180}
            height={24}
            rx={4}
            ry={4}
            fill="rgba(127,29,29,0.85)"
            stroke="#ef4444"
            strokeWidth={1}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.4))',
            }}
          />
          {/* Badge text */}
          <text
            x={Math.min(x1, x2) + NODE_WIDTH / 2}
            y={midY + 4}
            textAnchor="middle"
            fill="#fca5a5"
            fontSize={10}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
            fontWeight="600"
          >
            ⚠ {error.message}
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * The main Dimension Graph SVG renderer.
 * Maps over parsedLayers to draw nodes, then draws edges with error annotations.
 */
export default function DimensionGraphLab() {
  const parsedLayers = usePseudoCompilerStore(state => state.parsedLayers);
  const validationErrors = usePseudoCompilerStore(state => state.validationErrors);

  // Build a fast lookup: "sourceId->targetId" -> error object
  const errorMap = useMemo(() => {
    const map = {};
    validationErrors.forEach(err => {
      map[`${err.sourceId}->${err.targetId}`] = err;
    });
    return map;
  }, [validationErrors]);

  // Pre-compute layout positions for each node
  const nodePositions = useMemo(() => {
    return parsedLayers.map((layer, i) => ({
      x: PADDING_X,
      y: PADDING_TOP + i * (NODE_HEIGHT + NODE_GAP_Y),
    }));
  }, [parsedLayers]);

  // Build edges: connect every consecutive pair of nodes
  const edges = useMemo(() => {
    const result = [];
    for (let i = 0; i < parsedLayers.length - 1; i++) {
      const from = parsedLayers[i];
      const to = parsedLayers[i + 1];
      const fromPos = nodePositions[i];
      const toPos = nodePositions[i + 1];

      // Check if this specific pair has a validation error.
      // The error map keys are by layer IDs from the dimensional chain,
      // but we also need to detect if ANY validation error's source/target
      // indices match this visual edge's pair.
      let edgeError = null;
      validationErrors.forEach(err => {
        if (err.sourceIndex === i && err.targetIndex === i + 1) {
          edgeError = err;
        }
        // Also handle non-adjacent dimensional errors that skip passthroughs:
        // If the visual edge i→i+1 sits between the source and target of an error
        // and one of the endpoints matches, we show the error on the edge that
        // directly connects the dimensional layers involved.
        if (err.sourceId === from.id) {
          // Find the first non-passthrough layer after this one
          // If that layer's id matches the error target, attach the error here.
          for (let j = i + 1; j < parsedLayers.length; j++) {
            if (parsedLayers[j].id === err.targetId) {
              // But we only draw the error badge on the edge leaving the source
              edgeError = err;
              break;
            }
            if (!parsedLayers[j].isPassthrough) break; // stop at next dimensional layer
          }
        }
      });

      result.push({
        key: `${from.id}-${to.id}`,
        x1: fromPos.x + NODE_WIDTH / 2,
        y1: fromPos.y + CONNECTOR_OFFSET_Y,
        x2: toPos.x + NODE_WIDTH / 2,
        y2: toPos.y,
        error: edgeError,
      });
    }
    return result;
  }, [parsedLayers, nodePositions, validationErrors]);

  // Calculate dynamic SVG height
  const svgHeight = parsedLayers.length > 0
    ? PADDING_TOP + parsedLayers.length * (NODE_HEIGHT + NODE_GAP_Y) + 40
    : 400;

  const svgWidth = PADDING_X * 2 + NODE_WIDTH;

  const errorCount = validationErrors.length;

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Dimension Flow Graph</span>
        </div>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
          errorCount > 0 
            ? 'text-red-400 bg-red-950/50 border-red-800/50' 
            : 'text-emerald-400 bg-emerald-950/50 border-emerald-800/50'
        }`}>
          {errorCount > 0 ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : 'Valid'}
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 overflow-auto">
        {/* Subtle grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="compilerGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#compilerGrid)" />
        </svg>

        {parsedLayers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-slate-600 text-4xl mb-3">⊘</div>
              <div className="text-slate-600 text-sm font-mono">No layers detected</div>
              <div className="text-slate-700 text-xs font-mono mt-1">Write nn.* layers in the editor</div>
            </div>
          </div>
        ) : (
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="mx-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Render edges first (behind nodes) */}
            {edges.map(edge => (
              <EdgeConnector
                key={edge.key}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                error={edge.error}
              />
            ))}

            {/* Render nodes */}
            {parsedLayers.map((layer, i) => (
              <LayerNode
                key={layer.id}
                layer={layer}
                x={nodePositions[i].x}
                y={nodePositions[i].y}
              />
            ))}
          </svg>
        )}
      </div>

      {/* Debug Action Overlay */}
      <DebugAction />
    </div>
  );
}
