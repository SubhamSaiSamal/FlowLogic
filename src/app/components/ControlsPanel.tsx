import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { motion } from 'motion/react';

interface ControlsPanelProps {
  isRunning: boolean;
  onPlayPause: () => void;
  onStep: () => void;
  onReset: () => void;
  learningRate: number;
  onLearningRateChange: (value: number) => void;
  stepSpeed: number;
  onStepSpeedChange: (value: number) => void;
  autoRun: boolean;
  onAutoRunChange: (value: boolean) => void;
  step: number;
  x: number;
  fx: number;
  dfx: number;
}

export function ControlsPanel({
  isRunning,
  onPlayPause,
  onStep,
  onReset,
  learningRate,
  onLearningRateChange,
  stepSpeed,
  onStepSpeedChange,
  autoRun,
  onAutoRunChange,
  step,
  x,
  fx,
  dfx,
}: ControlsPanelProps) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
      <div className="space-y-6">
        {/* Top Row: Primary Controls + Status */}
        <div className="flex items-start justify-between gap-6">
          {/* Left: Primary Controls */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPlayPause}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-lg ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStep}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-4 h-4" />
              <span>Step</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </motion.button>
          </div>

          {/* Right: Status Box */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 rounded-lg px-4 py-3 border border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Status</div>
              <div className="text-sm font-mono text-slate-300 grid grid-cols-2 gap-x-4 gap-y-0.5">
                <div>Step: <span className="text-blue-400">{step}</span></div>
                <div>x: <span className="text-blue-400">{x.toFixed(3)}</span></div>
                <div>f(x): <span className="text-blue-400">{fx.toFixed(3)}</span></div>
                <div>df(x): <span className="text-blue-400">{dfx.toFixed(3)}</span></div>
              </div>
            </div>
            
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <span>Auto-run</span>
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(e) => onAutoRunChange(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
              />
            </label>
          </div>
        </div>

        {/* Bottom Row: Sliders */}
        <div className="grid grid-cols-2 gap-6">
          <SliderControl
            label="Learning Rate"
            value={learningRate}
            onChange={onLearningRateChange}
            min={0.001}
            max={1}
            step={0.001}
            color="blue"
          />
          <SliderControl
            label="Step Speed"
            value={stepSpeed}
            onChange={onStepSpeedChange}
            min={0.1}
            max={2}
            step={0.1}
            color="purple"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-500">
          STEM Expo Build
        </div>
      </div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  color,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  color: string;
}) {
  const colorClasses = {
    blue: 'accent-blue-500',
    purple: 'accent-purple-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
          {value.toFixed(3)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${colorClasses[color as keyof typeof colorClasses]}`}
      />
    </div>
  );
}