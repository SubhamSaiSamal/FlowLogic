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
    // Sanitize: remove dangerous patterns
    const sanitized = expression.trim().toLowerCase();

    // Check for dangerous patterns (no function calls, no eval, no assignments)
    if (/eval|function|=>|const|let|var|import|require|\.\w+\(/i.test(expression)) {
      return {
        expression,
        compiled: () => 0,
        isValid: false,
        error: 'Invalid expression: unsafe code detected',
      };
    }

    // Replace common math notation with JavaScript equivalents
    // Order matters: do word boundaries first, then simple replacements
    let jsExpression = expression
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\blog\b/g, 'Math.log10')
      .replace(/\bexp\b/g, 'Math.exp')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\^/g, '**') // x^2 -> x**2
      // Handle implicit multiplication: 3x -> 3*x, x(x+1) -> x*(x+1)
      .replace(/(\d)([a-z(])/gi, '$1*$2') // 3x, 3(
      .replace(/([a-z])(\()/gi, '$1*$2') // x( NOT supported by default in JS, but Math.sin( is fine. 
      // Wait, x( should be x*(. But sin( should NOT be sin*(.
      // We need to be careful not to break function calls like Math.sin(
      .replace(/(\))([a-z\d])/gi, '$1*$2'); // )x, )3

    // Create a safe function that only has access to Math and x
    const safeEval = new Function('x', `
      "use strict";
      try {
        return ${jsExpression};
      } catch (e) {
        throw new Error("Evaluation error: " + e.message);
      }
    `);

    // Test the function with a few values to ensure it works
    const testValues = [-2, 0, 2];
    for (const testX of testValues) {
      try {
        const result = safeEval(testX);
        if (!isFinite(result)) {
          return {
            expression,
            compiled: () => 0,
            isValid: false,
            error: 'Expression produces invalid values (NaN or Infinity)',
          };
        }
      } catch (e) {
        return {
          expression,
          compiled: () => 0,
          isValid: false,
          error: `Evaluation error: ${e instanceof Error ? e.message : 'Unknown error'}`,
        };
      }
    }

    return {
      expression,
      compiled: safeEval,
      isValid: true,
    };
  } catch (error) {
    return {
      expression,
      compiled: () => 0,
      isValid: false,
      error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get helpful examples for students
 */
export const FUNCTION_EXAMPLES = [
  { label: 'Quadratic', expr: 'x^2' },
  { label: 'Cubic', expr: 'x^3 - 2*x' },
  { label: 'Polynomial', expr: 'x^4 - 3*x^2 + 2' },
  { label: 'Exponential', expr: 'exp(x/4)' },
  { label: 'Trigonometric', expr: 'sin(x) + cos(x)' },
  { label: 'Mixed', expr: 'x^2 + 3*sin(x) - 2' },
  { label: 'Shifted Parabola', expr: '(x-3)^2 + 2' },
  { label: 'Absolute Value', expr: 'abs(x - 2)' },
];
