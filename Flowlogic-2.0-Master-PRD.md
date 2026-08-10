# subgrad 2.0: Master Product Requirements Document (PRD)

---

## 1. Executive Summary & Product Vision
The current landscape of mathematical and machine learning education is fundamentally broken. Traditional platforms emphasize rote memorization and symbol manipulation without providing the geometric intuition necessary to actually build and debug neural networks. On the other end of the spectrum, naive LLM wrappers simply act as answer engines, hallucinating complex integration steps and depriving users of the productive struggle required for genuine learning. 

subgrad 2.0 is designed to bridge this gap. It is an interactive, AI-driven learning environment meticulously engineered to teach Calculus and Machine Learning through guided discovery. The primary mandate of this platform is to act as an "Intuition Engine." We are engineering this for high-level rigor—the kind of logic you need to survive INAIO and ZCO. subgrad will not just show a user the formula for gradient descent; it will force them to manipulate the geometry of a loss surface, compute the partial derivatives step-by-step through a deterministic verifier, and engage in Socratic dialogue with an AI tutor that strictly refuses to hand over the final answer.

## 2. Target Audience & User Personas
To maintain a razor-sharp product focus over the next 100 hours of development, we must design for highly specific personas rather than a generalized audience.

*   **The Competitive Architect:** A student tackling advanced computational mathematics and competitive programming. They possess strong raw coding skills but require deep theoretical intuition to translate abstract calculus into optimized code for AI models.
*   **The Visual Synthesizer:** A learner who is alienated by dense blocks of LaTeX and textbook notation. They require dynamic, manipulatable visual representations (e.g., vectors, slopes, hyperplanes) to map mathematical syntax to spatial reality.
*   **The Pragmatic Developer:** A software engineer transitioning into machine learning who needs to understand the math behind the APIs (PyTorch, TensorFlow) they are calling. They care about practical application over pure academic theory.

## 3. Core Architectural Tenets (The Rules of Engagement)
subgrad 2.0 operates on a strict decoupling of probabilistic generation and deterministic logic. 

1.  **The Zero-Hallucination Mandate:** The AI (LLM) is strictly prohibited from executing mathematical operations. It cannot integrate, differentiate, or perform matrix multiplication. All mathematical claims must be generated, verified, and validated by a dedicated, deterministic backend engine (e.g., Python's SymPy or NumPy).
2.  **Socratic Strictness:** The AI agent's system prompt must enforce a pedagogical framework. If a user asks, "What is the derivative of $f(x) = x^2 \sin(x)$?", the system will not provide the answer. Instead, it will identify that the product rule is required and prompt the user to state the rule or identify the component functions.
3.  **Visual Primacy:** Text-based explanations are secondary. If a concept can be demonstrated via an interactive 3D widget or a dynamic graph, the UI must prioritize the visualization.

## 4. Feature Specifications & Deep Dive

### A. The Socratic Dialogue Engine
*   **Stateful Conversation Management:** The backend must maintain a strict history of the user's current problem state, identified knowledge gaps, and previous attempts. 
*   **Error Categorization:** When a user submits an incorrect answer, the AI must classify the error (e.g., syntax error, arithmetic mistake, fundamental conceptual misunderstanding) and tailor its response accordingly.
*   **Progressive Hinting:** The UI will feature a structured hint system governed by the AI, escalating from vague conceptual nudges to highly specific mechanical advice, stopping just short of revealing the solution.

### B. The Deterministic Verification Pipeline
*   **Input Parsing:** Users will inevitably input malformed or ambiguous mathematical syntax. The backend must employ a robust parsing layer that sanitizes text inputs and converts them into SymPy expressions.
*   **Step-by-Step Validation:** Users must be able to submit multi-step proofs or derivations. The backend engine will compute the equivalence of each step to the previous one, highlighting exactly where the logic breaks down.
*   **Graceful Failure:** If the parser fails to understand the user's input, the AI must step in to ask for clarification rather than throwing a raw 500 Server Error to the frontend.

### C. Interactive Visualization Modules
*   **Dynamic Loss Surfaces (Gradient Descent):** A 3D interactive plot (utilizing Three.js or similar) displaying a non-convex function. Users can instantiate a "ball" (representing the current weights), adjust the learning rate via a slider, and run iterations to visually observe convergence, divergence, or getting trapped in local minima.
*   **The Derivative Explorer:** A 2D graphing widget where users can physically drag a secant line along a curve, watching the $\Delta x$ approach zero as the line transitions into a tangent, dynamically updating the calculated slope in real-time.
*   **Matrix Transformation Animator:** A grid visualization demonstrating how 2D matrices stretch, squish, and rotate space, which is critical for understanding eigenvectors and PCA.

### D. The Horizon Exporter (Documentation Engine)
*   **Automated Session Logging:** To support the build-in-public ethos, the system will automatically compile the user's solved problems, generated code snippets, and conceptual breakthroughs into a cleanly formatted Markdown file.
*   **One-Click Export:** A feature allowing users to seamlessly export their session data for use in portfolios, hackathon submissions, or time-tracking platforms.

## 5. Technical Stack & Data Flow

| Subsystem | Technology | Responsibility |
| :--- | :--- | :--- |
| **Client UI** | React / Vue.js | Managing visual state, rendering LaTeX (via KaTeX/MathJax), and handling user interactions. |
| **API Gateway** | FastAPI (Python) | High-performance asynchronous routing, managing WebSockets for real-time AI streaming. |
| **Math Engine** | SymPy, NumPy | Deterministic evaluation of all calculus operations, algebraic equivalence checking. |
| **AI Layer** | Gemini API | Processing intent, generating Socratic dialogue, structuring JSON payloads for the UI. |
| **Visual Library**| Three.js, D3.js | Rendering high-fidelity, interactive mathematical simulations. |

**Data Flow Example:**
1. User types an equation into the UI.
2. Frontend sends a JSON payload to the FastAPI backend.
3. FastAPI routes the equation to SymPy for syntax validation and structural analysis.
4. FastAPI sends the user's text and SymPy's structural analysis to the LLM with the Socratic system prompt.
5. The LLM generates a structured response (dialogue + UI state triggers).
6. FastAPI returns the response to the frontend, which renders the text and updates any necessary 3D visualizations.

## 6. Development Roadmap (100-Hour Implementation Plan)

### Phase 1: Foundation & The Math Engine (Hours 1 - 20)
*   **Objective:** Establish a bulletproof backend that can understand and verify calculus without hallucinating.
*   Initialize FastAPI repository and configure environment variables.
*   Implement the SymPy wrapper. Create endpoints for parsing strings to math, checking algebraic equivalence, and calculating derivatives/integrals.
*   Write exhaustive unit tests for the math engine to handle edge cases (e.g., division by zero, undefined limits, malformed syntax).

### Phase 2: The Socratic AI Integration (Hours 21 - 45)
*   **Objective:** Connect the LLM and enforce the teaching methodology.
*   Develop the core system prompts dictating the tutor's personality and restrictions.
*   Implement function calling: allow the LLM to autonomously query the SymPy backend when it needs to verify a user's claim.
*   Establish state management to track the conversation history and the current mathematical context.

### Phase 3: Visual Interface & Interactivity (Hours 46 - 80)
*   **Objective:** Build the Intuition Engine's frontend.
*   Scaffold the React/Vue application and establish WebSocket connections to the backend.
*   Build the primary chat interface, ensuring flawless rendering of mathematical notation.
*   Develop the first flagship widget: The 3D Gradient Descent Visualizer. Ensure it accepts parameters (learning rate, starting coordinates) from the backend.
*   Develop the second widget: The 2D Derivative Explorer.

### Phase 4: Polish, Edge Cases, & Exporting (Hours 81 - 100)
*   **Objective:** Transform the prototype into a production-ready application.
*   Implement the Horizon Exporter functionality to generate Markdown logs of user sessions.
*   Conduct aggressive adversarial testing: attempt to break the math parser and trick the AI into giving away answers.
*   Refine UI/UX, ensuring transitions are smooth and the cognitive load on the user is minimized.
*   Finalize documentation and prepare for deployment.

## 7. Success Metrics & Telemetry
To objectively measure if subgrad 2.0 is successful, we will track the following:
*   **Zero-Hallucination Rate:** 100% of mathematical claims made by the system must be backed by the SymPy engine.
*   **Concept Mastery Time:** The average time it takes a user to successfully complete a guided derivation without asking for the final answer.
*   **Widget Engagement:** The frequency and duration of user interaction with the 3D and 2D visual modules compared to the text-based chat.
