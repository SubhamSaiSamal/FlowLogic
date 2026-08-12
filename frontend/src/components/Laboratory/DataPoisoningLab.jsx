import { useEffect, useRef, useState, useCallback } from 'react';
import { useDataSandboxStore } from '../../store/dataSandboxStore';

export default function DataPoisoningLab() {
  const { points, regressionLine, mseLoss, highlightedOutlierId, updatePointPosition, calculateOLS } = useDataSandboxStore();
  
  // Calculate initial OLS on mount
  useEffect(() => {
    calculateOLS();
  }, [calculateOLS]);

  const svgRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  // Convert raw screen coordinates to accurate viewBox coordinates
  const getSVGCoordinates = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    // Matrix transform handles responsive scaling and exact pointer mapping
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const handlePointerDown = (e, id) => {
    e.target.setPointerCapture(e.pointerId);
    setDraggingId(id);
    e.stopPropagation();
  };

  const handlePointerMove = (e) => {
    if (draggingId === null) return;
    
    const coords = getSVGCoordinates(e);
    // Constrain points to strictly stay within the 0-100 viewBox range
    const x = Math.max(0, Math.min(100, coords.x));
    
    // Mathematically invert the Y coordinate on capture so 0 remains at the bottom of the graph
    const rawY = 100 - coords.y;
    const y = Math.max(0, Math.min(100, rawY));
    
    updatePointPosition(draggingId, x, y);
  };

  const handlePointerUp = (e) => {
    if (draggingId !== null) {
      e.target.releasePointerCapture(e.pointerId);
      setDraggingId(null);
    }
  };

  // Helper to visually invert Y-axis mapping during rendering 
  // (since SVG natural origin is top-left, but Math natural origin is bottom-left)
  const renderY = (mathY) => 100 - mathY;

  // Determine standard OLS endpoints (x1=0, x2=100)
  const lineY1 = renderY(regressionLine.b); 
  const lineY2 = renderY(regressionLine.m * 100 + regressionLine.b);
  
  // Dynamic aesthetic thresholds
  const isSeverelyPoisoned = mseLoss > 400; 
  const strokeColor = isSeverelyPoisoned ? '#ef4444' : '#10b981'; 

  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden flex flex-col font-sans">
      
      {/* Heads Up Display */}
      <div className="absolute top-6 left-6 z-10 font-mono text-sm bg-slate-950/80 p-3 rounded-lg backdrop-blur-md border border-slate-700/50 shadow-2xl">
        <div className="text-slate-300 font-semibold mb-1 tracking-wide">DATA POISONING SANDBOX</div>
        <div className={`transition-colors duration-300 ${isSeverelyPoisoned ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
          MSE Loss: {mseLoss.toFixed(1)}
        </div>
        <div className="text-slate-500 text-xs mt-1">
          Line: y = {regressionLine.m.toFixed(2)}x + {regressionLine.b.toFixed(2)}
        </div>
      </div>
      
      {/* Grid Underlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridPattern)" />
      </svg>
      
      {/* Core 2D Renderer */}
      <svg 
        ref={svgRef}
        viewBox="0 0 100 100" 
        className="w-full h-full touch-none relative z-10"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Real-time OLS Regression Line */}
        <line 
          x1="0" 
          y1={lineY1} 
          x2="100" 
          y2={lineY2} 
          stroke={strokeColor} 
          strokeWidth="0.6" 
          className="transition-colors duration-300"
          style={{
            filter: `drop-shadow(0px 0px 4px ${strokeColor})`
          }}
        />

        {/* Mutable Dataset */}
        {points.map((p) => {
          const isDragging = draggingId === p.id;
          const isHighlighted = highlightedOutlierId === p.id;
          return (
            <circle
              key={p.id}
              cx={p.x}
              cy={renderY(p.y)}
              r={isDragging || isHighlighted ? 2.5 : 1.5}
              fill={isHighlighted ? '#ef4444' : '#06b6d4'} // Red if highlighted, else Cyan
              className={`cursor-grab active:cursor-grabbing transition-all duration-75 ease-out ${isHighlighted ? 'animate-pulse' : ''}`}
              onPointerDown={(e) => handlePointerDown(e, p.id)}
              style={{
                opacity: draggingId === null || isDragging || isHighlighted ? 1 : 0.4,
                filter: isDragging || isHighlighted ? `drop-shadow(0px 0px 5px ${isHighlighted ? '#ef4444' : '#06b6d4'})` : 'none'
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
