"""
subgrad 2.0 — Deterministic Math Engine
==========================================

  ██████████████████████████████████████████████████████████
  ██  ZERO-HALLUCINATION POLICY — ENFORCED AT THIS LAYER  ██
  ██  The LLM MUST NOT perform any mathematical operation. ██
  ██  All calculus, algebra, and verification goes here.   ██
  ██████████████████████████████████████████████████████████

This module is the single source of mathematical truth for subgrad 2.0.
Every derivative, equivalence check, and expression parse MUST route through
these functions. The LLM's sole job is to interpret the *output* of this engine
and converse with the user in a Socratic manner.

Architecture Reference: subgrad-Architecture-Guide.md §2, §4
PRD Reference: subgrad-2.0-Master-PRD.md §3.A (Zero-Hallucination Mandate), §4.B
"""

import re
from typing import Optional

import sympy
from sympy import (
    Symbol,
    symbols,
    diff,
    integrate,
    simplify,
    expand,
    factor,
    latex,
    sympify,
    Rational,
    pi,
    E,
    oo,
)
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor,
)
from sympy.core.sympify import SympifyError


# ── Parser Configuration ──────────────────────────────────────────────────────

# Allow implicit multiplication (e.g. "2x" → "2*x") and "^" as power operator.
_TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)

# Whitelist of safe names exposed to the SymPy parser.
# This prevents arbitrary Python execution while supporting common math notation.
_SAFE_LOCALS: dict = {
    # Trig
    "sin": sympy.sin,
    "cos": sympy.cos,
    "tan": sympy.tan,
    "cot": sympy.cot,
    "sec": sympy.sec,
    "csc": sympy.csc,
    # Inverse trig
    "asin": sympy.asin,
    "acos": sympy.acos,
    "atan": sympy.atan,
    "atan2": sympy.atan2,
    # Hyperbolic
    "sinh": sympy.sinh,
    "cosh": sympy.cosh,
    "tanh": sympy.tanh,
    # Exponential & logarithm
    "exp": sympy.exp,
    "log": sympy.log,
    "ln": sympy.log,   # ln is a common alias
    # Roots & abs
    "sqrt": sympy.sqrt,
    "cbrt": sympy.cbrt,
    "Abs": sympy.Abs,
    "abs": sympy.Abs,
    # Constants
    "pi": pi,
    "E": E,
    "oo": oo,
    "inf": oo,
    # Common variables
    "x": symbols("x"),
    "y": symbols("y"),
    "z": symbols("z"),
    "t": symbols("t"),
    "n": symbols("n"),
    "a": symbols("a"),
    "b": symbols("b"),
    "c": symbols("c"),
}

# Patterns that must never appear in user-supplied math strings.
# Checked BEFORE the expression is handed to SymPy.
_BLOCKED_PATTERNS: list[str] = [
    r"\b__\w+__\b",        # dunder attributes (__import__, __class__, …)
    r"\bexec\b",
    r"\beval\b",
    r"\bimport\b",
    r"\bopen\b",
    r"\bos\b",
    r"\bsys\b",
    r"\bsubprocess\b",
    r"\bcompile\b",
    r"\bgetattr\b",
    r"\bsetattr\b",
    r"\bdelattr\b",
    r"\bglobals\b",
    r"\blocals\b",
    r"\bvars\b",
    r"\bbreakpoint\b",
]


# ── Custom Exceptions ─────────────────────────────────────────────────────────

class MathParseError(ValueError):
    """
    Raised when a mathematical expression string cannot be safely parsed.
    The API layer should catch this and return HTTP 422 with a human-readable
    message so the AI can ask the user to rephrase their input.
    """


class MathEngineError(Exception):
    """
    Raised when a valid expression causes a downstream computation failure.
    The API layer should catch this and return HTTP 500.
    """


# ── Internal Helpers ──────────────────────────────────────────────────────────

def _sanitize_input(expr_str: str) -> str:
    """
    Run a fast pre-parse security check on user input.

    Strips leading/trailing whitespace, enforces a reasonable length cap,
    and rejects any string containing blocked Python builtins or injection
    patterns BEFORE the expression is handed to SymPy.

    Args:
        expr_str: Raw user-supplied expression string.

    Returns:
        The sanitized (stripped) string, ready for parsing.

    Raises:
        MathParseError: If the string is empty, too long, or contains
                        disallowed patterns.
    """
    if not isinstance(expr_str, str):
        raise MathParseError("Expression must be a string.")

    expr_str = expr_str.strip()

    if not expr_str:
        raise MathParseError(
            "Expression cannot be empty. Please provide a mathematical expression "
            "such as 'x**2 + 3*x' or 'sin(x)*cos(x)'."
        )

    if len(expr_str) > 512:
        raise MathParseError(
            f"Expression is too long ({len(expr_str)} chars). "
            "Please keep expressions under 512 characters."
        )

    for pattern in _BLOCKED_PATTERNS:
        if re.search(pattern, expr_str, re.IGNORECASE):
            raise MathParseError(
                f"Expression contains a disallowed keyword. "
                "Only standard mathematical notation is accepted."
            )

    return expr_str


# ── Public API ────────────────────────────────────────────────────────────────

def parse_expression(expr_str: str) -> sympy.Expr:
    """
    Safely parse a mathematical expression string into a SymPy expression object.

    Supports:
      - Standard arithmetic: ``x**2 + 3*x - 7``
      - Implicit multiplication: ``2x``, ``3x^2``
      - Caret exponentiation: ``x^2``
      - Trig / log / exp: ``sin(x)``, ``log(x)``, ``exp(x)``
      - Constants: ``pi``, ``E``, ``oo``
      - Common variables: ``x``, ``y``, ``z``, ``t``

    Args:
        expr_str: A user-supplied mathematical expression as a string.

    Returns:
        A SymPy ``Expr`` object representing the parsed expression.

    Raises:
        MathParseError: If the string is unsafe, empty, or unparseable.

    Example:
        >>> expr = parse_expression("x**2 + 3*x")
        >>> str(expr)
        'x**2 + 3*x'
    """
    sanitized = _sanitize_input(expr_str)

    try:
        expr = parse_expr(
            sanitized,
            local_dict=_SAFE_LOCALS,
            transformations=_TRANSFORMATIONS,
            evaluate=True,
        )
        return expr

    except SympifyError as exc:
        raise MathParseError(
            f"Could not parse '{expr_str}' as a mathematical expression. "
            f"Details: {exc}. "
            "Tip: Use Python-style notation — e.g., 'x**2' not 'x²', "
            "'sin(x)' not 'sinx'."
        ) from exc

    except Exception as exc:  # pragma: no cover
        raise MathParseError(
            f"Unexpected error parsing '{expr_str}': {exc}"
        ) from exc


def compute_derivative(
    expr_str: str,
    respect_to: str = "x",
    order: int = 1,
) -> dict:
    """
    Compute the n-th derivative of a mathematical expression with respect to
    a given variable. All computation is performed deterministically by SymPy.

    This is the primary function invoked by the Socratic tutor's verification
    pipeline. The LLM MUST call this endpoint rather than computing derivatives
    itself — see the Zero-Hallucination Policy.

    Args:
        expr_str: The expression to differentiate, e.g. ``"x**2 + sin(x)"``.
        respect_to: The variable to compute the partial derivative with respect to (default ``"x"``).
        order:     The order of differentiation (default ``1``).

    Returns:
        A dictionary containing:
          - ``original_expr``    — canonical string form of the parsed input
          - ``derivative_expr``  — simplified string form of the derivative
          - ``latex_original``   — LaTeX representation of the input
          - ``latex_derivative`` — LaTeX representation of the derivative
          - ``respect_to``       — the variable differentiated with respect to
          - ``order``            — the differentiation order
          - ``success``          — always ``True`` (exceptions raised on failure)

    Raises:
        MathParseError:  If ``expr_str`` cannot be parsed.
        MathEngineError: If differentiation fails for a valid expression.

    Example:
        >>> result = compute_derivative("x**2 + 3*x")
        >>> result["derivative_expr"]
        '2*x + 3'
        >>> result["latex_derivative"]
        '2 x + 3'
    """
    if order < 1:
        raise MathEngineError("Differentiation order must be a positive integer.")

    expr = parse_expression(expr_str)
    var = Symbol(respect_to)

    try:
        raw_derivative = diff(expr, var, order)
        simplified_derivative = simplify(raw_derivative)
        print(f"\n[SYMPY ENGINE] [*] Partial Derivative Computed: d({expr_str})/d{respect_to} -> {simplified_derivative}\n")

        return {
            "original_expr": str(expr),
            "derivative_expr": str(simplified_derivative),
            "latex_original": latex(expr),
            "latex_derivative": latex(simplified_derivative),
            "variable": respect_to,
            "order": order,
            "success": True,
        }

    except Exception as exc:
        raise MathEngineError(
            f"Failed to differentiate '{expr_str}' w.r.t. '{respect_to}' "
            f"(order={order}): {exc}"
        ) from exc


def check_equivalence(expr1_str: str, expr2_str: str) -> dict:
    """
    Check whether two mathematical expressions are algebraically equivalent.

    Used by the step-by-step proof validator in the Socratic dialogue engine.
    When a user submits an intermediate derivation step, this function determines
    if it is mathematically identical to the expected step, enabling precise
    error categorization (PRD §4.B — Step-by-Step Validation).

    Equivalence is tested by simplifying ``expr1 - expr2`` and checking if the
    result is identically zero.

    Args:
        expr1_str: First expression (e.g., the expected correct step).
        expr2_str: Second expression (e.g., the user's submitted step).

    Returns:
        A dictionary containing:
          - ``equivalent``           — ``True`` if the expressions are equal
          - ``expr1``                — canonical string form of the first expression
          - ``expr2``                — canonical string form of the second expression
          - ``simplified_difference``— SymPy-simplified ``expr1 - expr2``
          - ``latex_difference``     — LaTeX of the difference

    Raises:
        MathParseError:  If either expression string cannot be parsed.
        MathEngineError: If the equivalence computation fails.

    Example:
        >>> check_equivalence("x**2 + x", "x*(x + 1)")["equivalent"]
        True
        >>> check_equivalence("x**2", "x**3")["equivalent"]
        False
    """
    expr1 = parse_expression(expr1_str)
    expr2 = parse_expression(expr2_str)

    try:
        difference = simplify(expr1 - expr2)
        is_equivalent = difference == sympy.S.Zero

        return {
            "equivalent": bool(is_equivalent),
            "expr1": str(expr1),
            "expr2": str(expr2),
            "simplified_difference": str(difference),
            "latex_difference": latex(difference),
        }

    except Exception as exc:
        raise MathEngineError(
            f"Equivalence check failed for '{expr1_str}' and '{expr2_str}': {exc}"
        ) from exc


def compute_integral(
    expr_str: str,
    variable: str = "x",
    lower_bound: Optional[str] = None,
    upper_bound: Optional[str] = None,
) -> dict:
    """
    Compute the indefinite or definite integral of a mathematical expression.

    For a definite integral, supply both ``lower_bound`` and ``upper_bound``.
    For an indefinite integral, omit both (constant of integration is implicit).

    Args:
        expr_str:    The integrand, e.g. ``"2*x + 3"``.
        variable:    The variable of integration (default ``"x"``).
        lower_bound: Lower limit as a string (e.g. ``"0"``), or ``None``.
        upper_bound: Upper limit as a string (e.g. ``"1"``), or ``None``.

    Returns:
        A dictionary containing:
          - ``original_expr``  — the integrand
          - ``integral_expr``  — the result of integration
          - ``latex_original`` — LaTeX of the integrand
          - ``latex_integral`` — LaTeX of the result
          - ``variable``       — the integration variable
          - ``definite``       — whether bounds were supplied
          - ``success``        — always ``True``

    Raises:
        MathParseError:  If the integrand or bounds cannot be parsed.
        MathEngineError: If SymPy cannot evaluate the integral.
    """
    expr = parse_expression(expr_str)
    var = Symbol(variable)

    is_definite = lower_bound is not None and upper_bound is not None

    try:
        if is_definite:
            lb = parse_expression(lower_bound)
            ub = parse_expression(upper_bound)
            result = integrate(expr, (var, lb, ub))
        else:
            result = integrate(expr, var)

        simplified_result = simplify(result)

        return {
            "original_expr": str(expr),
            "integral_expr": str(simplified_result),
            "latex_original": latex(expr),
            "latex_integral": latex(simplified_result),
            "variable": variable,
            "definite": is_definite,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "success": True,
        }

    except Exception as exc:
        raise MathEngineError(
            f"Failed to integrate '{expr_str}' w.r.t. '{variable}': {exc}"
        ) from exc
