"""
subgrad 2.0 — Gemini AI Client with Function Calling
========================================================

This module bridges the Gemini LLM and the deterministic SymPy math engine.
It is the enforcement point of the Zero-Hallucination Policy:

  ┌──────────┐    function calls     ┌──────────────────┐
  │  Gemini  │ ───────────────────▶  │  SymPy Engine    │
  │  (LLM)   │ ◀───────────────────  │  (verifier.py)   │
  │          │    tool results        │                  │
  └──────────┘                        └──────────────────┘

The LLM is instructed (via system prompt) to call tool functions whenever it needs
to perform any mathematical operation. This module:

  1. Declares the tool functions (mirroring verifier.py's public API)
  2. Dispatches tool calls to the real SymPy engine
  3. Manages the multi-turn conversation loop with automatic tool execution

Ref: subgrad-Architecture-Guide.md §2, §4
     subgrad-2.0-Master-PRD.md §3 (Zero-Hallucination), §4.A (Socratic Dialogue)
     subgrad-2.0-Master-PRD.md §5 (Data Flow steps 3–6)
"""

import json
import logging
from typing import Optional

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.prompts import SOCRATIC_SYSTEM_PROMPT
from app.core.session import Session, MessageRole
from app.math_engine.verifier import (
    compute_derivative,
    check_equivalence,
    compute_integral,
    parse_expression,
    MathParseError,
    MathEngineError,
)
from sympy import latex as sympy_latex

logger = logging.getLogger(__name__)


# ── Tool Function Declarations ────────────────────────────────────────────────
#
# These declarations tell Gemini what tools it can call.
# Each mirrors a public function in app/math_engine/verifier.py exactly.

_TOOL_DECLARATIONS = [
    types.Tool(functionDeclarations=[
        types.FunctionDeclaration(
            name="compute_derivative",
            description=(
                "Compute the n-th derivative of a mathematical expression with respect "
                "to a given variable. MUST be called for ANY differentiation — the tutor "
                "is prohibited from computing derivatives in prose. Supports partial derivatives. "
                "Returns the derivative in both string and LaTeX forms."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "expression": types.Schema(
                        type=types.Type.STRING,
                        description=(
                            "The mathematical expression to differentiate, "
                            "e.g., 'x**2 + sin(x)', 'x*cos(x)', 'exp(-x**2)'."
                        ),
                    ),
                    "respect_to": types.Schema(
                        type=types.Type.STRING,
                        description="The variable to compute the partial derivative with respect to. Default: 'x'.",
                    ),
                    "order": types.Schema(
                        type=types.Type.INTEGER,
                        description="Order of differentiation. Default: 1.",
                    ),
                },
                required=["expression"],
            ),
        ),
        types.FunctionDeclaration(
            name="check_equivalence",
            description=(
                "Check whether two mathematical expressions are algebraically equivalent. "
                "MUST be called whenever a user submits a mathematical step or claim to "
                "verify correctness. The tutor CANNOT judge correctness by inspection — "
                "it must always call this tool. Returns whether the expressions are "
                "equivalent and the simplified difference."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "expression1": types.Schema(
                        type=types.Type.STRING,
                        description="The reference (correct) expression.",
                    ),
                    "expression2": types.Schema(
                        type=types.Type.STRING,
                        description="The expression to verify (the user's submitted answer).",
                    ),
                },
                required=["expression1", "expression2"],
            ),
        ),
        types.FunctionDeclaration(
            name="compute_integral",
            description=(
                "Compute the indefinite or definite integral of a mathematical expression. "
                "MUST be called for ANY integration — the tutor cannot integrate in prose. "
                "For definite integrals, supply lower_bound and upper_bound. "
                "Returns the result in both string and LaTeX forms."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "expression": types.Schema(
                        type=types.Type.STRING,
                        description="The integrand expression, e.g., '2*x + 3', 'sin(x)'.",
                    ),
                    "variable": types.Schema(
                        type=types.Type.STRING,
                        description="The variable of integration. Default: 'x'.",
                    ),
                    "lower_bound": types.Schema(
                        type=types.Type.STRING,
                        description="Lower bound for definite integral. Omit for indefinite.",
                    ),
                    "upper_bound": types.Schema(
                        type=types.Type.STRING,
                        description="Upper bound for definite integral. Omit for indefinite.",
                    ),
                },
                required=["expression"],
            ),
        ),
        types.FunctionDeclaration(
            name="validate_expression",
            description=(
                "Parse and validate a user-supplied mathematical expression string. "
                "Call this to check if a user's input is valid math before processing it. "
                "Returns the canonical SymPy form and LaTeX rendering, or an error message."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "expression": types.Schema(
                        type=types.Type.STRING,
                        description="The expression to validate, e.g., 'x**2 + sin(x)'.",
                    ),
                },
                required=["expression"],
            ),
        ),
        types.FunctionDeclaration(
            name="record_outcome",
            description=(
                "Record the pedagogical outcome of the user's current step or answer. "
                "Call this EXACTLY ONCE per user submission that you have judged as "
                "correct or incorrect using check_equivalence/compute_derivative/"
                "compute_integral — never judge by inspection, and never call this "
                "for clarifying questions where the user hasn't submitted an answer "
                "yet. This drives hint escalation and progress tracking; it does NOT "
                "change how you should respond — keep composing your Socratic reply "
                "exactly as the system prompt instructs."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "is_correct": types.Schema(
                        type=types.Type.BOOLEAN,
                        description="Whether the user's step/answer was correct.",
                    ),
                    "error_category": types.Schema(
                        type=types.Type.STRING,
                        description=(
                            "Required when is_correct is false: one of 'syntax', "
                            "'arithmetic', 'conceptual'. Omit when is_correct is true."
                        ),
                    ),
                },
                required=["is_correct"],
            ),
        ),
    ]),
]

# Tools that mutate pedagogical session state rather than performing math —
# handled directly in the send_message loop (they need `session`) and
# deliberately excluded from `tools_used`, which the frontend treats as
# "a SymPy verification ran this turn" (drives the trust badge + streak/XP).
_SESSION_STATE_TOOLS = {"record_outcome"}


# ── Tool Dispatch ─────────────────────────────────────────────────────────────

def _dispatch_tool_call(function_name: str, arguments: dict) -> dict:
    """
    Execute a tool function call from Gemini by dispatching to the real SymPy engine.

    This is the critical enforcement point — Gemini's function calls are routed
    here, and we execute the deterministic math engine on its behalf.

    Args:
        function_name: Name of the tool function to call.
        arguments: Dictionary of arguments from Gemini's function call.

    Returns:
        A dictionary containing the tool result.
    """
    print(f"\n[SYMPY ENGINE] [*] Tool called: {function_name} | Args: {arguments}\n")

    try:
        if function_name == "compute_derivative":
            return compute_derivative(
                expr_str=arguments["expression"],
                respect_to=arguments.get("respect_to", "x"),
                order=arguments.get("order", 1),
            )

        elif function_name == "check_equivalence":
            return check_equivalence(
                expr1_str=arguments["expression1"],
                expr2_str=arguments["expression2"],
            )

        elif function_name == "compute_integral":
            return compute_integral(
                expr_str=arguments["expression"],
                variable=arguments.get("variable", "x"),
                lower_bound=arguments.get("lower_bound"),
                upper_bound=arguments.get("upper_bound"),
            )

        elif function_name == "validate_expression":
            try:
                expr = parse_expression(arguments["expression"])
                return {
                    "valid": True,
                    "parsed_expression": str(expr),
                    "latex": sympy_latex(expr),
                }
            except MathParseError as e:
                return {"valid": False, "error": str(e)}

        else:
            return {"error": f"Unknown tool function: {function_name}"}

    except MathParseError as e:
        return {"error": f"Parse error: {str(e)}", "error_type": "parse_error"}

    except MathEngineError as e:
        return {"error": f"Engine error: {str(e)}", "error_type": "engine_error"}

    except Exception as e:
        logger.error(f"Tool dispatch failed for {function_name}: {e}", exc_info=True)
        return {"error": f"Unexpected error: {str(e)}", "error_type": "unknown"}


# ── Gemini Client ─────────────────────────────────────────────────────────────

class GeminiSocraticTutor:
    """
    Stateful Gemini client that acts as a Socratic mathematics tutor.

    Manages multi-turn conversations with automatic tool execution:
      1. User sends a message.
      2. Gemini responds (possibly with function calls).
      3. We dispatch function calls to SymPy.
      4. We feed results back to Gemini.
      5. Gemini produces the final Socratic response.

    This loop repeats until Gemini returns a text response with no function calls.
    """

    def __init__(self):
        """Initialize the Gemini client."""
        if not settings.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not configured. "
                "Set it in your .env file or environment variables. "
                "Get one at: https://aistudio.google.com/apikey"
            )
        self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self._model = settings.GEMINI_MODEL

    async def send_message(
        self,
        user_message: str,
        session: Session,
    ) -> tuple[str, list[str], Optional[dict]]:
        """
        Send a user message and get a Socratic tutor response.

        Implements the full data flow from PRD §5:
          1. User message → Gemini with Socratic system prompt
          2. Gemini may request tool calls → dispatch to SymPy
          3. SymPy results fed back → Gemini generates pedagogy
          4. Final text response returned

        The conversation loop handles multiple rounds of tool calls
        (e.g., Gemini might compute a derivative AND check equivalence
        in the same turn).

        Args:
            user_message: The user's raw text input.
            session: The current Session object with conversation history.

        Returns:
            (tutor_response_text, sympy_tools_used, outcome) where outcome is
            {"is_correct": bool, "error_category": str|None} if Gemini called
            record_outcome this turn, else None.
        """
        # Record the user message
        session.add_message(MessageRole.USER, user_message)

        # Build the context-aware system instruction
        system_instruction = self._build_system_instruction(session)

        # Build the conversation contents from session history
        contents = self._build_contents(session)

        # Track which SymPy tools were invoked during this turn, and any
        # pedagogical outcome Gemini recorded (see _SESSION_STATE_TOOLS).
        tools_used = []
        outcome: Optional[dict] = None

        # Configure generation
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=_TOOL_DECLARATIONS,
            temperature=0.3,       # Low temp for pedagogical consistency
            max_output_tokens=1024,
        )

        try:
            # Initial call to Gemini
            response = self._client.models.generate_content(
                model=self._model,
                contents=contents,
                config=config,
            )

            # Tool execution loop — keep going until Gemini returns text only
            max_tool_rounds = 5  # Safety cap to prevent infinite loops
            tool_round = 0

            while response.candidates and tool_round < max_tool_rounds:
                candidate = response.candidates[0]
                parts = candidate.content.parts

                # Check if any parts are function calls
                function_calls = [p for p in parts if p.function_call]

                if not function_calls:
                    # No tool calls — we have the final text response
                    break

                # Execute each function call and collect results
                tool_results = []
                for part in function_calls:
                    fc = part.function_call
                    args = dict(fc.args)
                    logger.info(f"Tool call: {fc.name}({json.dumps(args, default=str)})")

                    if fc.name in _SESSION_STATE_TOOLS:
                        # Mutates pedagogical session state directly — not a math
                        # tool, so it never enters `tools_used`.
                        is_correct = bool(args.get("is_correct"))
                        category = args.get("error_category")
                        if is_correct:
                            session.record_correct()
                        else:
                            session.record_error(category or "conceptual")
                        outcome = {"is_correct": is_correct, "error_category": None if is_correct else (category or "conceptual")}
                        result = {"recorded": True}
                    else:
                        result = _dispatch_tool_call(fc.name, args)
                        tools_used.append(fc.name)

                    logger.info(f"Tool result for {fc.name}: {json.dumps(result, default=str)[:200]}")

                    tool_results.append(
                        types.Part.from_function_response(
                            name=fc.name,
                            response=result,
                        )
                    )

                # Append the model's function call turn + our tool results
                contents.append(candidate.content)
                contents.append(types.Content(
                    role="user",
                    parts=tool_results,
                ))

                # Call Gemini again with the tool results
                response = self._client.models.generate_content(
                    model=self._model,
                    contents=contents,
                    config=config,
                )

                tool_round += 1

            # Extract the final text response
            final_text = self._extract_text(response)

            # Record the tutor's response in session history
            session.add_message(MessageRole.TUTOR, final_text)

            return final_text, tools_used, outcome

        except Exception as e:
            logger.error(f"Gemini API call failed: {e}", exc_info=True)
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                error_msg = "Whoa there, speedster. We hit the free-tier speed limit. Give me about 60 seconds to catch my breath before the next math problem."
            else:
                error_msg = (
                    "I encountered a technical issue connecting to my reasoning engine. "
                    "Please try your question again. If this persists, check that the "
                    "API key is configured correctly."
                )
            session.add_message(MessageRole.SYSTEM, f"ERROR: {error_str}")
            return error_msg, [], None

    def _build_system_instruction(self, session: Session) -> str:
        """
        Build the full system instruction with session-specific context.

        Injects the current mathematical goal and hint level so Gemini
        knows the pedagogical state.
        """
        context_addendum = ""

        if session.current_goal:
            context_addendum += f"\n\n## Current Problem\nThe student is working on: {session.current_goal}\n"

        context_addendum += (
            f"\n## Hint Level\n"
            f"Current hint level: {session.hint_level.value}/4 "
            f"({session.hint_level.name.replace('_', ' ').title()}).\n"
            f"Consecutive errors on current step: {session.consecutive_errors}.\n"
            f"Adjust your hint specificity accordingly — do not exceed this level.\n"
        )

        if session.total_errors > 0 or session.total_correct > 0:
            context_addendum += (
                f"\n## Student Performance\n"
                f"Correct answers: {session.total_correct} | "
                f"Errors: {session.total_errors} "
                f"(syntax: {session.error_categories.get('syntax', 0)}, "
                f"arithmetic: {session.error_categories.get('arithmetic', 0)}, "
                f"conceptual: {session.error_categories.get('conceptual', 0)})\n"
            )

        return SOCRATIC_SYSTEM_PROMPT + context_addendum

    def _build_contents(self, session: Session) -> list:
        """
        Convert session history into Gemini-compatible Content objects.

        Maps our internal MessageRole to Gemini's expected role format,
        combining consecutive messages from the same role.
        """
        contents = []

        for msg in session.history:
            if msg.role == MessageRole.USER:
                contents.append(types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=msg.content)],
                ))
            elif msg.role == MessageRole.TUTOR:
                contents.append(types.Content(
                    role="model",
                    parts=[types.Part.from_text(text=msg.content)],
                ))
            # SYSTEM and TOOL messages are handled internally and not sent to Gemini

        return contents

    def _extract_text(self, response) -> str:
        """Extract the text content from a Gemini response."""
        if not response.candidates:
            return "I'm having trouble formulating a response. Could you rephrase your question?"

        parts = response.candidates[0].content.parts
        text_parts = [p.text for p in parts if hasattr(p, "text") and p.text]

        if not text_parts:
            return "I need a moment to think about this. Could you restate your question?"

        return "\n".join(text_parts)


# ── Singleton ─────────────────────────────────────────────────────────────────

_tutor_instance: Optional[GeminiSocraticTutor] = None


def get_tutor() -> GeminiSocraticTutor:
    """
    Get or create the singleton Gemini tutor instance.

    Lazily initialized on first call so the server can start even
    without a Gemini API key (the math engine still works standalone).
    """
    global _tutor_instance
    if _tutor_instance is None:
        _tutor_instance = GeminiSocraticTutor()
    return _tutor_instance