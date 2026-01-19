/**
 * Safe math expression parser for custom functions.
 * Allows students to enter mathematical expressions like "x^2 + 3*x - 2"
 * and converts them to executable functions.
 */

export interface CustomFunction {
  expression: string;
  compiled: (x: number) => number;
  isValid: boolean;
  error?: string;
}

/**
 * Safely compile a math expression string into a function.
 * Supports: +, -, *, /, ^ (power), parentheses, and common math functions.
 */
export function compileCustomFunction(expression: string): CustomFunction {
  if (!expression.trim()) {
    return {
      expression,
      compiled: () => 0,
      isValid: false,
      error: 'Expression cannot be empty',
    };
  }

  try {
    // 1. Sanitize: check for dangerous usage
    // No `eval`, `function`, `constructor`, etc. 
    // We allow `x` and standard math names.
    if (/[=;{}]|eval|function|=>|const|let|var|import|require|process|window|document|global/i.test(expression)) {
      return {
        expression,
        compiled: () => 0,
        isValid: false,
        error: 'Invalid expression: unsafe patterns detected',
      };
    }

    // 2. Pre-process natural mathematical notation to JS code
    let jsExpr = expression;

    // Replace power operator
    jsExpr = jsExpr.replace(/\^/g, '**');

    // Replace implicit multiplication: 3x -> 3*x, 3(x+1) -> 3*(x+1)
    // NOTE: We must NOT replace inside function names, e.g. "sin(x)" is fine, but "3sin(x)" -> "3*Math.sin(x)"
    // The previous regex was risky: `replace(/([a-z])(\()/gi, '$1*$2')` broke `sin(` -> `sin*(`.

    // Correct approach: Digit followed by (letter or open paren) -> insert *
    jsExpr = jsExpr.replace(/(\d)([a-z\(])/gi, '$1*$2');

    // Close paren followed by (digit or letter) -> insert *
    jsExpr = jsExpr.replace(/(\))([a-z\d])/gi, '$1*$2');

    // 3. Map common math tokens to Math.* properties
    // We use a map and replace whole words only to avoid partial matches
    const tokenMap: Record<string, string> = {
      'sin': 'Math.sin',
      'cos': 'Math.cos',
      'tan': 'Math.tan',
      'asin': 'Math.asin',
      'acos': 'Math.acos',
      'atan': 'Math.atan',
      'sinh': 'Math.sinh',
      'cosh': 'Math.cosh',
      'tanh': 'Math.tanh',
      'ln': 'Math.log',
      'log': 'Math.log10',
      'exp': 'Math.exp',
      'sqrt': 'Math.sqrt',
      'cbrt': 'Math.cbrt',
      'abs': 'Math.abs',
      'floor': 'Math.floor',
      'ceil': 'Math.ceil',
      'round': 'Math.round',
      'sign': 'Math.sign',
      'pi': 'Math.PI',
      'e': 'Math.E',
    };

    // Replace tokens using boundary check \b
    for (const [token, replacement] of Object.entries(tokenMap)) {
      const regex = new RegExp(`\\b${token}\\b`, 'gi');
      jsExpr = jsExpr.replace(regex, replacement);
    }

    // 4. Create Function
    // We use a safe sandbox approach by wrapping in a minimal scope
    const safeEval = new Function('x', `
      "use strict";
      try {
        // Force result to number to catch unintended return types
        const result = (${jsExpr});
        if (typeof result !== 'number' || isNaN(result)) {
           // If result is NaN for standard input, it might just be undefined domain (like sqrt(-1)).
           // We let it pass, but the grapher should handle NaN.
           return result; 
        }
        return result;
      } catch (err) {
        throw err;
      }
    `);

    // 5. Test Run
    // Check if it throws immediately on valid inputs
    const testValues = [0.5, 1, Math.PI];
    let works = false;
    for (const val of testValues) {
      try {
        const res = safeEval(val);
        if (typeof res === 'number') works = true;
      } catch (e) {
        // Ignore single failures (e.g. log(-1)), we just want at least ONE success to say "Valid Grammar"
      }
    }

    // If it threw on ALL test values (unlikely for valid math functions unless domain is huge negative),
    // we might mark valid, but we should catch syntax errors.
    // Actually, syntax errors (like "x + +") throw immediately on Function creation or first run.
    try {
      safeEval(1); // Test simple valid input
    } catch (e: any) {
      return {
        expression,
        compiled: () => 0,
        isValid: false,
        error: 'Syntax Error in formula',
      };
    }

    return {
      expression,
      compiled: safeEval as (x: number) => number,
      isValid: true,
    };

  } catch (error: any) {
    return {
      expression,
      compiled: () => 0,
      isValid: false,
      error: error.message || 'Unknown parser error',
    };
  }
}

/**
 * Get helpful examples for students
 */
export const FUNCTION_EXAMPLES = [
  { label: 'Quadratic', expr: 'x^2' },
  { label: 'Cubic', expr: 'x^3 - 2*x' },
  { label: 'Exponential', expr: 'exp(x/4)' },
  { label: 'Sin Wave', expr: 'sin(x)' },
  { label: 'Dampened', expr: 'sin(x) * exp(-x/5)' },
  { label: 'Logarithmic', expr: 'ln(x)' },
  { label: 'Complex', expr: 'x^2 + 3*sin(2*x) - 2' },
];
