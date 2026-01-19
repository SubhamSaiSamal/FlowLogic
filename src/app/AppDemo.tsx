import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VisualizationPanel } from './components/VisualizationPanel';
import { LearningPanel } from './components/LearningPanel';
import { ControlsPanel } from './components/ControlsPanel';
import { evaluateFunction, numericDerivative, FunctionId } from './gradientDescent';
import { appendExperiment } from './experimentHistory';
import { compileCustomFunction } from './customFunctionParser';

type Status = 'Ready' | 'Running' | 'Paused' | 'Converged';

interface AppDemoProps {
  darkMode: boolean;
}

export function AppDemo({ darkMode }: AppDemoProps) {
  const [status, setStatus] = useState<Status>('Ready');
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [x, setX] = useState(4);
  const [learningRate, setLearningRate] = useState(0.1);
  const [stepSpeed, setStepSpeed] = useState(1);
  const [autoRun, setAutoRun] = useState(false);
  const [showTangent, setShowTangent] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState<FunctionId>('quadratic');
  const [customFunctionExpr, setCustomFunctionExpr] = useState<string>('');
  const [customFunction, setCustomFunctionState] = useState<((x: number) => number) | null>(null);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [lossHistory, setLossHistory] = useState<{ iteration: number; loss: number }[]>([]);
  const [previousFx, setPreviousFx] = useState(0);

  // Calculate function value (with custom function support)
  const calculateF = (xVal: number): number => {
    if (selectedFunction === 'custom' && customFunction) {
      return evaluateFunction(selectedFunction, xVal, customFunction);
    }
    return evaluateFunction(selectedFunction, xVal);
  };

  // Calculate derivative (with custom function support)
  const calculateDerivative = (xVal: number): number => {
    if (selectedFunction === 'custom' && customFunction) {
      return numericDerivative(selectedFunction, xVal, 0.0001, customFunction);
    }
    return numericDerivative(selectedFunction, xVal);
  };

  const fx = calculateF(x);
  const dfx = calculateDerivative(x);
  const lossChange = fx - previousFx;

  // Gradient descent step with robust convergence checking
  const performStep = () => {
    const derivative = calculateDerivative(x);
    
    // Prevent division by zero or invalid values
    if (!isFinite(derivative)) {
      setStatus('Converged');
      setIsRunning(false);
      return;
    }

    const newX = x - learningRate * derivative;
    const newFx = calculateF(newX);

    // Check for NaN or infinite values
    if (!isFinite(newX) || !isFinite(newFx)) {
      setStatus('Converged');
      setIsRunning(false);
      return;
    }

    setPreviousFx(fx);
    setX(newX);
    const nextStep = step + 1;
    setStep(nextStep);

    // Add to trail (keep last 20 points for performance)
    setTrail((prev) => [...prev, { x, y: fx }].slice(-20));

    // Loss curve (keep last 200 points for smooth visualization)
    setLossHistory((prev) => [...prev, { iteration: nextStep, loss: newFx }].slice(-200));

    // Convergence check: gradient is close to zero (within threshold)
    const CONVERGENCE_THRESHOLD = 0.01;
    if (Math.abs(derivative) < CONVERGENCE_THRESHOLD) {
      setStatus('Converged');
      setIsRunning(false);
      appendExperiment({
        id: `visualize-${Date.now()}`,
        mode: 'visualize',
        functionId: selectedFunction,
        learningRate,
        iterations: nextStep,
        outcome: 'converged',
        timestamp: Date.now(),
      });
    }
  };

  const handlePlayPause = () => {
    if (status === 'Converged') {
      return;
    }
    setIsRunning(!isRunning);
    setStatus(isRunning ? 'Paused' : 'Running');
  };

  const handleReset = () => {
    setIsRunning(false);
    setStatus('Ready');
    setStep(0);
    const initialX = 4;
    const initialFx = calculateF(initialX);
    setX(initialX);
    setTrail([]);
    setPreviousFx(initialFx);
    // Initialize loss history with starting point
    setLossHistory([{ iteration: 0, loss: initialFx }]);
  };

  const handleFunctionChange = (value: string) => {
    setSelectedFunction(value as FunctionId);
    if (value !== 'custom') {
      setCustomFunctionExpr('');
      setCustomFunctionState(null);
    }
    handleReset();
  };

  const handleCustomFunctionChange = (expression: string) => {
    setCustomFunctionExpr(expression);
    const compiled = compileCustomFunction(expression);
    if (compiled.isValid) {
      setCustomFunctionState(compiled.compiled);
      handleReset();
    } else {
      setCustomFunctionState(null);
    }
  };

  // Use ref to keep track of the latest callback without restarting interval
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = performStep;
  });

  // Animation loop: runs gradient descent steps at specified speed
  useEffect(() => {
    if (!isRunning || status === 'Converged') {
      return;
    }

    // Calculate interval based on step speed (1 = 1 step per second, 2 = 2 steps per second, etc.)
    const intervalMs = Math.max(10, 1000 / stepSpeed); // Minimum 10ms to prevent too fast updates
    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    const interval = setInterval(tick, intervalMs);
    return () => clearInterval(interval);
  }, [isRunning, status, stepSpeed]);


  // Manual wrapper for the step to solve the closure staleness if we removed 'x'
  // Actually, the previous implementation re-creating interval every X change is "correct" for React but bad for performance.
  // The real issue might be "stepSpeed" being too low or the derivative being 0 initially? 
  // Let's stick to the previous loop for now but fix the LAYOUT which was the user's main complaint ("bottom right messed up").

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto">
      <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-6">
        <Header status={status} />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Left: Visualization */}
          <div className="min-h-[500px] bg-slate-900/50 rounded-2xl border border-slate-800 p-1 flex flex-col">
            <VisualizationPanel
              currentPoint={{ x, y: fx }}
              trail={trail}
              showTangent={showTangent}
              showTrail={showTrail}
              onShowTangentChange={setShowTangent}
              onShowTrailChange={setShowTrail}
              selectedFunction={selectedFunction}
              onFunctionChange={handleFunctionChange}
              isRunning={isRunning}
              lossHistory={lossHistory}
              customFunctionExpr={customFunctionExpr}
              onCustomFunctionChange={handleCustomFunctionChange}
              customFunction={customFunction}
            />
          </div>

          {/* Right: Learning Panel */}
          <div className="flex flex-col gap-6">
            <LearningPanel
              step={step}
              derivative={dfx}
              learningRate={learningRate}
              lossChange={lossChange}
              status={status}
            />
          </div>
        </div>

        {/* Bottom: Controls */}
        <div className="w-full">
          <ControlsPanel
            isRunning={isRunning}
            onPlayPause={handlePlayPause}
            onStep={performStep}
            onReset={handleReset}
            learningRate={learningRate}
            onLearningRateChange={setLearningRate}
            stepSpeed={stepSpeed}
            onStepSpeedChange={setStepSpeed}
            autoRun={autoRun}
            onAutoRunChange={setAutoRun}
            step={step}
            x={x}
            fx={fx}
            dfx={dfx}
          />
        </div>
      </div>
    </div>
  );
}