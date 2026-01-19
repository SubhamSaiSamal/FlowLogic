import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Beaker, AlertCircle, Play, Pause, RotateCcw, Settings, Code2, X, Sparkles,
  Download, Upload, Copy, TrendingDown, Zap, Target, BarChart3, Save
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { FunctionId, evaluateFunction, numericDerivative } from '../gradientDescent';
import { appendExperiment } from '../experimentHistory';
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
  Cell,
} from 'recharts';

export function SandboxMode() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  // Core state
  const [learningRate, setLearningRate] = useState(0.1);
  const [stepSpeed, setStepSpeed] = useState(1);
  const [selectedFunction, setSelectedFunction] = useState<FunctionId>('quadratic');
  const [startX, setStartX] = useState(4);
  const [x, setX] = useState(4);
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [lossHistory, setLossHistory] = useState<{ iteration: number; loss: number }[]>([]);
  const [maxIterations, setMaxIterations] = useState(1000);
  const [threshold, setThreshold] = useState(0.01);

  // Custom function state
  const [customFunctionExpr, setCustomFunctionExpr] = useState('');
  const [customFunction, setCustomFunction] = useState<((x: number) => number) | null>(null);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  // Visualization options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTrail, setShowTrail] = useState(true);
  const [showTangent, setShowTangent] = useState(true);
  const [showGradientVector, setShowGradientVector] = useState(false);
  const [showLossChart, setShowLossChart] = useState(true);
  const [autoReset, setAutoReset] = useState(false);

  // Stats
  const [bestLoss, setBestLoss] = useState<number | null>(null);
  const [convergenceRate, setConvergenceRate] = useState<number | null>(null);

  const savedCallback = useRef<() => void>();

  // Evaluate function (with custom support)
  const evalFn = (xVal: number): number => {
    if (selectedFunction === 'custom' && customFunction) {
      try {
        const result = customFunction(xVal);
        return isFinite(result) ? result : 0;
      } catch {
        return 0;
      }
    }
    return evaluateFunction(selectedFunction, xVal, customFunction);
  };

  // Calculate derivative (with custom support)
  const calcDerivative = (xVal: number): number => {
    if (selectedFunction === 'custom' && customFunction) {
      return numericDerivative(selectedFunction, xVal, 0.0001, customFunction);
    }
    return numericDerivative(selectedFunction, xVal);
  };

  const fx = evalFn(x);
  const dfx = calcDerivative(x);

  // Generate function data for graph
  const functionData = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    for (let xVal = -8; xVal <= 8; xVal += 0.2) {
      const y = evalFn(xVal);
      points.push({ x: Number(xVal.toFixed(2)), y });
    }
    return points;
  }, [selectedFunction, customFunction]);

  // Gradient descent step
  const calculateStep = () => {
    const derivative = calcDerivative(x);

    if (!isFinite(derivative)) {
      setIsRunning(false);
      return;
    }

    const newX = x - learningRate * derivative;
    const newFx = evalFn(newX);

    if (!isFinite(newX) || !isFinite(newFx)) {
      setIsRunning(false);
      return;
    }

    setX(newX);
    const nextStep = step + 1;
    setStep(nextStep);

    // Update trail
    setTrail((prev) => [...prev, { x: newX, y: newFx }].slice(-100));

    // Update loss history
    setLossHistory((prev) => [...prev, { iteration: nextStep, loss: newFx }].slice(-200));

    // Update stats
    setBestLoss((prev) => prev === null || newFx < prev ? newFx : prev);
    if (nextStep > 1 && lossHistory.length > 0) {
      const prevLoss = lossHistory[lossHistory.length - 1]?.loss || fx;
      const rate = Math.abs((newFx - prevLoss) / prevLoss) * 100;
      setConvergenceRate(rate);
    }

    // Check convergence
    if (Math.abs(derivative) < threshold || nextStep >= maxIterations) {
      appendExperiment({
        id: `sandbox-${Date.now()}`,
        mode: 'sandbox',
        functionId: selectedFunction,
        learningRate,
        iterations: nextStep,
        outcome: Math.abs(derivative) < threshold ? 'converged' : 'stopped',
        timestamp: Date.now(),
      });
      setIsRunning(false);
      if (autoReset) {
        setTimeout(handleReset, 2000);
      }
    }
  };

  useEffect(() => {
    savedCallback.current = calculateStep;
  });

  useEffect(() => {
    if (!isRunning) return;
    const intervalMs = Math.max(10, 1000 / stepSpeed);
    const interval = setInterval(() => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isRunning, stepSpeed]);

  const handleReset = () => {
    setIsRunning(false);
    setStep(0);
    setX(startX);
    const initialFx = evalFn(startX);
    setTrail([{ x: startX, y: initialFx }]);
    setLossHistory([{ iteration: 0, loss: initialFx }]);
    setBestLoss(null);
    setConvergenceRate(null);
  };

  const handleRunToggle = () => {
    setIsRunning((prev) => !prev);
  };

  const handleFunctionChange = (value: string) => {
    setSelectedFunction(value as FunctionId);
    if (value !== 'custom') {
      setCustomFunctionExpr('');
      setCustomFunction(null);
    } else {
      setCustomDialogOpen(true);
    }
    handleReset();
  };

  const handleCustomFunctionChange = (expr: string) => {
    setCustomFunctionExpr(expr);
    const compiled = compileCustomFunction(expr);
    if (compiled.isValid) {
      setCustomFunction(compiled.compiled);
      handleReset();
    } else {
      setCustomFunction(null);
    }
  };

  const exportConfig = () => {
    const config = {
      function: selectedFunction,
      customFunction: customFunctionExpr,
      learningRate,
      startX,
      maxIterations,
      threshold,
      timestamp: Date.now(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sandbox-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const compiledCustom = useMemo(() => {
    if (!customFunctionExpr) return null;
    return compileCustomFunction(customFunctionExpr);
  }, [customFunctionExpr]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className={`flex items-center gap-2 mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <Beaker className="w-5 h-5" />
              <span className="text-sm font-medium">Sandbox Mode</span>
            </div>
            <h1 className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Free Experimentation Lab
            </h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              No guidance. Full control. Break things and learn.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportConfig}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4">
        {/* Main Canvas Area */}
        <div className="lg:col-span-3 flex flex-col overflow-hidden h-full order-2 lg:order-1">
          {/* Real-time Stats Bar */}
          <div className={`px-6 py-3 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="grid grid-cols-5 gap-4">
              <StatCard label="Iteration" value={step} icon={Zap} color="blue" darkMode={darkMode} />
              <StatCard label="Current Loss" value={fx.toFixed(6)} icon={TrendingDown} color="green" darkMode={darkMode} />
              <StatCard label="Best Loss" value={bestLoss?.toFixed(6) || '—'} icon={Target} color="purple" darkMode={darkMode} />
              <StatCard label="Gradient" value={dfx.toFixed(6)} icon={BarChart3} color="amber" darkMode={darkMode} />
              <StatCard label="Convergence" value={convergenceRate ? `${convergenceRate.toFixed(2)}%` : '—'} icon={Sparkles} color="pink" darkMode={darkMode} />
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-6 overflow-auto">
            <div className={`rounded-2xl border overflow-hidden h-full ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`px-4 py-3 border-b flex items-center justify-between ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className={`text-sm font-mono ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    {selectedFunction === 'custom' && customFunctionExpr ? `f(x) = ${customFunctionExpr}` : 'sandbox-experiment.flow'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunToggle}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${isRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  >
                    {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {isRunning ? 'Pause' : 'Run'}
                  </button>
                  <button
                    onClick={handleReset}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>

              <div className={`p-4 h-[calc(100%-60px)] ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <div className="h-full">
                  <ResponsiveContainer width="100%" height={showLossChart ? "60%" : "100%"}>
                    <ComposedChart data={functionData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="x" type="number" domain={[-8, 8]} tickCount={9} stroke="#64748b" fontSize={12} />
                      <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        formatter={(value: number) => value.toFixed(4)}
                      />
                      <Line type="monotone" dataKey="y" stroke="#60a5fa" strokeWidth={3} dot={false} />
                      {showTrail && (
                        <Scatter data={trail} fill="#8b5cf6" shape="circle">
                          {trail.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill="#8b5cf6" fillOpacity={0.1 + (idx / trail.length) * 0.5} />
                          ))}
                        </Scatter>
                      )}
                      {showTangent && (
                        <Line
                          data={[
                            { x: x - 2, y: fx - 2 * dfx },
                            { x: x + 2, y: fx + 2 * dfx }
                          ]}
                          stroke="#4ade80"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      )}
                      <ReferenceDot x={x} y={fx} r={10} fill="#22d3ee" stroke="#fff" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>

                  {showLossChart && (
                    <div className="h-[40%] mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lossHistory} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                          <XAxis dataKey="iteration" stroke="#64748b" fontSize={10} />
                          <YAxis dataKey="loss" stroke="#64748b" fontSize={10} width={50} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            formatter={(value: number) => value.toFixed(6)}
                          />
                          <Line type="monotone" dataKey="loss" stroke="#60a5fa" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="text-xs text-slate-500 px-2 pt-1">Loss vs Iteration</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls Panel */}
        <aside className={`lg:col-span-1 border-l overflow-y-auto h-full order-1 lg:order-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="p-6 space-y-6">
            <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>Controls</h3>

            {/* Function Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Function Type
              </label>
              <select
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                value={selectedFunction}
                onChange={(e) => handleFunctionChange(e.target.value)}
              >
                <option value="quadratic">Quadratic (x²)</option>
                <option value="quartic">Quartic (x⁴)</option>
                <option value="shifted">Shifted Parabola</option>
                <option value="complex">Complex Polynomial</option>
                <option value="custom">Custom Function</option>
              </select>
              {selectedFunction === 'custom' && (
                <button
                  onClick={() => setCustomDialogOpen(true)}
                  className={`mt-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                >
                  <Code2 className="w-4 h-4" />
                  {customFunctionExpr || 'Enter Custom Function'}
                </button>
              )}
            </div>

            {/* Learning Rate */}
            <SliderControl
              label="Learning Rate"
              value={learningRate}
              onChange={setLearningRate}
              min={0.001}
              max={1}
              step={0.001}
              darkMode={darkMode}
            />

            {/* Step Speed */}
            <SliderControl
              label="Step Speed"
              value={stepSpeed}
              onChange={setStepSpeed}
              min={0.1}
              max={5}
              step={0.1}
              darkMode={darkMode}
              suffix="x"
            />

            {/* Starting Position */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Starting Position (x₀)
              </label>
              <input
                type="number"
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                value={startX}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setStartX(val);
                  if (!isRunning) setX(val);
                }}
              />
            </div>

            {/* Visualization Toggles */}
            <div className="space-y-2">
              <h4 className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Visualization</h4>
              <Toggle label="Show Trail" checked={showTrail} onChange={setShowTrail} darkMode={darkMode} />
              <Toggle label="Show Tangent" checked={showTangent} onChange={setShowTangent} darkMode={darkMode} />
              <Toggle label="Show Gradient Vector" checked={showGradientVector} onChange={setShowGradientVector} darkMode={darkMode} />
              <Toggle label="Show Loss Chart" checked={showLossChart} onChange={setShowLossChart} darkMode={darkMode} />
              <Toggle label="Auto-Reset on Convergence" checked={autoReset} onChange={setAutoReset} darkMode={darkMode} />
            </div>

            {/* Advanced Settings */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>

            {showAdvanced && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Max Iterations
                  </label>
                  <input
                    type="number"
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(parseInt(e.target.value || '0', 10))}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Convergence Threshold
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Custom Function Dialog */}
      {customDialogOpen && (
        <CustomFunctionDialog
          expression={customFunctionExpr}
          onExpressionChange={handleCustomFunctionChange}
          onClose={() => setCustomDialogOpen(false)}
          compiled={compiledCustom}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, darkMode }: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  darkMode: boolean;
}) {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    pink: 'text-pink-400',
  };
  return (
    <div className={`flex items-center gap-2 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'} rounded-lg p-2`}>
      <Icon className={`w-4 h-4 ${colorClasses[color as keyof typeof colorClasses]}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{label}</div>
        <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'} truncate`}>{value}</div>
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, min, max, step, darkMode, suffix = '' }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  darkMode: boolean;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{label}</label>
        <span className={`text-sm font-mono ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          {value.toFixed(step < 1 ? 3 : 1)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange, darkMode }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  darkMode: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded"
      />
      <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
    </label>
  );
}

function CustomFunctionDialog({
  expression,
  onExpressionChange,
  onClose,
  compiled,
}: {
  expression: string;
  onExpressionChange: (expr: string) => void;
  onClose: () => void;
  compiled: ReturnType<typeof compileCustomFunction> | null;
}) {
  const [localExpr, setLocalExpr] = useState(expression);
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  // Compile locally to give immediate feedback
  const localCompiled = React.useMemo(() => {
    if (!localExpr) return null;
    return compileCustomFunction(localExpr);
  }, [localExpr]);

  const handleApply = () => {
    onExpressionChange(localExpr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col ${darkMode ? '' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Custom Function</h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Enter a mathematical expression using x</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg hover:bg-slate-800 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Function Expression
            </label>
            <textarea
              value={localExpr}
              onChange={(e) => setLocalExpr(e.target.value)}
              placeholder="e.g., x^2 + 3*x - 2"
              className={`w-full h-24 px-4 py-3 rounded-lg border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
            {localCompiled && !localCompiled.isValid && localCompiled.error && (
              <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {localCompiled.error}
              </p>
            )}
            {localCompiled && localCompiled.isValid && (
              <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Valid function! Ready to visualize.
              </p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Examples
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FUNCTION_EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setLocalExpr(ex.expr)}
                  className={`px-3 py-2 rounded-lg text-left text-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500/50 text-slate-300' : 'bg-slate-50 border-slate-200 hover:border-blue-500 text-slate-700'}`}
                >
                  <div className="font-medium text-blue-400">{ex.label}</div>
                  <div className={`text-xs font-mono mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{ex.expr}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!localCompiled?.isValid}
            className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
