import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VisualizationPanel } from './components/VisualizationPanel';
import { LearningPanel } from './components/LearningPanel';
import { ControlsPanel } from './components/ControlsPanel';

type Status = 'Ready' | 'Running' | 'Paused' | 'Converged';

export default function AppVariant() {
  const [status, setStatus] = useState<Status>('Ready');
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [x, setX] = useState(4);
  const [learningRate, setLearningRate] = useState(0.1);
  const [stepSpeed, setStepSpeed] = useState(1);
  const [autoRun, setAutoRun] = useState(false);
  const [showTangent, setShowTangent] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState('quadratic');
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [previousFx, setPreviousFx] = useState(0);

  // Calculate function value
  const calculateF = (xVal: number): number => {
    switch (selectedFunction) {
      case 'quadratic':
        return xVal * xVal * 0.1;
      case 'quartic':
        return xVal * xVal * xVal * xVal * 0.01;
      case 'shifted':
        return (xVal - 3) * (xVal - 3) * 0.1 + 2;
      case 'complex':
        return xVal * xVal * xVal * 0.01 - 6 * xVal * xVal * 0.05 + 9 * xVal * 0.1;
      default:
        return xVal * xVal * 0.1;
    }
  };

  // Calculate derivative
  const calculateDerivative = (xVal: number): number => {
    const h = 0.0001;
    return (calculateF(xVal + h) - calculateF(xVal - h)) / (2 * h);
  };

  const fx = calculateF(x);
  const dfx = calculateDerivative(x);
  const lossChange = fx - previousFx;

  // Gradient descent step
  const performStep = () => {
    const derivative = calculateDerivative(x);
    const newX = x - learningRate * derivative;
    
    setPreviousFx(fx);
    setX(newX);
    setStep(step + 1);
    
    // Add to trail
    setTrail([...trail, { x, y: fx }].slice(-20)); // Keep last 20 points

    // Check convergence
    if (Math.abs(derivative) < 0.01) {
      setStatus('Converged');
      setIsRunning(false);
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
    setX(4);
    setTrail([]);
    setPreviousFx(0);
  };

  const handleFunctionChange = (value: string) => {
    setSelectedFunction(value);
    handleReset();
  };

  // Auto-step when running
  useEffect(() => {
    if (isRunning && status !== 'Converged') {
      const interval = setInterval(() => {
        performStep();
      }, (1000 / stepSpeed));
      
      return () => clearInterval(interval);
    }
  }, [isRunning, x, learningRate, stepSpeed, status]);

  return (
    <div className="w-full h-screen bg-slate-950 p-6 overflow-hidden">
      <div className="max-w-[1200px] h-full mx-auto flex flex-col">
        <Header status={status} />
        
        <div className="flex-1 grid grid-cols-[1fr_340px] gap-6 min-h-0">
          {/* Left: Visualization */}
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
          />

          {/* Right: Learning Panel - Lighter Variant */}
          <div className="space-y-4 h-full flex flex-col">
            {/* Live Explanation - Lighter */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Live Explanation</h3>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-300 border-blue-500/20">
                  {Math.abs(lossChange) < 0.01 ? 'Near Minimum' : 'Optimal'}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Step {step}</p>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    The gradient descent algorithm is iteratively adjusting the position to find the minimum value of the function.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">Derivative</p>
                    <p className="text-lg font-semibold text-blue-300">{dfx.toFixed(3)}</p>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">Learning Rate</p>
                    <p className="text-lg font-semibold text-purple-300">{learningRate.toFixed(3)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Check - Lighter */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Learning Check</h3>
                <div className="px-2.5 py-1 bg-slate-900 rounded-full text-xs font-medium text-slate-300 border border-slate-700">
                  Q1/3
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-slate-200 leading-relaxed">
                  What does the gradient tell us in gradient descent?
                </p>

                <div className="space-y-2">
                  {[
                    'The direction of steepest ascent',
                    'The direction of steepest descent',
                    'The current position',
                    'The learning rate value',
                  ].map((option, index) => (
                    <button
                      key={index}
                      className="w-full px-4 py-3 rounded-lg text-left text-sm bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-850 hover:border-slate-600 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Controls */}
        <div className="mt-6">
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
