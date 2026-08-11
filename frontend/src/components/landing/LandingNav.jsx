import { motion } from "framer-motion";

/* Persistent sticky nav for the landing page. Lifted out of the hero
   so it stays put across every section and can scroll to anchors. */

const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const NAV_LINKS = [
  { label: "The Problem", id: "problem" },
  { label: "The Toolkit", id: "features" },
  { label: "The Builders", id: "proof" },
];

export default function LandingNav({ onStart }) {
  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 h-16 border-b border-slate-900 bg-slate-950/70 backdrop-blur"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("landing-scroll")
              ?.scrollTo({ top: 0, behavior: "smooth" })
          }
          className="flex items-center gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center border border-slate-700 bg-slate-900 font-mono text-lg font-bold leading-none text-emerald-400">
            λ
          </div>
          <div className="text-left leading-none">
            <div className="font-mono text-sm font-semibold text-slate-100">subgrad</div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
              Interactive ML Labs
            </div>
          </div>
        </button>

        <nav className="hidden items-center gap-7 font-mono text-xs text-slate-400 md:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollToId(link.id)}
              className="transition-colors hover:text-slate-200"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-400 lg:inline-flex">
            <span className="hero-dot-pulse h-1.5 w-1.5 bg-emerald-500" />
            GEMINI + SYMPY
          </span>
          <motion.button
            type="button"
            onClick={onStart}
            whileHover={{ scale: 1.04, boxShadow: "0 0 14px rgba(52,173,112,0.35)" }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="group inline-flex items-center gap-2 bg-emerald-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-slate-950 hover:bg-emerald-400"
          >
            Open the Labs
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
