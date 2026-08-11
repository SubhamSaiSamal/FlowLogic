import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePseudoCompilerStore } from '../../store/pseudoCompilerStore';

export default function CodeEditorPane() {
  const rawCode = usePseudoCompilerStore(state => state.rawCode);
  const setRawCode = usePseudoCompilerStore(state => state.setRawCode);
  const parsedLayers = usePseudoCompilerStore(state => state.parsedLayers);
  const validationErrors = usePseudoCompilerStore(state => state.validationErrors);

  // Local buffer for the textarea so we only push to the store after debounce
  const [localCode, setLocalCode] = useState(rawCode);
  const debounceRef = useRef(null);

  // Sync local state if the store code changes externally (e.g., from an LLM action)
  useEffect(() => {
    setLocalCode(rawCode);
  }, [rawCode]);

  const handleChange = useCallback((e) => {
    const newCode = e.target.value;
    setLocalCode(newCode);

    // Debounce: wait 300ms after the user stops typing before pushing to the store
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setRawCode(newCode);
    }, 300);
  }, [setRawCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const layerCount = parsedLayers.length;
  const errorCount = validationErrors.length;
  const dimensionalCount = parsedLayers.filter(l => !l.isPassthrough).length;

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Editor Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-xs font-mono text-slate-500 ml-2">model.py</span>
        </div>
        <span className="text-xs font-mono text-slate-600">shape-checker v1.0</span>
      </div>

      {/* Diagnostics Bar */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-2 border-b border-slate-800/50 bg-slate-900/30">
        <span className="text-xs font-mono text-slate-500">
          Layers: <span className="text-cyan-400 font-semibold">{layerCount}</span>
        </span>
        <span className="text-xs font-mono text-slate-500">
          Dimensional: <span className="text-slate-300 font-semibold">{dimensionalCount}</span>
        </span>
        <span className={`text-xs font-mono ${errorCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {errorCount > 0 ? `⚠ ${errorCount} shape error${errorCount > 1 ? 's' : ''}` : '✓ All shapes valid'}
        </span>
      </div>

      {/* Code Textarea */}
      <div className="flex-1 relative overflow-hidden">
        {/* Line numbers gutter */}
        <div className="absolute top-0 left-0 w-10 h-full bg-slate-900/50 border-r border-slate-800/50 pointer-events-none z-10 overflow-hidden">
          <div className="pt-4 px-1">
            {localCode.split('\n').map((_, i) => (
              <div key={i} className="text-right text-[11px] font-mono text-slate-700 leading-[1.625rem] select-none pr-1">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <textarea
          value={localCode || ""}
          onChange={handleChange}
          spellCheck={false}
          className="w-full h-full bg-transparent text-slate-200 font-mono text-sm leading-[1.625rem] resize-none outline-none p-4 pl-12 selection:bg-cyan-900/40 selection:text-cyan-100 caret-cyan-400"
          style={{
            tabSize: 4,
          }}
        />
      </div>

      {/* Error Console */}
      {errorCount > 0 && (
        <div className="shrink-0 border-t border-red-900/50 bg-red-950/30 max-h-32 overflow-y-auto">
          <div className="px-4 py-2">
            <div className="text-[10px] font-mono text-red-500/80 uppercase tracking-widest mb-1">Compilation Errors</div>
            {validationErrors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <span className="text-red-500 text-xs mt-0.5 shrink-0">✕</span>
                <span className="text-xs font-mono text-red-300/90">
                  <span className="text-red-400">{err.sourceId}</span>
                  <span className="text-red-600 mx-1">→</span>
                  <span className="text-red-400">{err.targetId}</span>
                  <span className="text-red-500/80 ml-2">{err.message}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
