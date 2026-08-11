import { motion } from "framer-motion";
import { container, fadeUp, EASE, viewportOnce } from "./motion";

export default function FinalCTASection({ onStart }) {
  return (
    <section className="relative scroll-mt-16 border-t border-slate-900 bg-slate-950 py-28">
      <div className="relative mx-auto max-w-2xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: EASE }}
          /* panel-dark: a terminal rendered on paper looks wrong. Keeping
             it dark makes it read as a real shell and gives the light
             page a deliberate focal point. The dark-mode green glow it
             used to sit on became a grey smudge on paper, so it's gone —
             a plain drop shadow does the lifting now. */
          className="panel-dark overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-[0_28px_60px_-24px_rgba(27,23,20,0.5)]"
        >
          {/* terminal chrome */}
          <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950/60 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-2 font-mono text-[11px] text-slate-500">subgrad — session</span>
          </div>

          {/* terminal body */}
          <div className="p-8 md:p-10">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={container(0.5, 0.2)}
              className="font-mono text-sm leading-relaxed"
            >
              <motion.div variants={fadeUp} className="text-slate-500">
                <span className="text-emerald-400">$</span> subgrad init
              </motion.div>
              <motion.div variants={fadeUp} className="mt-1 text-slate-400">
                <span className="text-slate-600">&gt;</span> checking architecture...{" "}
                <span className="text-emerald-400">ok</span>
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
              className="mt-6 font-mono text-2xl font-bold leading-snug tracking-tight text-slate-100 md:text-3xl"
            >
              Ready to actually understand your architecture?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-3 font-mono text-sm text-slate-500"
            >
              Initialize your first session.
              <span className="hero-caret ml-0.5 text-emerald-400">▍</span>
            </motion.p>

            <motion.button
              type="button"
              onClick={onStart}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              whileHover={{ scale: 1.03, boxShadow: "0 0 32px rgba(52,173,112,0.65)" }}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: [
                  "0 0 12px rgba(52,173,112,0.3)",
                  "0 0 26px rgba(52,173,112,0.6)",
                  "0 0 12px rgba(52,173,112,0.3)",
                ],
              }}
              transition={{
                opacity: { duration: 0.5, delay: 0.85 },
                y: { duration: 0.5, delay: 0.85 },
                boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.2 },
              }}
              className="group mt-8 inline-flex items-center gap-2 bg-emerald-500 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide text-slate-950 hover:bg-emerald-400"
            >
              [ Initialize Socratic Session ]
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
