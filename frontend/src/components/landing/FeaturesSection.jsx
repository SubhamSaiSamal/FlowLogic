import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { container, fadeUp, viewportOnce } from "./motion";

/* ── Pillar 1 · The Engine: regex/AST catching a dimension shape ── */
function ASTVisual() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 font-mono text-[11px] leading-relaxed">
      <div className="text-slate-600">// real-time shape parser</div>
      <div className="text-slate-300">
        <span className="text-emerald-400">/nn\.Linear\(</span>
        <motion.span
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-sm bg-amber-400/15 px-0.5 text-amber-300 ring-1 ring-amber-400/30"
        >
          (\d+)
        </motion.span>
        <span className="text-slate-500">,\s*</span>
        <motion.span
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="rounded-sm bg-amber-400/15 px-0.5 text-amber-300 ring-1 ring-amber-400/30"
        >
          (\d+)
        </motion.span>
        <span className="text-emerald-400">\)/g</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-slate-500">
        <span className="text-emerald-500">✓ caught</span>
        <span className="border border-slate-800 bg-slate-950 px-1.5 py-0.5 text-emerald-300">in=128</span>
        <span className="border border-slate-800 bg-slate-950 px-1.5 py-0.5 text-emerald-300">out=64</span>
      </div>
    </div>
  );
}

/* ── Pillar 2 · The Decoder: a Jacobian with its PyTorch tooltip ── */
function NotationVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <span className="font-mono text-2xl text-slate-200">
        J = <span className="italic">∂f</span>
        <span className="px-0.5 text-slate-500">/</span>
        <span className="italic">∂x</span>
      </span>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[64%] w-max -translate-x-1/2 border border-emerald-800/60 bg-slate-900 px-3 py-1.5 shadow-lg"
      >
        <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-emerald-800/60 bg-slate-900" />
        <code className="font-mono text-[11px] text-emerald-300">
          torch.autograd.functional.jacobian(f, x)
        </code>
      </motion.div>
    </div>
  );
}

/* ── Pillar 3 · The Surgeon: a one-click dimension diff ── */
function PatcherVisual() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1 font-mono text-[11px]">
      <div className="flex items-center gap-2 border-l-2 border-red-500/70 bg-red-950/30 px-2 py-1 text-red-300/90">
        <span className="text-red-500">-</span>
        <span>nn.Linear(<span className="text-red-400">10</span>, 32)</span>
      </div>
      <motion.div
        animate={{ backgroundColor: ["rgba(6,78,59,0.3)", "rgba(6,78,59,0.55)", "rgba(6,78,59,0.3)"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center gap-2 border-l-2 border-emerald-500/70 px-2 py-1 text-emerald-300"
      >
        <span className="text-emerald-500">+</span>
        <span>nn.Linear(<span className="text-emerald-400">64</span>, 32)</span>
      </motion.div>
      <div className="px-2 pt-1 text-slate-600">// dimension auto-patched ✓</div>
    </div>
  );
}

const PILLARS = [
  {
    n: "01",
    kicker: "The Engine",
    title: "Shapes checked as you type",
    body:
      "Paste a model definition and it walks the layers, propagating dimensions to find where a shape first stops matching — not where the runtime finally throws. Straight-line MLP and conv stacks; it gives up on dynamic control flow.",
    Visual: ASTVisual,
  },
  {
    n: "02",
    kicker: "The Decoder",
    title: "Socratic Notation Bridge",
    body:
      "Stop Googling Greek symbols. Hover any piece of math — a Jacobian, a gradient — to reveal the exact PyTorch call it maps to.",
    Visual: NotationVisual,
  },
  {
    n: "03",
    kicker: "The Fix",
    title: "One-click shape fix",
    body:
      "Once the mismatch is located, patch the correct dimension straight into the code and watch the shape graph go green — without leaving the editor.",
    Visual: PatcherVisual,
  },
];

/* Pointer-tracked 3D tilt card with spring-damped rotation. */
function TiltCard({ children }) {
  const rxRaw = useMotionValue(0);
  const ryRaw = useMotionValue(0);
  const rotateX = useSpring(rxRaw, { stiffness: 150, damping: 18 });
  const rotateY = useSpring(ryRaw, { stiffness: 150, damping: 18 });
  // sheen that tracks the tilt
  const sheenX = useTransform(ryRaw, [-6, 6], ["0%", "100%"]);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rxRaw.set(-py * 6);
    ryRaw.set(px * 6);
  };
  const onLeave = () => {
    rxRaw.set(0);
    ryRaw.set(0);
  };

  return (
    <motion.div
      variants={fadeUp}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileHover={{ y: -6 }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group relative h-full"
    >
      {/* tilt-tracked sheen */}
      <motion.div
        style={{ "--sheen-x": sheenX }}
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(220px circle at var(--sheen-x, 50%) 0%, rgba(52,173,112,0.10), transparent 70%)",
          }}
        />
      </motion.div>
      <div className="relative flex h-full flex-col border border-slate-800 bg-slate-900/40 transition-colors duration-300 group-hover:border-emerald-700/50 group-hover:shadow-[0_0_30px_-12px_rgba(52,173,112,0.45)]">
        {children}
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="relative scroll-mt-16 border-t border-slate-900 bg-slate-950 py-24">
      {/* faint dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(52,173,112,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={container(0.1)}>
          <motion.div
            variants={fadeUp}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-500"
          >
            // 02 · The Toolkit
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-4 max-w-3xl font-mono text-3xl font-bold leading-[1.15] tracking-tight text-slate-100 md:text-4xl"
          >
            Three instruments for the same job: making the invisible{" "}
            <span className="text-emerald-400">legible</span>.
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={container(0.14, 0.1)}
          className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {PILLARS.map(({ n, kicker, title, body, Visual }) => (
            <TiltCard key={n}>
              {/* visual panel */}
              <div className="h-36 border-b border-slate-800 bg-slate-950/60 p-4">
                <Visual />
              </div>
              {/* copy */}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
                  <span className="text-emerald-500">{n}</span>
                  <span className="text-slate-500">{kicker}</span>
                  <span className="h-px flex-1 bg-slate-800" />
                </div>
                <h3 className="mt-3 font-mono text-lg font-semibold text-slate-100">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
              </div>
            </TiltCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
