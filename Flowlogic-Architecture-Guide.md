# subgrad 2.0: Core Architecture & Agent Guardrails

## 1. Project Philosophy
subgrad is a premium, interactive educational platform designed to teach Calculus and Machine Learning. The primary directive is to build intuition, not just push symbols. 

## 2. The Golden Rule of Math (Zero Hallucination Policy)
- **LLMs DO NOT DO MATH.** - The AI agent must never calculate derivatives, integrals, or matrix multiplications on the fly. 
- All mathematical operations, verifications, and step-by-step logic MUST be routed through a deterministic Python math engine (e.g., SymPy, NumPy). 
- The LLM's job is purely to interpret the output of the math engine and converse with the user.

## 3. The Socratic Tutor Directive
- The AI must act as a strict but helpful tutor. 
- **Never** give the user the final answer immediately. 
- If a user struggles with a concept (e.g., the chain rule), ask guiding questions. Break the problem into smaller chunks. Let them connect the dots.

## 4. Architectural Separation (Strict Decoupling)
- **Backend:** FastAPI (Python). Handles all LLM API calls, prompt management, and SymPy/NumPy computations. State and conversation history are managed here.
- **Frontend:** React/Vue. Purely for presentation and handling visual state. 
- The frontend knows nothing about the LLM. It only sends user inputs to the backend and renders the returned structured JSON responses.

## 5. Visual-First Learning
- Calculus and ML are geometric. 
- Prioritize interactive widgets (using Three.js, D3.js, or similar visual libraries) over static blocks of LaTeX. 
- Example: When teaching Gradient Descent, the UI must render an interactive 3D loss surface where the user can manipulate the learning rate and starting position.

## 6. Development Workflow (For Antigravity Agents)
- Scaffold the backend first. Establish the FastAPI routes and the SymPy integration before touching the UI.
- When generating UI components, ensure they are modular and accept raw mathematical data as props from the backend.
- Validate all inputs strictly. Users will type absolute garbage math; the backend parser must handle it gracefully without crashing the whole application.
