# subgrad — Hero Section Prompt for Claude Design

---

## Paste this into Claude Design:

---

Design a hero section for **subgrad**, a Socratic AI tutor that teaches Calculus and Machine Learning through guided discovery — not by giving answers. The core philosophy: it forces users to *prove* the math step by step, using a deterministic SymPy backend to verify every derivative and integral, while an AI tutor (Gemini) refuses to hand over the solution.

---

### Brand identity
- **Product name:** subgrad (lowercase always)
- **Logo mark:** The lambda symbol `λ` inside a sharp-cornered square (no rounded corners) — think terminal prompt, not app icon
- **Sub-tagline beneath logo:** "SUBGRAD TERMINAL ENV" in tiny uppercase tracking-widest monospace
- **Visual DNA:** dark terminal aesthetic meets rigorous academia — like VS Code if it taught you calculus
- **Accent color:** Emerald green (#10b981) — used sparingly for CTAs, status indicators, and key highlights
- **Background:** Near-black slate (#020617) — not pure black, has a subtle blue undertone
- **Typography:** Monospace (JetBrains Mono or similar) for all branding, code, and UI chrome. Inter or system sans-serif for body copy only.

---

### Hero section layout

**Split layout — left copy, right visual**

**Left side (55% width):**
- Small eyebrow badge above headline: a pill/tag reading `● ZERO-HALLUCINATION · SOCRATIC METHOD · SYMPY VERIFIED` in emerald text on a very dark green background, with a pulsing dot
- Main headline (large, bold, mono): `Don't memorize the formula. Prove it.` — where "Prove it." is in emerald green
- Supporting paragraph (sans-serif, muted slate-400 color): "subgrad is a Socratic ML tutor that refuses to hand you the answer. Manipulate live 3D loss surfaces, verify derivatives step-by-step, and build the geometric intuition that survives competitive math — not just the exam."
- Two CTA buttons stacked horizontally:
  - Primary: `START A SESSION →` — solid emerald background, dark text, sharp corners, uppercase mono
  - Secondary: `OPEN THE LABS` — transparent background, slate border, slate text, same sharp corners
- Below CTAs: three small proof-of-tech badges in a row: `Gemini + SymPy` · `3D Gradient Lab` · `Step Verifier` — each with a small emerald dot

**Right side (45% width):**
A stylized product preview showing the two-pane app UI:
- Left inner pane (chat): Shows a short Socratic dialogue exchange — user asks "What's the derivative of x² sin(x)?" and the AI responds "Which rule applies here?" — rendered as dark chat bubbles in the terminal aesthetic
- Right inner pane (viz): A wireframe 3D gradient descent surface (mesh grid, emerald lines on black), with a glowing dot at the current minimum and a small label showing `loss: 0.021 · iter 142`
- Subtle border between the two panes, thin slate line
- A view toggle bar at the top of the preview pane showing `Surface Lab (3D) · Graph Lab · Compiler` as tab-style buttons

---

### Visual atmosphere

- Subtle dot grid or thin line grid in the background of the hero at ~4% opacity in emerald — like graph paper, reinforcing the mathematical theme
- No heavy gradients — the depth comes from very dark layered surfaces (slate-950 → slate-900 → slate-800) with thin 1px borders
- The λ logo in the nav should be ~32×32px with a 1px slate-700 border
- The header bar should be `backdrop-blur` frosted glass effect over the dark background
- Status indicator in the top right of the nav: a small badge reading `● GEMINI + SYMPY` with the dot animating in a slow pulse

---

### Motion/interaction notes (for Claude Design's animation layer)

- The eyebrow dot should pulse slowly (2s ease-in-out infinite)
- On load, the headline fades and slides up with a 300ms stagger per line
- The 3D surface wireframe should have a subtle rotate or wave animation — like a real Three.js mesh slowly undulating
- The chat messages in the preview should typewriter-in one by one on page load
- Hover on the primary CTA: emerald glow (very subtle, like a 0 0 12px rgba(16,185,129,0.3) box shadow)

---

### Color palette reference

| Token | Hex | Usage |
|---|---|---|
| Background primary | #020617 | Hero bg, app bg |
| Surface 1 | #0f172a | Cards, panes, nav |
| Surface 2 | #1e293b | Borders, dividers |
| Text primary | #f1f5f9 | Headlines |
| Text secondary | #94a3b8 | Body copy |
| Text muted | #475569 | Labels, metadata |
| Accent emerald | #10b981 | CTA, highlights, dots |
| Accent emerald dark | #064e3b | Badge bg, subtle tint |
| Accent emerald bright | #6ee7b7 | AI chat bubble text |

---

### What to avoid

- No rounded corners on the λ logo box — sharp edges only
- No bright white backgrounds anywhere
- No blue accent color (the app uses slate/emerald only)
- No playful or friendly illustration style — this is rigorous, slightly austere, mathematician-meets-engineer
- Do not show a generic "AI chatbot" aesthetic — this is a *tutor that refuses to answer*, which is the key tension to convey

---

## MCP plugins to enhance your workflow

These MCPs pair well with Claude Design for this project:

| MCP | Why it helps |
|---|---|
| **Figma MCP** | Export your Claude Design frames directly into Figma for fine-tuning, component extraction, and dev handoff |
| **GitHub MCP** | Push your generated JSX/HTML hero code directly into the `frontend/src` directory of the FlowLogic repo |
| **Browser MCP (Claude in Chrome)** | Preview your generated hero section live in the browser, screenshot it, and iterate with Claude |
| **Filesystem MCP** | Write the generated hero component file (`HeroSection.jsx`) directly to your local `frontend/src/components/` folder |
| **Vercel / Netlify MCP** | Deploy a preview of the hero section instantly to share with collaborators |

---

*Generated by Claude · subgrad hero design brief · June 2026*
