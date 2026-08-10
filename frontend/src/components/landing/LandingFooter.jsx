export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center border border-slate-700 bg-slate-900 font-mono text-xs font-bold leading-none text-emerald-400">
            λ
          </div>
          <span className="font-mono text-xs text-slate-500">
            FlowLogic — prove the math, don&apos;t memorize it.
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-600">
          Built in the trenches for Hack Club Horizon · Gemini + SymPy
        </div>
      </div>
    </footer>
  );
}
