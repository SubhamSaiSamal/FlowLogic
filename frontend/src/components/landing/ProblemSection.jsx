import katex from "katex";
import { motion } from "framer-motion";
import Reveal from "./Reveal";
import { container, fadeUp, EASE, viewportOnce } from "./motion";

/* Dense academic notation — rendered for real via KaTeX so the
   "terrifying block of math" actually looks the part. */
const EQUATIONS = [
  "\\frac{\\partial \\mathcal{L}}{\\partial W^{(l)}} = \\delta^{(l)} \\left(a^{(l-1)}\\right)^{\\top}",
  "\\delta^{(l)} = \\left(W^{(l+1)}\\right)^{\\top}\\delta^{(l+1)} \\odot \\sigma'\\!\\left(z^{(l)}\\right)",
  "\\mathrm{Attn}(Q,K,V) = \\mathrm{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right)V",
  "\\mathcal{L}_{CE} = -\\sum_{i=1}^{N} y_i \\log \\hat{y}_i",
  "\\nabla_\\theta J(\\theta) = \\mathbb{E}\\!\\left[\\nabla_\\theta \\log \\pi_\\theta(a\\mid s)\\, Q^{\\pi}(s,a)\\right]",
];

function Eq({ tex }) {
  const html = katex.renderToString(tex, { displayMode: true, throwOnError: false });
  return (
    <motion.div
      variants={fadeUp}
      className="katex-display !my-0 text-slate-300"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* Terminal stack trace, revealed line-by-line so it "scrolls in"
   like a real traceback printing to stdout. */
const TRACE = [
  <>
    <span className="text-emerald-400">$</span> python train.py
  </>,
  <>&nbsp;</>,
  <>Traceback (most recent call last):</>,
  <>
    {"  "}File <span className="text-slate-300">&quot;train.py&quot;</span>, line 42, in &lt;module&gt;
  </>,
  <>{"    "}logits = model(x)</>,
  <>
    {"  "}File <span className="text-slate-300">&quot;.../nn/modules/linear.py&quot;</span>, line 116, in
    forward
  </>,
  <>{"    "}return F.linear(input, self.weight, self.bias)</>,
  <>
    <span className="font-semibold text-red-400">RuntimeError: </span>
    <span className="text-red-300">
      mat1 and mat2 shapes cannot be{"\n"}
      {"    "}multiplied (32x784 and 128x10)
    </span>
    <span className="hero-caret text-emerald-400">▍</span>
  </>,
];

export default function ProblemSection() {
  return (
    <section id="problem" className="relative scroll-mt-16 border-t border-slate-900 bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-500">
            // 01 · The Problem
          </div>
          <h2 className="mt-4 max-w-4xl font-mono text-3xl font-bold leading-[1.15] tracking-tight text-slate-100 md:text-4xl">
            The gap between academic notation and{" "}
            <span className="text-emerald-400">raw execution</span> is where engineers go to die.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            You can follow the proof on the whiteboard. Then the tensor shapes lie to you, the
            stack trace scrolls past, and you&apos;re back to printing
            <code className="mx-1 border border-slate-800 bg-slate-900 px-1.5 py-0.5 font-mono text-sm text-slate-300">
              .shape
            </code>
            into the void.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-slate-800 bg-slate-800 lg:grid-cols-2">
          {/* Left — the textbook */}
          <Reveal className="bg-slate-950">
            <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
              <span className="h-2 w-2 bg-slate-700" />
              <span className="font-mono text-[11px] text-slate-500">deep_learning.tex — the theory</span>
            </div>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={container(0.12, 0.1)}
              className="space-y-5 p-6 md:p-8"
            >
              {EQUATIONS.map((tex) => (
                <Eq key={tex} tex={tex} />
              ))}
            </motion.div>
          </Reveal>

          {/* Right — the terminal reality */}
          <Reveal className="bg-slate-950" delay={120}>
            <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
              <span className="h-2 w-2 bg-red-500/80" />
              <span className="font-mono text-[11px] text-slate-500">$ python train.py — the reality</span>
            </div>
            <div className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed md:p-8">
              <motion.pre
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                variants={container(0.16, 0.3)}
                className="text-slate-400"
              >
                {TRACE.map((line, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, x: -6 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: EASE } },
                    }}
                  >
                    {line}
                  </motion.div>
                ))}
              </motion.pre>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
