import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "./motion";

/* ──────────────────────────────────────────────────────────
   subgrad — Hero shape checker (interactive, framer-motion)
   Two nn.Linear layers wired together. layer1's output (64) feeds
   layer2's input — and when those don't match, the edge glows red
   and the compiler throws. The visitor heals it: click the
   in_features pill to cycle dims, or hit Auto-Heal to splice the
   correct shape in. Every state change is choreographed:
   flip-animated dims, a live edge with a traveling packet, a
   compile-sweep, and crossfading verdicts.
   ────────────────────────────────────────────────────────── */

const OUT_A = 64; // layer1 out_features — the shape layer2 *must* accept
const DIM_CYCLE = [10, 16, 32, 64]; // values the in_features pill steps through

/* A single nn.Linear node card. `portGlow` = "error" | "ok" | null
   controls the input-port halo so the mismatch reads at a glance. */
function LayerNode({ name, inDim, outDim, portGlow, highlightIn }) {
  return (
    <motion.div
      className="relative flex-1 border border-slate-800 bg-slate-900/70 backdrop-blur-sm"
      animate={{
        borderColor:
          portGlow === "error"
            ? "rgba(239,68,68,0.4)"
            : portGlow === "ok"
            ? "rgba(52,173,112,0.4)"
            : "rgb(30,41,59)",
      }}
      transition={{ duration: 0.35 }}
    >
      {/* input port */}
      <motion.span
        className="absolute left-0 top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        animate={
          portGlow === "error"
            ? {
                scale: [1, 1.4, 1],
                borderColor: "#f87171",
                backgroundColor: "#ef4444",
                boxShadow: [
                  "0 0 0px 0px rgba(239,68,68,0.0)",
                  "0 0 10px 2px rgba(239,68,68,0.7)",
                  "0 0 0px 0px rgba(239,68,68,0.0)",
                ],
              }
            : portGlow === "ok"
            ? {
                scale: 1,
                borderColor: "#6ee7b7",
                backgroundColor: "#34d399",
                boxShadow: "0 0 10px 2px rgba(52,173,112,0.7)",
              }
            : { scale: 1, borderColor: "#475569", backgroundColor: "#334155" }
        }
        transition={portGlow === "error" ? { duration: 1.2, repeat: Infinity } : { duration: 0.3 }}
      />
      {/* output port */}
      <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-[5px] rounded-full border border-emerald-300 bg-emerald-400 shadow-[0_0_8px_1px_rgba(52,173,112,0.55)]" />

      <div className="border-b border-slate-800 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
        {name} · nn.Linear
      </div>
      <div className="flex items-center justify-between gap-3 px-3 py-3 font-mono text-[11px]">
        <div>
          <div className="text-slate-600">in</div>
          <div className="relative h-5 text-sm font-semibold">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={inDim}
                initial={highlightIn ? { y: -10, opacity: 0 } : false}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.22, ease: EASE }}
                className={`absolute inset-0 ${
                  highlightIn
                    ? portGlow === "ok"
                      ? "text-emerald-300"
                      : "text-red-300"
                    : "text-slate-200"
                }`}
              >
                {inDim}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <span className="text-slate-700">→</span>
        <div className="text-right">
          <div className="text-slate-600">out</div>
          <div className="text-sm font-semibold text-emerald-300">{outDim}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HeroMiniCompiler() {
  const [inB, setInB] = useState(10);
  const valid = inB === OUT_A;

  const cycleDim = () =>
    setInB((d) => DIM_CYCLE[(DIM_CYCLE.indexOf(d) + 1) % DIM_CYCLE.length] ?? 10);
  const autoHeal = () => setInB(OUT_A);
  const reset = () => setInB(10);

  return (
    <motion.div
      /* panel-dark keeps this editor dark on the light landing page —
         see the scoped theme in index.css. */
      className="panel-dark overflow-hidden rounded-lg border bg-slate-900 shadow-2xl ring-1 ring-black/5"
      animate={{
        borderColor: valid ? "rgba(52,173,112,0.35)" : "rgb(41,37,36)",
        boxShadow: valid
          ? "0 24px 48px -20px rgba(27,23,20,0.45), 0 0 40px -14px rgba(52,173,112,0.35)"
          : "0 24px 48px -20px rgba(27,23,20,0.45)",
      }}
      transition={{ duration: 0.4 }}
    >
      {/* compiler chrome */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-4 w-4 items-center justify-center border border-slate-700 font-mono text-[9px] font-bold leading-none text-emerald-400">
            λ
          </span>
          <span className="font-mono text-[10px] text-slate-500">subgrad // shape checker</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={valid ? "ok" : "err"}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22 }}
            className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
              valid
                ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300"
                : "border-red-900/60 bg-red-950/40 text-red-300"
            }`}
          >
            <motion.span
              className={`h-1.5 w-1.5 rounded-full ${valid ? "bg-emerald-400" : "bg-red-500"}`}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: valid ? 2 : 1, repeat: Infinity }}
            />
            {valid ? "compiled" : "shape error"}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* code pane */}
      <div className="space-y-1 border-b border-slate-800 bg-slate-950 px-4 py-3 font-mono text-[12px] leading-relaxed">
        <div className="flex gap-3">
          <span className="select-none text-slate-700">1</span>
          <span className="text-slate-400">
            layer1 = nn.Linear(<span className="text-slate-300">128</span>,{" "}
            <span className="text-emerald-300">64</span>)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="select-none text-slate-700">2</span>
          <span className="text-slate-400">
            layer2 = nn.Linear(
            <motion.button
              type="button"
              onClick={cycleDim}
              title="click to change in_features"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              animate={{
                borderColor: valid ? "rgba(52,173,112,0.7)" : "rgba(239,68,68,0.7)",
                color: valid ? "#6ee7b7" : "#fca5a5",
                backgroundColor: valid ? "rgba(6,78,59,0.5)" : "rgba(69,10,10,0.5)",
              }}
              className="relative mx-px inline-flex h-[1.5em] min-w-[2em] items-center justify-center overflow-hidden rounded-sm border px-1 font-semibold leading-none"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={inB}
                  initial={{ y: -12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 12, opacity: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  {inB}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            , <span className="text-slate-300">32</span>)
          </span>
        </div>
        <div className="flex gap-3">
          <span className="select-none text-slate-700">3</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={valid ? "ok" : "err"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-slate-600"
            >
              {valid ? "# ✓ shapes aligned — graph compiles" : `# ✗ expected ${OUT_A}, got ${inB}`}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* graph pane — two nodes + the live connecting edge */}
      <div className="relative overflow-hidden bg-slate-950 px-4 pb-3 pt-4">
        {/* one-shot compile sweep on every state change */}
        <motion.div
          key={valid ? "sweep-ok" : "sweep-err"}
          initial={{ x: "-130%", opacity: 0 }}
          animate={{ x: "130%", opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`pointer-events-none absolute inset-y-0 left-0 z-20 w-1/3 bg-gradient-to-r from-transparent ${
            valid ? "via-emerald-400/15" : "via-red-400/10"
          } to-transparent`}
        />

        <div className="relative flex items-stretch">
          <LayerNode name="layer1" inDim={128} outDim={OUT_A} portGlow={null} />

          {/* connecting edge */}
          <div className="relative mx-1 flex min-w-[56px] flex-1 items-center">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
              <motion.line
                x1="0"
                y1="20"
                x2="100"
                y2="20"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={valid ? "2 6" : "5 4"}
                className={valid ? "edge-flow-ok" : ""}
                animate={{ stroke: valid ? "#10b981" : "#ef4444" }}
                transition={{ duration: 0.35 }}
              />
              {/* traveling data packet when valid */}
              {valid && (
                <motion.circle
                  r="2.4"
                  cy="20"
                  fill="#6ee7b7"
                  initial={{ cx: 0, opacity: 0 }}
                  animate={{ cx: 100, opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                />
              )}
            </svg>
            {/* shape badge riding the edge */}
            <motion.span
              animate={{
                borderColor: valid ? "rgba(52,173,112,0.6)" : "rgba(127,29,29,0.7)",
                color: valid ? "#6ee7b7" : "#fca5a5",
                boxShadow: valid ? "0 0 0 rgba(0,0,0,0)" : "0 0 12px rgba(239,68,68,0.35)",
              }}
              transition={{ duration: 0.35 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border bg-slate-950 px-1.5 py-0.5 font-mono text-[9px]"
            >
              {OUT_A} {valid ? "→" : "✗"} {inB}
            </motion.span>
          </div>

          <LayerNode name="layer2" inDim={inB} outDim={32} portGlow={valid ? "ok" : "error"} highlightIn />
        </div>

        {/* status line — the compiler's verdict (crossfades) */}
        <div className="relative mt-3 min-h-[2.6rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={valid ? "ok" : "err"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE }}
              className={`border px-3 py-2 font-mono text-[10px] leading-relaxed ${
                valid
                  ? "border-emerald-900/50 bg-emerald-950/20 text-emerald-300/90"
                  : "border-red-900/50 bg-red-950/20 text-red-300/90"
              }`}
            >
              {valid ? (
                <>
                  <span className="text-emerald-500">✓</span> forward pass OK ·{" "}
                  <span className="text-slate-500">128 → 64 → 32</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-red-400">RuntimeError:</span> mat1 and mat2
                  shapes cannot be multiplied ({OUT_A}x{inB})
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* the one-click surgeon */}
        <motion.button
          type="button"
          onClick={valid ? reset : autoHeal}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          animate={
            valid
              ? { boxShadow: "0 0 0px rgba(52,173,112,0)" }
              : {
                  boxShadow: [
                    "0 0 0px rgba(52,173,112,0)",
                    "0 0 18px rgba(52,173,112,0.5)",
                    "0 0 0px rgba(52,173,112,0)",
                  ],
                }
          }
          transition={valid ? { duration: 0.3 } : { duration: 2, repeat: Infinity }}
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 border px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wide ${
            valid
              ? "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              : "border-emerald-500 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          }`}
        >
          {valid ? "↺ Reset the bug" : "Fix the shape"}
        </motion.button>
      </div>
    </motion.div>
  );
}
