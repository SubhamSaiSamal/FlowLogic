import { useState, useMemo } from 'react';
import { ChevronDown, Code2, X, Sparkles } from 'lucide-react';
import { compileCustomFunction, FUNCTION_EXAMPLES } from '../customFunctionParser';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  ReferenceLine,
  Cell
} from 'recharts';

interface VisualizationPanelProps {
  currentPoint: { x: number; y: number };
  trail: { x: number; y: number }[];
  lossHistory: { iteration: number; loss: number }[];
  showTangent: boolean;
  showTrail: boolean;
  onShowTangentChange: (value: boolean) => void;
  onShowTrailChange: (value: boolean) => void;
  selectedFunction: string;
  onFunctionChange: (value: string) => void;
  isRunning: boolean;
  customFunctionExpr?: string;
  onCustomFunctionChange?: (expr: string) => void;
  customFunction?: ((x: number) => number) | null;
}

const functions = [
  { value: 'quadratic', label: 'f(x) = x²' },
  { value: 'quartic', label: 'f(x) = x⁴' },
  { value: 'shifted', label: 'f(x) = (x-3)² + 2' },
  { value: 'complex', label: 'f(x) = x³ - 6x² + 9x' },
  { value: 'custom', label: 'Custom Function' },
];

export function VisualizationPanel({
  currentPoint,
  trail,
  lossHistory,
  showTangent,
  showTrail,
  onShowTangentChange,
  onShowTrailChange,
  selectedFunction,
  onFunctionChange,
  isRunning,
  customFunctionExpr = '',
  onCustomFunctionChange,
  customFunction,
}: VisualizationPanelProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  // Generate function data points for the graph
  const data = useMemo(() => {
    const points = [];
    for (let x = -8; x <= 8; x += 0.2) {
      let y = 0;
      if (selectedFunction === 'custom' && customFunction) {
        try {
          y = customFunction(x);
          if (!isFinite(y)) y = 0;
        } catch {
          y = 0;
        }
      } else {
        switch (selectedFunction) {
          case 'quadratic': y = x * x * 0.1; break;
          case 'quartic': y = x * x * x * x * 0.01; break;
          case 'shifted': y = (x - 3) * (x - 3) * 0.1 + 2; break;
          case 'complex': y = x * x * x * 0.01 - 6 * x * x * 0.05 + 9 * x * 0.1; break;
          default: y = x * x * 0.1;
        }
      }
      points.push({ x: Number(x.toFixed(2)), y });
    }
    return points;
  }, [selectedFunction, customFunction]);

  // Determine slope for tangent line
  const tangentData = useMemo(() => {
    if (!showTangent) return [];

    const calculateY = (x: number): number => {
      if (selectedFunction === 'custom' && customFunction) {
        try {
          const result = customFunction(x);
          return isFinite(result) ? result : 0;
        } catch {
          return 0;
        }
      }
      switch (selectedFunction) {
        case 'quadratic': return x * x * 0.1;
        case 'quartic': return x * x * x * x * 0.01;
        case 'shifted': return (x - 3) * (x - 3) * 0.1 + 2;
        case 'complex': return x * x * x * 0.01 - 6 * x * x * 0.05 + 9 * x * 0.1;
        default: return x * x * 0.1;
      }
    };

    const h = 0.001;
    const slope = (calculateY(currentPoint.x + h) - calculateY(currentPoint.x - h)) / (2 * h);

    // Create two points for the tangent line
    return [
      { x: currentPoint.x - 2, y: currentPoint.y - 2 * slope },
      { x: currentPoint.x + 2, y: currentPoint.y + 2 * slope }
    ];
  }, [currentPoint, selectedFunction, showTangent, customFunction]);

  const selectedLabel = selectedFunction === 'custom' && customFunctionExpr
    ? `Custom: ${customFunctionExpr}`
    : functions.find(f => f.value === selectedFunction)?.label || 'Select Function';

  const compiledCustom = useMemo(() => {
    if (!customFunctionExpr) return null;
    return compileCustomFunction(customFunctionExpr);
  }, [customFunctionExpr]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-full flex flex-col w-full">
      {/* Controls Bar */}
      <div className="flex items-center justify-end gap-3 mb-4">
        {/* Function Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-200 transition-colors border border-slate-700"
          >
            <span>{selectedLabel}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 rounded-lg border border-slate-700 shadow-xl z-10 overflow-hidden">
              {functions.map((func) => (
                <button
                  key={func.value}
                  onClick={() => {
                    onFunctionChange(func.value);
                    setDropdownOpen(false);
                    if (func.value === 'custom') {
                      setCustomDialogOpen(true);
                    }
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {func.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom Function Button (shown when custom is selected) */}
        {selectedFunction === 'custom' && (
          <button
            onClick={() => setCustomDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors border border-blue-500"
          >
            <Code2 className="w-4 h-4" />
            {customFunctionExpr || 'Enter Custom Function'}
          </button>
        )}

        {/* Toggles */}
        <ToggleButton
          label="Show Tangent"
          checked={showTangent}
          onChange={onShowTangentChange}
        />
        <ToggleButton
          label="Show Trail"
          checked={showTrail}
          onChange={onShowTrailChange}
        />
      </div>

      {/* Graph Area */}
      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden p-2 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey="x"
              type="number"
              domain={[-8, 8]}
              tickCount={9}
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#60a5fa' }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: number) => value.toFixed(4)}
            />

            {/* The Function Curve */}
            <Line
              type="monotone"
              dataKey="y"
              stroke="#60a5fa"
              strokeWidth={3}
              dot={false}
              activeDot={false}
              animationDuration={500}
            />

            {/* The Trail (History) */}
            {showTrail && (
              <Scatter data={trail} fill="#8b5cf6" shape="circle">
                {trail.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#8b5cf6" fillOpacity={0.1 + (index / trail.length) * 0.5} />
                ))}
              </Scatter>
            )}

            {/* Tangent Line */}
            {showTangent && (
              <Line
                data={tangentData}
                dataKey="y"
                stroke="#4ade80"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            )}

            {/* Current Position (The "Ball") */}
            <ReferenceDot
              x={currentPoint.x}
              y={currentPoint.y}
              r={10}
              fill="#22d3ee"
              stroke="#fff"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="absolute bottom-4 left-4 text-xs text-slate-500 pointer-events-none">
          Optimization Landscape
        </div>
      </div>

      {/* Loss vs Iteration */}
      <div className="mt-4 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden p-2 h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lossHistory} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey="iteration"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="loss"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#60a5fa' }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: number) => value.toFixed(6)}
              labelFormatter={(label) => `Iter ${label}`}
            />
            <Line
              type="monotone"
              dataKey="loss"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-xs text-slate-500 px-2 pt-1">Loss vs Iteration</div>
      </div>

      {/* Custom Function Dialog */}
      {customDialogOpen && (
        <CustomFunctionDialog
          expression={customFunctionExpr}
          onExpressionChange={(expr) => {
            if (onCustomFunctionChange) {
              onCustomFunctionChange(expr);
            }
          }}
          onClose={() => setCustomDialogOpen(false)}
          compiled={compiledCustom}
          onFunctionChange={onFunctionChange}
        />
      )}
    </div>
  );
}

function CustomFunctionDialog({
  expression,
  onExpressionChange,
  onClose,
  compiled,
  onFunctionChange,
}: {
  expression: string;
  onExpressionChange: (expr: string) => void;
  onClose: () => void;
  compiled: ReturnType<typeof compileCustomFunction> | null;
  onFunctionChange?: (value: string) => void;
}) {
  const [localExpr, setLocalExpr] = useState(expression);

  const handleApply = () => {
    if (compiled?.isValid) {
      onExpressionChange(localExpr);
      // Ensure function is set to 'custom' when applying
      if (onFunctionChange) {
        onFunctionChange('custom');
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Custom Function</h3>
              <p className="text-sm text-slate-400">Enter a mathematical expression using x</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Function Expression (use x as variable)
            </label>
            <textarea
              value={localExpr}
              onChange={(e) => setLocalExpr(e.target.value)}
              placeholder="e.g., x^2 + 3*x - 2"
              className="w-full h-24 px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
            {compiled && !compiled.isValid && compiled.error && (
              <p className="mt-2 text-sm text-red-400">{compiled.error}</p>
            )}
            {compiled && compiled.isValid && (
              <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Function is valid and ready to visualize!
              </p>
            )}
          </div>

          {/* Examples */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Examples (click to use)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FUNCTION_EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setLocalExpr(example.expr)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-left text-sm text-slate-300 border border-slate-700 hover:border-blue-500/50 transition-colors"
                >
                  <div className="font-medium text-blue-400">{example.label}</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">{example.expr}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Help */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">Supported Operations</h4>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Arithmetic: +, -, *, /, ^ (power)</li>
              <li>Functions: sin(x), cos(x), tan(x), exp(x), log(x), sqrt(x), abs(x)</li>
              <li>Constants: e, pi (or use Math.E, Math.PI)</li>
              <li>Parentheses for grouping: (x-3)^2</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!compiled?.isValid}
            className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Function
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleButton({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${checked
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
        }`}
    >
      {label}
    </button>
  );
}