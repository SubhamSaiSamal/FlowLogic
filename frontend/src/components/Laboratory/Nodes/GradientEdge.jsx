import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

export default function GradientEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style = {},
  data,
  markerEnd,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const showLabel = data?.gradient && data.gradient.length > 0;

  const labelColor = (() => {
    if (!showLabel) return '';
    if (data?.pathologyMode === 'vanishing') return 'text-slate-500 border-slate-700';
    if (data?.pathologyMode === 'exploding') return 'text-red-400 border-red-800';
    if (data?.pathologyMode === 'chaotic')   return 'text-yellow-400 border-yellow-800';
    return 'text-cyan-400 border-cyan-900';
  })();

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div className={`text-[9px] font-mono px-1.5 py-0.5 rounded border bg-slate-950/90 backdrop-blur ${labelColor}`}>
              {data.gradient}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
