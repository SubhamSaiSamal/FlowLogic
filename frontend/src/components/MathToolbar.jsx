
const MATH_SYMBOLS = [
  { label: '∫',   latex: '\\int',          id: 'math-btn-integral' },
  { label: '∇',   latex: '\\nabla',        id: 'math-btn-nabla' },
  { label: 'Σ',   latex: '\\sum',          id: 'math-btn-sum' },
  { label: '∂',   latex: '\\partial',      id: 'math-btn-partial' },
  { label: '∞',   latex: '\\infty',        id: 'math-btn-infty' },
  { label: '√',   latex: '\\sqrt{}',       id: 'math-btn-sqrt' },
  { label: 'π',   latex: '\\pi',           id: 'math-btn-pi' },
  { label: 'α',   latex: '\\alpha',        id: 'math-btn-alpha' },
  { label: 'θ',   latex: '\\theta',        id: 'math-btn-theta' },
  { label: 'λ',   latex: '\\lambda',       id: 'math-btn-lambda' },
  { label: 'dx',  latex: 'dx',             id: 'math-btn-dx' },
  { label: 'd/dx', latex: '\\frac{d}{dx}', id: 'math-btn-ddx' },
];

const MathToolbar = ({ onInsert, disabled }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full">
      <span className="text-xs font-mono text-slate-500 mr-2 whitespace-nowrap hidden sm:inline">
        LaTeX shortcuts
      </span>
      {MATH_SYMBOLS.map((sym) => (
        <button
          key={sym.id}
          id={sym.id}
          className="flex-shrink-0 min-w-[28px] h-7 px-1.5 flex items-center justify-center text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500 transition-colors disabled:opacity-50 disabled:hover:bg-slate-900 disabled:hover:border-slate-700 shadow-sm"
          type="button"
          title={sym.latex}
          onClick={() => onInsert(sym.latex)}
          disabled={disabled}
        >
          {sym.label}
        </button>
      ))}
    </div>
  );
};

export default MathToolbar;
