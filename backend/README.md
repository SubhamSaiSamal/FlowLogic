# subgrad 2.0 — Backend

> Deterministic math engine and Socratic AI tutor for Calculus & Machine Learning.

## Architecture Overview

```
backend/
├── app/
│   ├── main.py                  # FastAPI entry point, CORS, router registration
│   ├── core/
│   │   └── config.py            # Pydantic-settings (CORS origins, app name, debug)
│   ├── api/
│   │   └── routes/
│   │       ├── health.py        # GET  /health/
│   │       └── math.py          # POST /api/v1/math/{validate,derivative,equivalence,integral}
│   └── math_engine/
│       └── verifier.py          # SymPy engine — SINGLE SOURCE OF MATHEMATICAL TRUTH
├── tests/
│   └── test_verifier.py         # 35+ unit & integration tests
├── pyproject.toml
├── requirements.txt
└── .env.example
```

## Zero-Hallucination Policy

> **The LLM is strictly prohibited from performing mathematical operations.**

All derivatives, integrals, and equivalence checks route exclusively through
`app/math_engine/verifier.py` — backed by SymPy and NumPy. The AI layer (Phase 2)
may only *interpret* the output of this engine.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy and configure environment variables
copy .env.example .env

# 3. Run the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

## Running Tests

```bash
pytest tests/ -v
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/health/` | Liveness probe |
| `POST` | `/api/v1/math/validate` | Parse & validate expression |
| `POST` | `/api/v1/math/derivative` | Compute n-th derivative (SymPy) |
| `POST` | `/api/v1/math/equivalence` | Check algebraic equivalence |
| `POST` | `/api/v1/math/integral` | Compute definite/indefinite integral |

## Example Request

```bash
curl -X POST http://localhost:8000/api/v1/math/derivative \
  -H "Content-Type: application/json" \
  -d '{"expression": "x**2 + sin(x)", "variable": "x"}'
```

```json
{
  "original_expr": "x**2 + sin(x)",
  "derivative_expr": "2*x + cos(x)",
  "latex_original": "x^{2} + \\sin{\\left(x \\right)}",
  "latex_derivative": "2 x + \\cos{\\left(x \\right)}",
  "variable": "x",
  "order": 1,
  "success": true
}
```

## Development Roadmap

- **Phase 1 (current):** Math engine + FastAPI skeleton ✅
- **Phase 2:** Socratic AI integration (Gemini API, function calling)
- **Phase 3:** Visual frontend (React/Vite + Three.js + D3.js)
- **Phase 4:** Horizon Exporter + polish
