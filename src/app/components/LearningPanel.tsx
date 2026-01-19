import { LiveExplanation } from './LiveExplanation';
import { LearningCheck } from './LearningCheck';

interface LearningPanelProps {
  step: number;
  derivative: number;
  learningRate: number;
  lossChange: number;
  status: string;
}

export function LearningPanel({ step, derivative, learningRate, lossChange, status }: LearningPanelProps) {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <LiveExplanation
        step={step}
        derivative={derivative}
        learningRate={learningRate}
        lossChange={lossChange}
        status={status}
      />
      <LearningCheck />
    </div>
  );
}
