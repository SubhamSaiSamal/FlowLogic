import { motion, useMotionValue, useSpring } from "framer-motion";
import HeroMiniCompiler from "./landing/HeroMiniCompiler";
import { container, fadeUp, EASE } from "./landing/motion";

/* ──────────────────────────────────────────────────────────
   FlowLogic — Hero / landing section
   Dark terminal aesthetic · emerald accent · sharp corners.
   Staggered framer-motion entrance + a spring-tracked mouse glow.
   The right pane is an interactive Mini-Compiler that lets the
   visitor heal a real nn.Linear shape mismatch — show, don't tell.
   ────────────────────────────────────────────────────────── */

function ProofBadge({ children }) {
  return (
    <motion.span
      variants={fadeUp}
      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400"
    >
      <span className="h-1.5 w-1.5 bg-emerald-500" />
      {children}
    </motion.span>
  );
}

export default function HeroSection({ onStart, onLabs }) {
  // Spring-tracked mouse glow: raw pointer -> spring -> GPU transform.
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const glowOpacity = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 120, damping: 24, mass: 0.4 });
  const y = useSpring(my, { stiffness: 120, damping: 24, mass: 0.4 });

  const onPointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - rect.left - 300);
    my.set(e.clientY - rect.top - 300);
    glowOpacity.set(1);
  };
  const onPointerLeave = () => glowOpacity.set(0);

  return (
    <section
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950 text-slate-300 font-sans"
    >
      {/* Graph-paper dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(16,185,129,0.045) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Spring-tracked emerald glow (GPU transform only) */}
      <motion.div
        style={{ x, y, opacity: glowOpacity }}
        className="pointer-events-none absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.08] blur-[120px] will-change-transform"
      />
      {/* Static emerald wash behind the visual */}
      <div className="pointer-events-none absolute right-0 top-1/4 h-[480px] w-[480px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />

      {/* ── Hero body ── */}
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[52fr_48fr] lg:py-24">
        {/* Left — copy (staggered children) */}
        <motion.div
          className="max-w-xl"
          variants={container(0.12, 0.05)}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 border border-emerald-800/60 bg-[#064e3b]/30 px-3 py-1.5"
          >
            <span className="hero-dot-pulse h-1.5 w-1.5 bg-emerald-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-300">
              In-Browser Compiler · Socratic Method · Zero-Hallucination
            </span>
          </motion.div>

          <h1 className="mt-6 font-mono text-4xl font-bold leading-[1.07] tracking-tight text-slate-100 md:text-5xl lg:text-6xl">
            <motion.span variants={fadeUp} className="block">
              Don&apos;t memorize the formula.
            </motion.span>
            <motion.span variants={fadeUp} className="block text-emerald-400">
              Prove it.
            </motion.span>
          </h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-lg text-base leading-relaxed text-slate-400 md:text-lg"
          >
            FlowLogic is a visual, in-browser PyTorch dimension compiler and Socratic ML
            tutor. Catch tensor shape mismatches before the stack trace does, decode the
            notation, and build the intuition that survives production — not just the exam.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              onClick={onStart}
              whileHover={{ y: -2, boxShadow: "0 0 22px rgba(16,185,129,0.45)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="group inline-flex items-center gap-2 bg-emerald-500 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide text-slate-950 hover:bg-emerald-400"
            >
              Start a Session
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={onLabs ?? onStart}
              whileHover={{ y: -2, borderColor: "rgb(100,116,139)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="inline-flex items-center border border-slate-700 bg-transparent px-6 py-3 font-mono text-sm uppercase tracking-wide text-slate-300 hover:text-slate-100"
            >
              Open the Labs
            </motion.button>
          </motion.div>

          <motion.div
            variants={container(0.08, 0.1)}
            className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2"
          >
            <ProofBadge>AST Shape Parser</ProofBadge>
            <ProofBadge>Notation Bridge</ProofBadge>
            <ProofBadge>Auto-Heal Patcher</ProofBadge>
          </motion.div>
        </motion.div>

        {/* Right — interactive Mini-Compiler */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
        >
          <HeroMiniCompiler />
        </motion.div>
      </div>
    </section>
  );
}
