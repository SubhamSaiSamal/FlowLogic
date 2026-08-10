import { create } from 'zustand';

// ============================================================================
//  PSEUDO-COMPILER-LITE ENGINE
//  A frontend-only static analysis store that parses raw PyTorch nn.Sequential
//  code via regex, extracts structural layers, mathematically validates tensor
//  dimension flow, and exposes validation errors for DAG rendering.
//
//  AUTO-HEAL EXTENSION:
//  Provides `applyCodePatch(layerIndex, targetProp, newValue)` which performs
//  a surgical string replacement on the raw code, then re-parses to update
//  the DAG seamlessly from red → green.
// ============================================================================

const DEFAULT_CODE = `model = nn.Sequential(
    nn.Linear(784, 128),
    nn.ReLU(),
    nn.Linear(128, 64),
    nn.Linear(10, 32)  # Intentional mismatch here
)`;

/**
 * Master regex for extracting PyTorch layer definitions.
 * Supports arbitrary whitespace between arguments.
 *
 * Captures:
 *   Group 1: Layer type (e.g. "Linear", "ReLU", "Sigmoid", "Conv2d", etc.)
 *   Group 2: Full argument string inside the parens (may be empty for activations)
 *
 * Examples it handles:
 *   nn.Linear(128, 64)
 *   nn.Linear( 128 ,  64 )
 *   nn.ReLU()
 *   nn.Sigmoid()
 *   nn.Dropout(0.5)
 */
const LAYER_REGEX = /nn\.(?!Sequential)(\w+)\s*\(\s*([^)]*)\s*\)/g;

/**
 * Set of layer types that are pure activation functions or utility layers.
 * These do NOT change tensor dimensions and are skipped during shape validation.
 */
const PASSTHROUGH_LAYERS = new Set([
  'ReLU',
  'Sigmoid',
  'Tanh',
  'LeakyReLU',
  'GELU',
  'SiLU',
  'Softmax',
  'LogSoftmax',
  'Dropout',
  'BatchNorm1d',
  'BatchNorm2d',
  'LayerNorm',
]);

const parseDimension = (argStr) => {
  if (!argStr) return null;
  let mathStr = argStr.replace(/[a-zA-Z_=]/g, '').trim();
  if (!mathStr) return null;
  try {
    const val = new Function(`"use strict"; return (${mathStr})`)();
    return isNaN(val) ? "SYNTAX_ERROR" : val;
  } catch {
    return "SYNTAX_ERROR";
  }
};

/**
 * Parses the raw argument string for a given layer type and extracts
 * structured dimension information.
 *
 * @param {string} layerType - e.g. "Linear", "Conv2d"
 * @param {string} argsStr   - e.g. "128, 64" or "3, 16, kernel_size=3"
 * @returns {{ in: number|null, out: number|null }}
 */
function parseDimensions(layerType, argsStr) {
  // Trim and remove any inline comments
  const cleaned = argsStr.replace(/#.*$/, '').trim();

  if (layerType === 'Linear') {
    // nn.Linear(in_features, out_features, ...)
    const parts = cleaned.split(',').map(s => s.trim());
    const inFeatures = parseDimension(parts[0]);
    const outFeatures = parseDimension(parts[1]);
    return {
      in: inFeatures,
      out: outFeatures,
    };
  }

  if (layerType === 'Conv1d' || layerType === 'Conv2d' || layerType === 'Conv3d') {
    // nn.Conv2d(in_channels, out_channels, kernel_size, ...)
    const parts = cleaned.split(',').map(s => s.trim());
    const inChannels = parseDimension(parts[0]);
    const outChannels = parseDimension(parts[1]);
    return {
      in: inChannels,
      out: outChannels,
    };
  }

  if (layerType === 'Embedding') {
    // nn.Embedding(num_embeddings, embedding_dim)
    const parts = cleaned.split(',').map(s => s.trim());
    const numEmb = parseDimension(parts[0]);
    const embDim = parseDimension(parts[1]);
    return {
      in: numEmb,
      out: embDim,
    };
  }

  // Activation / utility layers — no dimensional info
  return { in: null, out: null };
}

/**
 * Core parse-and-validate pipeline.
 * 1) Extracts all nn.* layer calls from the raw code string.
 * 2) Builds a structured parsedLayers array.
 * 3) Validates tensor dimension continuity between adjacent dimensional layers.
 *
 * @param {string} rawCode
 * @returns {{ parsedLayers: Array, validationErrors: Array }}
 */
function parseAndValidatePipeline(rawCode) {
  const parsedLayers = [];
  const validationErrors = [];

  // Reset regex state (global regexes are stateful)
  LAYER_REGEX.lastIndex = 0;

  let match;
  let layerIndex = 0;

  while ((match = LAYER_REGEX.exec(rawCode)) !== null) {
    const layerType = match[1];
    const argsStr = match[2] || '';
    const dims = parseDimensions(layerType, argsStr);
    const isPassthrough = PASSTHROUGH_LAYERS.has(layerType);

    parsedLayers.push({
      id: `layer_${layerIndex}`,
      type: layerType,
      in: dims.in,
      out: dims.out,
      isPassthrough,
      raw: match[0],
      matchIndex: match.index,       // Character offset of this match in rawCode
      matchLength: match[0].length,   // Full length of the matched string
    });

    layerIndex++;
  }

  // --- Syntax Exception Validation ---
  // If the evaluator caught a math syntax error, expose it directly.
  parsedLayers.forEach((layer, idx) => {
    if (layer.in === "SYNTAX_ERROR" || layer.out === "SYNTAX_ERROR") {
      validationErrors.push({
        type: "SYNTAX",
        sourceIndex: idx,
        targetIndex: idx + 1, // Attach error to the outgoing edge
        message: `Syntax Error: Invalid mathematical expression inside layer_${idx}.`
      });
    }
  });

  // --- Dimension Continuity Validation ---
  // We only compare adjacent *dimensional* layers (skip passthroughs).
  // We also filter out any layers with syntax errors so they don't break the shape match pipeline.
  const dimensionalLayers = parsedLayers
    .map((layer, idx) => ({ ...layer, originalIndex: idx }))
    .filter(layer => !layer.isPassthrough && typeof layer.in === 'number' && typeof layer.out === 'number');

  for (let i = 0; i < dimensionalLayers.length - 1; i++) {
    const current = dimensionalLayers[i];
    const next = dimensionalLayers[i + 1];

    if (current.out !== next.in) {
      validationErrors.push({
        sourceId: current.id,
        targetId: next.id,
        sourceIndex: current.originalIndex,
        targetIndex: next.originalIndex,
        expected: current.out,
        received: next.in,
        message: `Shape Mismatch: Expected ${current.out}, Received ${next.in}`,
      });
    }
  }

  return { parsedLayers, validationErrors };
}

// ============================================================================
//  applyCodePatch — Surgical String Replacement
//
//  Given a layerIndex (matching layer_N), a targetProp ('in' or 'out'),
//  and a newValue (number), this function:
//    1) Re-scans rawCode to find the Nth nn.* match.
//    2) Extracts the argument string inside the parens.
//    3) Replaces the correct positional argument with the new value.
//    4) Splices the new match string back into rawCode at the exact offset.
//    5) Returns the modified rawCode string.
// ============================================================================
function patchRawCode(rawCode, layerIndex, targetProp, newValue) {
  LAYER_REGEX.lastIndex = 0;

  let match;
  let currentIndex = 0;

  while ((match = LAYER_REGEX.exec(rawCode)) !== null) {
    if (currentIndex === layerIndex) {
      const fullMatch = match[0];           // e.g. "nn.Linear(10, 32)"
      const layerType = match[1];           // e.g. "Linear"
      const argsStr = match[2] || '';       // e.g. "10, 32"
      const matchStart = match.index;       // Character offset in rawCode

      // Split the args by comma, preserving whitespace for clean patching
      const args = argsStr.split(',');

      // Determine which positional arg to patch:
      //   'in'  → first argument  (index 0)
      //   'out' → second argument (index 1)
      const argIndex = targetProp === 'in' ? 0 : 1;

      if (argIndex >= args.length) {
        console.warn(`[applyCodePatch] Layer ${layerIndex} does not have argument index ${argIndex}`);
        return rawCode; // No-op if the layer doesn't have enough args
      }

      // Preserve the original whitespace around the number.
      // e.g. "  10 " → we want to produce "  64 " (keeping padding).
      const originalArg = args[argIndex];
      const leadingWhitespace = originalArg.match(/^(\s*)/)[1];
      // Strip inline comments from the trailing part
      const withoutComment = originalArg.replace(/#.*$/, '');
      const trailingWhitespace = withoutComment.match(/(\s*)$/)[1];

      args[argIndex] = `${leadingWhitespace}${newValue}${trailingWhitespace}`;

      // Reconstruct the full layer declaration
      const newArgsStr = args.join(',');
      const newFullMatch = `nn.${layerType}(${newArgsStr})`;

      // Splice into the raw code
      const patchedCode =
        rawCode.substring(0, matchStart) +
        newFullMatch +
        rawCode.substring(matchStart + fullMatch.length);

      return patchedCode;
    }

    currentIndex++;
  }

  console.warn(`[applyCodePatch] Layer index ${layerIndex} not found in rawCode`);
  return rawCode; // No-op if the layer wasn't found
}

// ============================================================================
//  ZUSTAND STORE
// ============================================================================
export const usePseudoCompilerStore = create((set, get) => {
  // Run the initial parse on the default code
  const initial = parseAndValidatePipeline(DEFAULT_CODE);

  return {
    rawCode: DEFAULT_CODE,
    parsedLayers: initial.parsedLayers,
    validationErrors: initial.validationErrors,
    codeVersion: 0,

    setRawCode: (code) => {
      const result = parseAndValidatePipeline(code);
      set((state) => ({
        rawCode: code,
        parsedLayers: result.parsedLayers,
        validationErrors: result.validationErrors,
        codeVersion: state.codeVersion + 1,
      }));
    },

    // ================================================================
    //  AUTO-HEAL: applyCodePatch(layerIndex, targetProp, newValue)
    //
    //  Performs a surgical regex replacement on rawCode, then re-runs
    //  the full parse-and-validate pipeline so the DAG transitions
    //  seamlessly from red error edges to green valid edges.
    // ================================================================
    applyCodePatch: (layerIndex, targetProp, newValue, requestedVersion) => {
      if (requestedVersion !== get().codeVersion) {
        return "STALE_CODE";
      }

      const currentCode = get().rawCode;
      const patchedCode = patchRawCode(currentCode, layerIndex, targetProp, newValue);

      if (patchedCode === currentCode) {
        console.warn('[applyCodePatch] No change was made to the code.');
        return false; // Signal that nothing changed
      }

      const result = parseAndValidatePipeline(patchedCode);
      set((state) => ({
        rawCode: patchedCode,
        parsedLayers: result.parsedLayers,
        validationErrors: result.validationErrors,
        codeVersion: state.codeVersion + 1,
      }));

      return true; // Signal success
    },
  };
});
