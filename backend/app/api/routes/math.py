"""
subgrad 2.0 — Math Engine API Routes
=======================================

All endpoints in this module are backed exclusively by the deterministic
SymPy math engine (app/math_engine/verifier.py).

The LLM is NOT involved at this layer. These routes form the foundation
of the Zero-Hallucination Pipeline described in subgrad-Architecture-Guide.md §2.

Routes:
  POST /api/v1/math/validate     — Parse and validate an expression
  POST /api/v1/math/derivative   — Compute the n-th derivative
  POST /api/v1/math/equivalence  — Check algebraic equivalence
  POST /api/v1/math/integral     — Compute definite or indefinite integrals
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.math_engine.verifier import (
    parse_expression,
    compute_derivative,
    check_equivalence,
    compute_integral,
    MathParseError,
    MathEngineError,
)

router = APIRouter()


# ── Request / Response Models ─────────────────────────────────────────────────

class ExpressionRequest(BaseModel):
    """Request body for single-expression operations (derivative, validate)."""

    expression: str = Field(
        ...,
        description="Mathematical expression as a Python/SymPy-compatible string.",
        examples=["x**2 + 3*x", "sin(x)*cos(x)", "exp(-x**2)"],
        min_length=1,
        max_length=512,
    )
    variable: str = Field(
        default="x",
        description="The variable to operate on (e.g., 'x', 'y', 't').",
        max_length=4,
    )
    order: int = Field(
        default=1,
        description="Order of differentiation (used only for /derivative).",
        ge=1,
        le=10,
    )


class EquivalenceRequest(BaseModel):
    """Request body for checking algebraic equivalence between two expressions."""

    expression1: str = Field(
        ...,
        description="The reference expression (e.g., the expected correct step).",
        examples=["x*(x + 1)"],
        min_length=1,
        max_length=512,
    )
    expression2: str = Field(
        ...,
        description="The expression to compare (e.g., the user's submitted step).",
        examples=["x**2 + x"],
        min_length=1,
        max_length=512,
    )


class IntegralRequest(BaseModel):
    """Request body for computing definite or indefinite integrals."""

    expression: str = Field(
        ...,
        description="The integrand expression.",
        examples=["2*x + 3", "sin(x)"],
        min_length=1,
        max_length=512,
    )
    variable: str = Field(
        default="x",
        description="The variable of integration.",
        max_length=4,
    )
    lower_bound: Optional[str] = Field(
        default=None,
        description="Lower bound for definite integration. Omit for indefinite.",
        examples=["0", "pi"],
    )
    upper_bound: Optional[str] = Field(
        default=None,
        description="Upper bound for definite integration. Omit for indefinite.",
        examples=["1", "pi/2"],
    )


# ── Route Handlers ────────────────────────────────────────────────────────────

@router.post(
    "/validate",
    summary="Parse and validate a mathematical expression",
    description=(
        "Checks whether the given string is a valid, parseable mathematical expression. "
        "Returns the canonical SymPy string and LaTeX rendering on success. "
        "Safe to call on every keystroke as a live validation signal for the frontend."
    ),
)
async def validate_expression(request: ExpressionRequest) -> dict:
    """
    Validate and canonicalize a user-supplied expression via the SymPy engine.
    No LLM involvement. HTTP 200 = valid; JSON body indicates validity.
    """
    try:
        expr = parse_expression(request.expression)
        from sympy import latex
        return {
            "valid": True,
            "parsed_expression": str(expr),
            "latex": latex(expr),
        }
    except MathParseError as exc:
        # Return structured error in body (not HTTP error) so the frontend can
        # display an inline validation message without crashing.
        return {
            "valid": False,
            "error": str(exc),
        }


@router.post(
    "/derivative",
    summary="Compute the n-th derivative of an expression",
    description=(
        "Deterministically computes the n-th derivative of the given expression "
        "with respect to the specified variable using SymPy. "
        "This endpoint enforces the Zero-Hallucination Policy — "
        "the LLM MUST call this route rather than computing derivatives itself."
    ),
)
async def derivative_endpoint(request: ExpressionRequest) -> dict:
    """
    Route: POST /api/v1/math/derivative
    Computes d^n(expression)/d(variable)^n via SymPy.
    """
    try:
        return compute_derivative(request.expression, request.variable, request.order)
    except MathParseError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "parse_error", "message": str(exc)},
        )
    except MathEngineError as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "engine_error", "message": str(exc)},
        )


@router.post(
    "/equivalence",
    summary="Check algebraic equivalence between two expressions",
    description=(
        "Verifies whether two mathematical expressions are algebraically equivalent "
        "by simplifying their difference. "
        "Used by the Socratic step-by-step proof validator to classify user errors "
        "as arithmetic mistakes vs. conceptual misunderstandings (PRD §4.B)."
    ),
)
async def equivalence_endpoint(request: EquivalenceRequest) -> dict:
    """
    Route: POST /api/v1/math/equivalence
    Returns whether expr1 ≡ expr2 under SymPy simplification.
    """
    try:
        return check_equivalence(request.expression1, request.expression2)
    except MathParseError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "parse_error", "message": str(exc)},
        )
    except MathEngineError as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "engine_error", "message": str(exc)},
        )


@router.post(
    "/integral",
    summary="Compute a definite or indefinite integral",
    description=(
        "Deterministically evaluates the integral of an expression using SymPy. "
        "Supply lower_bound and upper_bound for a definite integral; "
        "omit both for an indefinite integral (constant of integration is implicit)."
    ),
)
async def integral_endpoint(request: IntegralRequest) -> dict:
    """
    Route: POST /api/v1/math/integral
    Computes ∫expression d(variable), optionally over [lower_bound, upper_bound].
    """
    try:
        return compute_integral(
            request.expression,
            request.variable,
            request.lower_bound,
            request.upper_bound,
        )
    except MathParseError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "parse_error", "message": str(exc)},
        )
    except MathEngineError as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "engine_error", "message": str(exc)},
        )
