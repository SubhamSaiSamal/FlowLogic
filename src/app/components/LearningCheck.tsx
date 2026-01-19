import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const quizQuestions = [
  {
    question: "What does the gradient tell us in gradient descent?",
    options: [
      "The direction of steepest ascent",
      "The direction of steepest descent",
      "The current position",
      "The learning rate value",
    ],
    correct: 1,
  },
  {
    question: "What happens if the learning rate is too large?",
    options: [
      "Convergence is slower but stable",
      "The algorithm stops immediately",
      "The algorithm may overshoot the minimum",
      "Nothing changes",
    ],
    correct: 2,
  },
  {
    question: "When has gradient descent converged?",
    options: [
      "After exactly 100 steps",
      "When the gradient is close to zero",
      "When the learning rate is zero",
      "When we reach x = 0",
    ],
    correct: 1,
  },
];

export function LearningCheck() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const question = quizQuestions[currentQuestion];

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
    if (index === question.correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Learning Check</h3>
        <div className="bg-slate-950 rounded-lg p-6 border border-slate-800 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/30 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h4 className="text-xl font-semibold text-white mb-2">Quiz Complete!</h4>
          <p className="text-3xl font-bold text-blue-400 mb-1">{score}/{quizQuestions.length}</p>
          <p className="text-sm text-slate-400 mb-6">Correct Answers</p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Learning Check</h3>
        <div className="px-2.5 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-300 border border-slate-700">
          Q{currentQuestion + 1}/{quizQuestions.length}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-slate-200 leading-relaxed">{question.question}</p>

        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correct;
            const showResult = answered && isSelected;

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={answered}
                className={`w-full px-4 py-3 rounded-lg text-left text-sm transition-all border ${
                  showResult
                    ? isCorrect
                      ? 'bg-green-500/20 border-green-500/30 text-green-400'
                      : 'bg-red-500/20 border-red-500/30 text-red-400'
                    : isSelected
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-slate-600'
                } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && (
                    isCorrect ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {answered && (
          <button
            onClick={handleNext}
            className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {currentQuestion < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        )}
      </div>
    </div>
  );
}
