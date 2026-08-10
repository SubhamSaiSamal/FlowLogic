"""
subgrad 2.0 — Math Engine Test Suite
========================================

Covers:
  - Safe expression parsing (valid cases + edge cases)
  - Injection attempt rejection (_sanitize_input)
  - Derivative computation (polynomial, trig, product rule, chain rule)
  - Algebraic equivalence checking
  - Integral computation (indefinite + definite)
  - FastAPI endpoint integration tests via TestClient

Run with:
  pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient

from app.math_engine.verifier import (
    parse_expression,
    compute_derivative,
    check_equivalence,
    compute_integral,
    MathParseError,
    MathEngineError,
)
from app.main import app

client = TestClient(app)


# ════════════════════════════════════════════════════════════════════════════
# 1. PARSE EXPRESSION
# ════════════════════════════════════════════════════════════════════════════

class TestParseExpression:

    def test_polynomial(self):
        expr = parse_expression("x**2 + 3*x")
        assert str(expr) == "x**2 + 3*x"

    def test_trig_product(self):
        expr = parse_expression("sin(x)*cos(x)")
        assert expr is not None

    def test_exponential(self):
        expr = parse_expression("exp(-x**2)")
        assert expr is not None

    def test_caret_exponent(self):
        """^ should be treated as ** (convert_xor transformation)."""
        expr = parse_expression("x^2 + 1")
        from sympy import symbols
        x = symbols("x")
        assert expr == x**2 + 1

    def test_implicit_multiplication(self):
        """'2x' should parse as 2*x."""
        expr = parse_expression("2x + 1")
        from sympy import symbols
        x = symbols("x")
        assert expr == 2*x + 1

    def test_constant_pi(self):
        from sympy import pi
        expr = parse_expression("pi")
        assert expr == pi

    def test_empty_string_raises(self):
        with pytest.raises(MathParseError, match="cannot be empty"):
            parse_expression("")

    def test_whitespace_only_raises(self):
        with pytest.raises(MathParseError, match="cannot be empty"):
            parse_expression("   ")

    def test_too_long_raises(self):
        with pytest.raises(MathParseError, match="too long"):
            parse_expression("x" * 513)

    def test_injection_import_raises(self):
        with pytest.raises(MathParseError):
            parse_expression("__import__('os').system('rm -rf /')")

    def test_injection_exec_raises(self):
        with pytest.raises(MathParseError):
            parse_expression("exec('print(1)')")

    def test_injection_eval_raises(self):
        with pytest.raises(MathParseError):
            parse_expression("eval('1+1')")

    def test_injection_os_raises(self):
        with pytest.raises(MathParseError):
            parse_expression("os.getcwd()")

    def test_garbage_input_raises(self):
        with pytest.raises(MathParseError):
            parse_expression("hello world this is not math @@@")


# ════════════════════════════════════════════════════════════════════════════
# 2. COMPUTE DERIVATIVE
# ════════════════════════════════════════════════════════════════════════════

class TestComputeDerivative:

    def test_polynomial(self):
        """d/dx(x^2 + 3x) = 2x + 3"""
        result = compute_derivative("x**2 + 3*x")
        assert result["success"] is True
        assert result["variable"] == "x"
        # SymPy may order terms differently
        from sympy import symbols, parse_expr
        x = symbols("x")
        import sympy
        actual = sympy.sympify(result["derivative_expr"])
        expected = 2*x + 3
        assert sympy.simplify(actual - expected) == 0

    def test_constant(self):
        """d/dx(7) = 0"""
        result = compute_derivative("7")
        assert result["derivative_expr"] == "0"

    def test_trig_sin(self):
        """d/dx(sin(x)) = cos(x)"""
        result = compute_derivative("sin(x)")
        assert "cos(x)" in result["derivative_expr"]

    def test_trig_cos(self):
        """d/dx(cos(x)) = -sin(x)"""
        result = compute_derivative("cos(x)")
        import sympy
        actual = sympy.sympify(result["derivative_expr"])
        from sympy import symbols, sin
        x = symbols("x")
        assert sympy.simplify(actual + sin(x)) == 0

    def test_product_rule(self):
        """d/dx(x * sin(x)) = sin(x) + x*cos(x)"""
        result = compute_derivative("x*sin(x)")
        import sympy
        from sympy import symbols, sin, cos
        x = symbols("x")
        actual = sympy.sympify(result["derivative_expr"])
        expected = sin(x) + x * cos(x)
        assert sympy.simplify(actual - expected) == 0

    def test_chain_rule(self):
        """d/dx(sin(x^2)) = 2x*cos(x^2)"""
        result = compute_derivative("sin(x**2)")
        import sympy
        from sympy import symbols, cos
        x = symbols("x")
        actual = sympy.sympify(result["derivative_expr"])
        expected = 2 * x * cos(x**2)
        assert sympy.simplify(actual - expected) == 0

    def test_exponential(self):
        """d/dx(exp(x)) = exp(x)"""
        result = compute_derivative("exp(x)")
        import sympy
        actual = sympy.sympify(result["derivative_expr"])
        assert sympy.simplify(actual - sympy.exp(sympy.Symbol("x"))) == 0

    def test_second_order(self):
        """d^2/dx^2(x^4) = 12x^2"""
        result = compute_derivative("x**4", order=2)
        import sympy
        from sympy import symbols
        x = symbols("x")
        actual = sympy.sympify(result["derivative_expr"])
        assert sympy.simplify(actual - 12*x**2) == 0

    def test_latex_returned(self):
        result = compute_derivative("x**2")
        assert "latex_derivative" in result
        assert result["latex_derivative"] != ""

    def test_invalid_order_raises(self):
        with pytest.raises(MathEngineError):
            compute_derivative("x**2", order=0)

    def test_parse_error_propagates(self):
        with pytest.raises(MathParseError):
            compute_derivative("")


# ════════════════════════════════════════════════════════════════════════════
# 3. CHECK EQUIVALENCE
# ════════════════════════════════════════════════════════════════════════════

class TestCheckEquivalence:

    def test_factored_equals_expanded(self):
        """x*(x+1) ≡ x^2 + x"""
        result = check_equivalence("x*(x + 1)", "x**2 + x")
        assert result["equivalent"] is True

    def test_trig_identity(self):
        """sin^2(x) + cos^2(x) ≡ 1"""
        result = check_equivalence("sin(x)**2 + cos(x)**2", "1")
        assert result["equivalent"] is True

    def test_clearly_different(self):
        """x^2 ≢ x^3"""
        result = check_equivalence("x**2", "x**3")
        assert result["equivalent"] is False

    def test_off_by_constant(self):
        """x^2 + 1 ≢ x^2 + 2"""
        result = check_equivalence("x**2 + 1", "x**2 + 2")
        assert result["equivalent"] is False

    def test_same_expression(self):
        """x ≡ x"""
        result = check_equivalence("x", "x")
        assert result["equivalent"] is True

    def test_returns_difference(self):
        result = check_equivalence("x**2 + 3", "x**2 + 1")
        assert "simplified_difference" in result
        assert result["simplified_difference"] == "2"


# ════════════════════════════════════════════════════════════════════════════
# 4. COMPUTE INTEGRAL
# ════════════════════════════════════════════════════════════════════════════

class TestComputeIntegral:

    def test_indefinite_polynomial(self):
        """∫(2x + 3) dx = x^2 + 3x"""
        result = compute_integral("2*x + 3")
        import sympy
        from sympy import symbols
        x = symbols("x")
        actual = sympy.sympify(result["integral_expr"])
        expected = x**2 + 3*x
        assert sympy.simplify(actual - expected) == 0

    def test_indefinite_trig(self):
        """∫cos(x) dx = sin(x)"""
        result = compute_integral("cos(x)")
        import sympy
        from sympy import symbols, sin
        x = symbols("x")
        actual = sympy.sympify(result["integral_expr"])
        assert sympy.simplify(actual - sin(x)) == 0

    def test_definite_simple(self):
        """∫₀¹ 2x dx = 1"""
        result = compute_integral("2*x", lower_bound="0", upper_bound="1")
        assert result["definite"] is True
        import sympy
        assert sympy.sympify(result["integral_expr"]) == sympy.S.One

    def test_indefinite_flag(self):
        result = compute_integral("x**2")
        assert result["definite"] is False

    def test_success_flag(self):
        result = compute_integral("x")
        assert result["success"] is True


# ════════════════════════════════════════════════════════════════════════════
# 5. FASTAPI INTEGRATION TESTS
# ════════════════════════════════════════════════════════════════════════════

class TestHealthEndpoint:

    def test_health_returns_200(self):
        response = client.get("/health/")
        assert response.status_code == 200

    def test_health_body(self):
        body = client.get("/health/").json()
        assert body["status"] == "healthy"
        assert "timestamp" in body

    def test_root_returns_200(self):
        response = client.get("/")
        assert response.status_code == 200


class TestMathEndpoints:

    def test_validate_valid_expression(self):
        response = client.post("/api/v1/math/validate", json={"expression": "x**2 + 1"})
        assert response.status_code == 200
        assert response.json()["valid"] is True

    def test_validate_invalid_expression(self):
        response = client.post("/api/v1/math/validate", json={"expression": "@@@@"})
        assert response.status_code == 200
        assert response.json()["valid"] is False

    def test_derivative_endpoint(self):
        response = client.post(
            "/api/v1/math/derivative",
            json={"expression": "x**2 + 3*x"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert "derivative_expr" in body
        assert "latex_derivative" in body

    def test_derivative_endpoint_parse_error(self):
        response = client.post(
            "/api/v1/math/derivative",
            json={"expression": ""},
        )
        # Empty string fails Pydantic min_length=1 validation
        assert response.status_code == 422

    def test_equivalence_endpoint_true(self):
        response = client.post(
            "/api/v1/math/equivalence",
            json={"expression1": "x*(x+1)", "expression2": "x**2 + x"},
        )
        assert response.status_code == 200
        assert response.json()["equivalent"] is True

    def test_equivalence_endpoint_false(self):
        response = client.post(
            "/api/v1/math/equivalence",
            json={"expression1": "x**2", "expression2": "x**3"},
        )
        assert response.status_code == 200
        assert response.json()["equivalent"] is False

    def test_integral_endpoint_indefinite(self):
        response = client.post(
            "/api/v1/math/integral",
            json={"expression": "2*x + 3"},
        )
        assert response.status_code == 200
        assert response.json()["success"] is True
        assert response.json()["definite"] is False

    def test_integral_endpoint_definite(self):
        response = client.post(
            "/api/v1/math/integral",
            json={"expression": "2*x", "lower_bound": "0", "upper_bound": "1"},
        )
        assert response.status_code == 200
        assert response.json()["definite"] is True
