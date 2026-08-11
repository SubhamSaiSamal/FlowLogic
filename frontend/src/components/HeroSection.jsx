import { motion, useMotionValue, useSpring } from "framer-motion";
import HeroMiniCompiler from "./landing/HeroMiniCompiler";
import { container, fadeUp, EASE } from "./landing/motion";

/* ──────────────────────────────────────────────────────────
   subgrad — Hero / landing section
   Warm-charcoal terminal aesthetic · leaf-green accent · sharp corners.
   Staggered framer-motion entrance + a spring-tracked mouse glow.
   The right pane is an interactive shape checker that lets the
   visitor fix a real nn.Linear mismatch — show, don't tell.

   Copy leads with the LABS, not the tutor. The Show HN base rates
   are lopsided on this: ~25 "AI tutor" posts landed at 1-5 points,
   while interactive-explorable framing cleared 119+. Lead with the
   thing nobody else has.
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
      {/* Graph-paper dot grid — darker ink than the dark-mode version,
          since a 4%-alpha dot is invisible on paper. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(27,23,20,0.10) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Spring-tracked cursor wash. On a light page a blurred green
          blob reads as a smudge, so this is a soft warm-white lift
          rather than the dark-mode glow. */}
      <motion.div
        style={{ x, y, opacity: glowOpacity }}
        className="pointer-events-none absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-white/50 blur-[120px] will-change-transform"
      />

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
              Four interactive labs · Runs in the browser · No signup
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
            subgrad is four interactive labs for the parts of ML that never click from
            reading — gradient descent, backprop, outliers, tensor shapes. Break them on
            purpose and watch what actually happens. The maths is computed by SymPy, not
            guessed by a model.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              onClick={onLabs ?? onStart}
              whileHover={{ y: -2, boxShadow: "0 0 22px rgba(52,173,112,0.45)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="group inline-flex items-center gap-2 bg-emerald-500 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide text-slate-950 hover:bg-emerald-400"
            >
              Open the Labs
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={onStart}
              whileHover={{ y: -2, borderColor: "rgb(90,83,80)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="inline-flex items-center border border-slate-700 bg-transparent px-6 py-3 font-mono text-sm uppercase tracking-wide text-slate-300 hover:text-slate-100"
            >
              Start a Session
            </motion.button>
          </motion.div>

          <motion.div
            variants={container(0.08, 0.1)}
            className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2"
          >
            {/* Honest labels. It's a regex-based shape checker, not an AST parser —
                see pseudoCompilerStore.js. Overclaiming here is exactly the sort of
                thing HN checks and dunks on. */}
            <ProofBadge>Static shape checker</ProofBadge>
            <ProofBadge>Notation decoder</ProofBadge>
            <ProofBadge>SymPy-backed maths</ProofBadge>
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
