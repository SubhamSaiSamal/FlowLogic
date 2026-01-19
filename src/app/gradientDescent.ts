export type FunctionId =
  | 'quadratic'
  | 'quartic'
  | 'shifted'
  | 'complex'
  | 'custom';

// Custom function evaluator (set via setCustomFunction)
let customFunctionEvaluator: ((x: number) => number) | null = null;

/**
 * Set a custom function evaluator for when FunctionId is 'custom'
 */
export function setCustomFunction(fn: ((x: number) => number) | null) {
  customFunctionEvaluator = fn;
}

/**
 * Get the current custom function evaluator
 */
export function getCustomFunction(): ((x: number) => number) | null {
  return customFunctionEvaluator;
}

export function evaluateFunction(fn: FunctionId, x: number, customFn?: (x: number) => number): number {
  // If custom function is provided directly, use it
  if (fn === 'custom' && customFn) {
    try {
      const result = customFn(x);
      return isFinite(result) ? result : 0;
    } catch {
      return 0;
    }
  }

  // If custom function was set globally, use it
  if (fn === 'custom' && customFunctionEvaluator) {
    try {
      const result = customFunctionEvaluator(x);
      return isFinite(result) ? result : 0;
    } catch {
      return 0;
    }
  }

  // Built-in functions
  switch (fn) {
    case 'quadratic':
      return x * x * 0.1;
    case 'quartic':
      return x * x * x * x * 0.01;
    case 'shifted':
      return (x - 3) * (x - 3) * 0.1 + 2;
    case 'complex':
      return x * x * x * 0.01 - 6 * x * x * 0.05 + 9 * x * 0.1;
    default:
      return x * x * 0.1;
  }
}

export function numericDerivative(fn: FunctionId, x: number, h = 0.0001, customFn?: (x: number) => number): number {
  const fPlus = evaluateFunction(fn, x + h, customFn);
  const fMinus = evaluateFunction(fn, x - h, customFn);
  return (fPlus - fMinus) / (2 * h);
}

