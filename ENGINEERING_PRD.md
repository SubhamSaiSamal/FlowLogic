# Subgrad (FlowLogic) - Engineering Product Requirements Document (PRD) & Architecture Deep Dive

**Target Audience:** Software Engineers, ML Researchers, Open Source Contributors, and Technical Leads.
**Document Purpose:** A comprehensive, highly detailed breakdown of the Subgrad platform, its core mechanical features, architectural decisions, systemic trade-offs (advantages and disadvantages), and the driving philosophy behind its creation.

---

## 1. Executive Summary & Vision

### Why We Started This (The Origin Story)
Machine Learning education is fundamentally broken. Traditional pedagogy relies on static textbooks, dense mathematical notation, and disconnected Jupyter notebooks. When a student encounters a concept like "Gradient Descent" or "Ordinary Least Squares (OLS) Regression," they are bombarded with Greek letters ($\nabla, \alpha, \partial, \Sigma$) without an intuitive, physical feel for what these symbols represent. 

The cognitive barrier is twofold:
1. **The Notation Gap:** Students spend more time decoding the mathematical symbols than understanding the core geometric concepts.
2. **The Agency Gap:** Code in a Jupyter notebook feels static. If a student wants to see what happens when the learning rate explodes, they have to change a variable, re-run the cell, and look at a static Matplotlib image. There is no real-time, tactile feedback.

**The Vision:** We set out to build `subgrad` (internally known as FlowLogic)—an Interactive Machine Learning IDE governed by a Two-Way Socratic AI Tutor. We wanted to bridge the gap between abstract mathematics and physical intuition by building real-time, 60-FPS sandboxes where students can physically manipulate data and algorithms, while a contextual AI tutor observes their actions and steps in when they struggle.

### How It Helps Other People
Subgrad is designed to democratize advanced mathematics and machine learning. 
- **For beginners:** It turns abstract equations into tactile toys. You don't need to know what a Jacobian is; you can just drag a point on a scatter plot and watch the regression line violently snap, and the AI will tell you exactly what happened.
- **For advanced practitioners:** It provides a visceral sandbox to debug and visualize pathological network states (like exploding/vanishing gradients) in real-time.
- **For educators:** It offers a scalable, always-on Socratic tutor that doesn't just give answers, but guides students to the answers through directed questioning and UI manipulation.

---

## 2. Core Architectural Philosophy

Subgrad is built as a highly responsive React application with a decentralized state machine architecture (Zustand) and a massive focus on local, client-side rendering. 

### Key Principles
- **60 FPS Minimum:** Educational tools must feel alive. Any lag breaks the illusion of physical interaction. We bypass heavy charting libraries (like Chart.js or D3) in favor of raw, mathematically-driven SVG and WebGL elements.
- **Two-Way AI Agency:** The AI is not just a chatbot. It is a system actor. It can monitor the application state (e.g., watching the Mean Squared Error spike) and it can physically manipulate the UI (e.g., switching tabs, changing sliders, highlighting elements) to guide the student's attention.
- **Socratic Tutoring:** The AI is strictly prompted to never give the direct answer. It uses the `SocraticWatcher` to intercept failure states and guide the user via probing questions.

---

## 3. Feature Breakdown: The Socratic Watcher Engine

### What it is
The `useSocraticWatcher.js` is a React hook that operates as a global interceptor. It subscribes to specific metrics inside our Zustand stores (like `mseLoss` in the Data Sandbox, or `loss` in the Graph Lab) and triggers AI interventions when specific threshold conditions are met.

### Implementation Details
- Uses `useEffect` hooks with tight dependency arrays to monitor `graphValues` and `mseLoss`.
- Employs `useRef` (e.g., `hasFiredGraphRef`) to ensure idempotent triggering (we don't want to spam the chat if the loss stays high across multiple frames).
- Programmatically injects messages into the chat stream mimicking an AI response, complete with UI pulse effects (`setPulseChat`).

### Advantages
- **Immediate Contextual Feedback:** The user doesn't have to ask "Why did my model break?". The system detects the mathematical explosion and immediately prompts them.
- **Seamless Integration:** Because it reads directly from Zustand, it doesn't require complex prop-drilling or Context API bottlenecks.

### Disadvantages
- **Hardcoded Thresholds:** Currently, triggers like `mseLoss > 100` or `loss > 1000` are hardcoded. In highly variable datasets, these thresholds might trigger prematurely or not at all.
- **State Coupling:** The watcher is tightly coupled to specific store variables. As the application grows, managing a massive interceptor file could become a monolithic bottleneck.

---

## 4. Feature Breakdown: Mathematical AST Parsing Engine & Action Choreography

### What it is
The `mathParser.jsx` utility is the bridge between raw LLM text outputs and React UI rendering. It serves two massive purposes:
1. It scans text for mathematical terms (from `notationDictionary.js`) and wraps them in highly interactive, glassmorphic `<NotationTooltip>` components.
2. It detects LLM Action Commands (e.g., `[ACTION: CRANK_LR]`) and executes them outside the React render cycle, while hiding the raw command from the user.

### Implementation Details
- **AST Walking:** Instead of using a raw string Regex which would violently break Markdown Code Blocks (```) or KaTeX math blocks ($$), the parser hooks into `ReactMarkdown`'s component overrides. It recursively walks the React node tree (`processReactNodes`), deliberately skipping `<code>`, `<pre>`, and `.math` classes.
- **Cinematic Asynchronous Choreography:** When an action tag is detected, the parser does not just fire a state update. It pushes the dispatch into a `setTimeout(async () => { ... }, 0)` block.
- By utilizing a custom `sleep` promise, it orchestrates complex, multi-step UI morphs:
  1. Switch Lab View.
  2. Wait 500ms for CSS morph animations to finish.
  3. Alter a slider/parameter.
  4. Wait 400ms for user cognitive registration.
  5. Fire the training loop.

### Advantages
- **Unbreakable Markdown:** Because we traverse the AST, the parser is 100% immune to accidentally replacing "sum" inside the word "assume" within a code block.
- **Cinematic Polish:** The async sequencer transforms jarring, instantaneous state mutations into beautiful, guided software tutorials that feel scripted by a human motion designer.
- **Idempotency via Registry:** Using `executedActions = new Set()` completely eliminates the risk of infinite re-render loops inherent in mutating state during a render phase.

### Disadvantages
- **Complexity Overhead:** AST walking is computationally heavier than a simple string replace. On massive chat histories, this recursive tree walking could introduce main-thread blocking.
- **Memory Leaks:** The `executedActions` Set grows indefinitely for the lifespan of the session. While strings are small, long sessions might see minor memory bloat.

---

## 5. Feature Breakdown: The Cinematic Layout Morpher

### What it is
A custom transition wrapper (`LabTransitionWrapper` in `App.jsx`) that handles the mounting and unmounting of the heavy visualization laboratories (Surface, Graph, Sandbox) using pure CSS.

### Implementation Details
- Uses a local state `displayView` alongside `activeView` to hold the outgoing component in the DOM while a 300ms transition occurs.
- Applies a sleek `opacity-0 scale-[0.97] blur-[2px]` morph effect.

### Advantages
- **Dependency-Free:** Achieves `framer-motion` level `<AnimatePresence>` routing without the 30kb bundle size overhead of external animation libraries.
- **Cognitive Easing:** Prevents the jarring UI whiplash that occurs when instantly swapping heavy WebGL/SVG contexts.

### Disadvantages
- **Manual Cleanup:** Managing `setTimeout` and `requestAnimationFrame` manually for DOM unmounting is inherently riskier than using battle-tested libraries; potential race conditions if the user aggressively spams tab switches.

---

## 6. Feature Breakdown: The Data Poisoning Sandbox

### What it is
A fully interactive, 60-FPS 2D scatter plot designed to teach the fragility of Ordinary Least Squares (OLS) linear regression when exposed to outlier data (data poisoning).

### Implementation Details
- **Raw SVG Math:** Built using standard `<svg>` nodes. No Chart.js, no Recharts. Just absolute mathematical control.
- **Coordinate Matrix Transformations:** Uses native `svg.createSVGPoint()` and `matrixTransform(svg.getScreenCTM().inverse())` to perfectly map browser pixels to internal SVG `viewBox` coordinates (0-100), regardless of screen size or scaling.
- **Real-Time OLS Calculation:** Inside `dataSandboxStore.js`, the exact deterministic equations for regression slope `m` and intercept `b` are calculated on every single `onPointerMove` event.
- **Socratic Integration:** The LLM can issue `[ACTION: HIGHLIGHT_OUTLIER]`, prompting the store to iterate through all points, calculate the maximum absolute error `Math.abs(p.y - predictedY)`, and apply a CSS `animate-pulse` to the offending point.

### Advantages
- **Maximum Performance:** Modifying a Zustand store and piping it directly to an SVG `<circle>` avoids the heavy diffing and layout thrashing of standard charting libraries.
- **Visceral Pedagogy:** When a user drags a single point to the corner of the screen and watches the MSE loss counter turn bright red while the entire regression line violently pivots, they intuitively understand "Data Poisoning" far better than reading a paragraph.

### Disadvantages
- **Mathematical Limitations:** The current implementation uses simple linear regression. It does not support polynomial regression or multi-variable models out of the box.
- **Coordinate Space Inversion:** SVG naturally puts `(0,0)` at the top-left, whereas math puts it at the bottom-left. We had to implement a manual `renderY` inversion function, which can be confusing for future maintainers.

---

## 7. Feature Breakdown: The Gradient Laboratory (3D Surface) & Graph Lab

*(Note: These modules were foundational implementations that preceded the recent UI overhauls, but they share the same philosophy).*

### The Gradient Laboratory
- A 3D WebGL context allowing users to explore non-convex optimization surfaces (like saddle points and local minima). 
- **Advantage:** Beautiful visual intuition for Gradient Descent.
- **Disadvantage:** High GPU overhead; WebGL contexts can crash on lower-end devices if not carefully memory-managed.

### The Graph Laboratory
- A dynamic Node-Edge graph visualizing the backpropagation chain rule. 
- Features Pathology Modes (Exploding Gradients, Vanishing Gradients, Chaotic).
- **Advantage:** Demystifies the "black box" of neural network weight updates by showing exact derivative values flowing backward through the edges.

---

## 8. State Management Strategy (Zustand)

### Why Zustand?
We explicitly chose Zustand over Redux or React Context.
- **Redux** requires massive boilerplate, reducers, and action types, which slows down prototyping.
- **React Context** triggers a re-render for EVERY consuming component when the context value changes. Since our mouse coordinates update 60 times a second, React Context would literally freeze the browser.

Zustand allows for **transient updates**. We can subscribe specific SVG elements to specific slices of the state without triggering a re-render of the parent `<App>` component. Furthermore, the `getState()` method allows our non-React utility files (like `mathParser.jsx`) to dispatch actions and read state imperatively, which is critical for the LLM Action Choreography.

---

## 9. Future Roadmap & Scaling Strategy

1. **WebSockets & Real-Time LLM Streaming:** 
   Currently, the system likely waits for full LLM responses. Integrating Server-Sent Events (SSE) or WebSockets will allow the parser to stream tokens and execute `[ACTION]` tags the millisecond they are generated by the model, further reducing latency.
   
2. **Generalized Action Registry:**
   The `mathParser.jsx` currently hardcodes the logic for `HIGHLIGHT_OUTLIER` and `CRANK_LR`. This needs to be abstracted into a modular `ActionRegistry.js` where plugins can register their own command handlers.

3. **Multi-Variable Sandbox:**
   Expanding the Data Sandbox to handle 3D datasets (using the WebGL engine) to visualize planes of best fit, demonstrating the Curse of Dimensionality.

4. **Automated Curriculum Generation:**
   Allowing the LLM to dynamically generate entirely new SVG layouts and Zustand states based on the student's weaknesses, effectively compiling custom interactive lessons on the fly.

---

## Conclusion
Subgrad is not just an application; it is an architectural experiment in blurring the line between software and teacher. By giving an LLM deep physical agency over the DOM and combining it with highly optimized, mathematically rigorous rendering loops, we have built a platform that doesn't just display information—it orchestrates understanding. 
