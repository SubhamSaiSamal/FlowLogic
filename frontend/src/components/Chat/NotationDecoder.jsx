import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { notationDictionary } from '../../lib/notationDictionary';
import { usePseudoCompilerStore } from '../../store/pseudoCompilerStore';

// ============================================================================
//  NOTATION TOOLTIP
//  A sleek, dark popover that reveals on hover. Renders the symbol, plain
//  English definition, and the PyTorch code equivalent.
// ============================================================================
function NotationTooltipInline({ term, data }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className="relative inline-block cursor-help"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      style={{
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        textDecorationColor: '#10b981',
        textUnderlineOffset: '4px',
        textDecorationThickness: '2px',
      }}
    >
      <span className="text-emerald-300">{data.name}</span>

      {/* Popover */}
      <div
        className={`
          absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3
          w-80 p-4 rounded-xl shadow-2xl
          bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30
          transition-all duration-200 ease-out origin-bottom pointer-events-none
          ${isHovered ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-95 invisible'}
        `}
      >
        {/* Pointer */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px
                        border-8 border-transparent border-t-slate-900/90
                        drop-shadow-[0_1px_1px_rgba(52,173,112,0.3)]" />

        {/* Symbol + Name */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xl font-bold font-serif shadow-[0_0_10px_rgba(52,173,112,0.2)]">
            {data.symbol}
          </div>
          <div>
            <div className="text-emerald-50 text-sm font-semibold tracking-wide">{data.name}</div>
            <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">{term}</div>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-300 text-xs leading-relaxed mb-3 m-0">
          {data.desc}
        </p>

        {/* Code Block */}
        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-700/50 shadow-inner">
          <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest mb-1">PyTorch</div>
          <code className="text-cyan-400 text-xs font-mono break-all font-medium">
            {data.code}
          </code>
        </div>
      </div>
    </span>
  );
}

// ============================================================================
//  AUTO-HEAL BUTTON
//  A one-click patch button rendered inline in the chat when the LLM outputs
//  [PATCH: layer_X, prop, value]. Dispatches applyCodePatch to the compiler
//  store and transitions to a success state.
// ============================================================================
function AutoHealButton({ layerIndex, targetProp, newValue }) {
  const [status, setStatus] = useState('ready'); // 'ready' | 'applied' | 'failed' | 'stale'
  const [lockedVersion] = useState(() => usePseudoCompilerStore.getState().codeVersion);
  const applyCodePatch = usePseudoCompilerStore(state => state.applyCodePatch);

  const propLabel = targetProp === 'in' ? 'Input' : 'Output';
  const layerLabel = `layer_${layerIndex}`;

  const handleApply = () => {
    if (status !== 'ready') return;

    const result = applyCodePatch(layerIndex, targetProp, newValue, lockedVersion);
    if (result === "STALE_CODE") {
      setStatus('stale');
    } else {
      setStatus(result ? 'applied' : 'failed');
    }
  };

  if (status === 'applied') {
    return (
      <div className="
        inline-flex items-center gap-2
        my-2 px-4 py-2.5 rounded-xl
        bg-emerald-950/50 border border-emerald-500/40
        text-emerald-300 text-sm font-mono
        shadow-[0_0_20px_rgba(52,173,112,0.15)]
        transition-all duration-300
      ">
        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/25 border border-emerald-500/50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span>
          Patch Applied — <span className="text-emerald-400 font-semibold">{layerLabel}.{targetProp}</span> set to <span className="text-emerald-200 font-semibold">{newValue}</span>
        </span>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="
        inline-flex items-center gap-2
        my-2 px-4 py-2.5 rounded-xl
        bg-red-950/50 border border-red-500/40
        text-red-300 text-sm font-mono
      ">
        <span className="text-red-400">✕</span>
        <span>Patch failed — layer not found in code</span>
      </div>
    );
  }

  if (status === 'stale') {
    return (
      <div className="
        inline-flex items-center gap-2
        my-2 px-4 py-2.5 rounded-xl
        bg-red-950/50 border border-red-500/40
        text-red-300 text-sm font-mono
      ">
        <span className="text-red-400">✕</span>
        <span>Code modified. Please ask the tutor to analyze the new code.</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleApply}
      className="
        group relative inline-flex items-center gap-2.5
        my-2 px-5 py-2.5 rounded-xl
        bg-violet-950/50 backdrop-blur-sm
        border border-violet-500/40
        text-violet-200 text-sm font-mono font-medium
        shadow-[0_0_20px_rgba(139,92,246,0.15)]
        hover:bg-violet-950/70 hover:border-violet-500/60 hover:shadow-[0_0_30px_rgba(139,92,246,0.25)]
        active:scale-[0.97]
        transition-all duration-200
        cursor-pointer
      "
    >
      {/* Shimmer effect */}
      <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-violet-500/10 to-transparent" />
      </span>

      {/* Icon */}
      <span className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/40 text-base">
        🪄
      </span>

      {/* Label */}
      <span className="relative">
        Apply Matrix Fix: Set <span className="text-violet-300 font-semibold">{propLabel}</span> to <span className="text-violet-100 font-semibold">{newValue}</span>
      </span>

      {/* Layer badge */}
      <span className="relative ml-1 text-[10px] text-violet-400/60 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
        {layerLabel}
      </span>
    </button>
  );
}

// ============================================================================
//  COMBINED REGEX: NOTATION + PATCH
//  Matches both %%term%% notation markers and [PATCH: ...] action commands
//  in a single pass through the text.
//
//  Pattern breakdown:
//    %%(\w+)%%                                    → Notation tooltip
//    \[PATCH:\s*layer_(\d+),\s*(in|out),\s*(\d+)\] → Auto-heal patch
// ============================================================================
const COMBINED_REGEX = /%%([\w]+)%%|\[PATCH:\s*layer_(\d+),\s*(in|out),\s*(\d+)\]/g;

/**
 * Scans a raw text string for %%term%% markers AND [PATCH: ...] commands.
 * Returns an array of React nodes with tooltips and patch buttons injected.
 */
function injectInteractiveElements(text) {
  if (!text || typeof text !== 'string') return text;

  const nodes = [];
  let lastIndex = 0;

  // Reset the global regex
  COMBINED_REGEX.lastIndex = 0;

  let match;
  while ((match = COMBINED_REGEX.exec(text)) !== null) {
    // Push any plain text before this match
    if (match.index > lastIndex) {
      nodes.push(text.substring(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      // %%term%% notation match
      const term = match[1].toLowerCase();
      const data = notationDictionary[term];
      if (data) {
        nodes.push(
          <NotationTooltipInline key={`nt-${match.index}-${term}`} term={term} data={data} />
        );
      } else {
        // Term not in dictionary — render as plain text
        nodes.push(match[0]);
      }
    } else if (match[2] !== undefined) {
      // [PATCH: layer_X, prop, value] match
      const layerIndex = parseInt(match[2], 10);
      const targetProp = match[3];
      const newValue = parseInt(match[4], 10);

      nodes.push(
        <AutoHealButton
          key={`patch-${match.index}-${layerIndex}-${targetProp}`}
          layerIndex={layerIndex}
          targetProp={targetProp}
          newValue={newValue}
        />
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push any remaining text after the last match
  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  // If no matches were found, return the original text
  if (nodes.length === 0) return text;

  return nodes;
}

/**
 * Recursively walks React children and applies notation + patch injection
 * to all string nodes. Skips code blocks and math nodes.
 */
function processChildren(children) {
  if (typeof children === 'string') {
    return injectInteractiveElements(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        const result = injectInteractiveElements(child);
        return Array.isArray(result)
          ? <React.Fragment key={i}>{result}</React.Fragment>
          : result;
      }
      return child;
    });
  }
  return children;
}

// ============================================================================
//  NOTATION DECODER
//  A drop-in replacement for rendering LLM markdown responses.
//  Intercepts %%term%% patterns and [PATCH: ...] commands, rendering
//  interactive tooltips and one-click patch buttons respectively.
// ============================================================================
export default function NotationDecoder({ content }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        // Override <p> to <div> to prevent DOM nesting violations with tooltips/buttons
        p: ({ node, children, ...props }) => (
          <div className="mb-3 leading-relaxed" {...props}>
            {processChildren(children)}
          </div>
        ),
        li: ({ node, children, ...props }) => (
          <li {...props}>{processChildren(children)}</li>
        ),
        strong: ({ node, children, ...props }) => (
          <strong className="text-slate-100 font-semibold" {...props}>
            {processChildren(children)}
          </strong>
        ),
        em: ({ node, children, ...props }) => (
          <em className="text-cyan-300/90" {...props}>
            {processChildren(children)}
          </em>
        ),
        span: ({ node, children, ...props }) => {
          // Bypass KaTeX math spans
          if (props.className?.includes('math')) {
            return <span {...props}>{children}</span>;
          }
          return <span {...props}>{processChildren(children)}</span>;
        },
        // Code blocks are left untouched — no notation or patch injection
        code: ({ node, inline, className, children, ...props }) => {
          if (inline) {
            return (
              <code className="bg-slate-800/80 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-700/50" {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        pre: ({ node, children, ...props }) => (
          <pre className="bg-slate-900/80 border border-slate-700/50 rounded-lg p-3 overflow-x-auto my-3 text-sm" {...props}>
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
