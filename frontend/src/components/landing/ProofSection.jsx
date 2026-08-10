import { motion } from "framer-motion";
import Reveal from "./Reveal";
import { container, fadeUp, viewportOnce } from "./motion";

const CRED = [
  { k: "Open-source minded", v: "no walled gardens" },
  { k: "Built by builders", v: "not corporate suits" },
  { k: "Shipped in the open", v: "scrappy by design" },
];

export default function ProofSection() {
  return (
    <section id="proof" className="relative scroll-mt-16 border-t border-slate-900 bg-slate-950 py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-500">
            // 03 · The Builders
          </div>
          <h2 className="mt-4 font-mono text-3xl font-bold leading-[1.15] tracking-tight text-slate-100 md:text-4xl">
            Engineered in the trenches.{" "}
            <span className="text-emerald-400">Backed by the Hack Club open-source community.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400">
            FlowLogic was forged as part of{" "}
            <span className="text-slate-200">Hack Club Horizon</span> — by people who actually had
            to debug the size-mismatch at 3am, not a committee writing a roadmap. Developers trust
            tools made by builders who felt the same pain.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mx-auto mt-8 inline-flex items-center gap-2.5 border border-emerald-800/50 bg-[#064e3b]/30 px-4 py-2"
          >
            <span className="hero-dot-pulse h-1.5 w-1.5 bg-emerald-400" />
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-emerald-300">
              Hack Club Horizon · Class of &apos;26
            </span>
          </motion.div>
        </Reveal>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={container(0.12, 0.15)}
          className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-slate-800 bg-slate-800 sm:grid-cols-3"
        >
          {CRED.map(({ k, v }) => (
            <motion.div
              key={k}
              variants={fadeUp}
              whileHover={{ backgroundColor: "rgb(15,23,42)" }}
              className="bg-slate-950 px-6 py-7"
            >
              <div className="font-mono text-sm font-semibold text-slate-100">{k}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-500">{v}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
