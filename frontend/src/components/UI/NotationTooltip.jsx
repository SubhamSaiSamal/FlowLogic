import React, { useState } from 'react';
import { notationDictionary } from '../../lib/notationDictionary';

export function NotationTooltip({ termKey, children }) {
  const [isHovered, setIsHovered] = useState(false);
  const data = notationDictionary[termKey];

  if (!data) return <>{children}</>;

  return (
    <span
      className="relative inline-block cursor-help group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      style={{
        textDecoration: 'underline',
        textDecorationStyle: 'dashed',
        textDecorationColor: '#10b981', // emerald-500
        textUnderlineOffset: '4px',
        textShadow: '0 0 8px rgba(6, 182, 212, 0.4)' // cyan-400 glow
      }}
    >
      {children}

      <div
        className={`
          absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
          w-72 p-4 rounded-xl shadow-2xl
          bg-slate-900/80 backdrop-blur-md border border-emerald-500/30
          transition-all duration-150 ease-out origin-bottom
          ${isHovered ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}
        `}
      >
        {/* Pointer Triangle */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px 
                      border-8 border-transparent border-t-slate-900/80 
                      drop-shadow-[0_1px_1px_rgba(16,185,129,0.3)]"></div>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xl font-bold font-serif shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            {data.symbol}
          </div>
          <h4 className="text-emerald-50 text-base font-semibold tracking-wide m-0">
            {data.name}
          </h4>
        </div>
        
        <p className="text-slate-300 text-sm leading-relaxed mb-3 m-0">
          {data.desc}
        </p>

        <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-700/50 shadow-inner">
          <code className="text-cyan-400 text-xs font-mono break-all font-medium">
            {data.code}
          </code>
        </div>
      </div>
    </span>
  );
}
