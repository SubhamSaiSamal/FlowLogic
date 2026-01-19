import { Brain, CheckCircle, XCircle, Award, RotateCcw, Flame, Trophy, Target, Filter, Play, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLearning } from '../contexts/LearningContext';
import { Question, Topic } from '../types/learningContent';

export function QuizMode() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const navigate = useNavigate();
  const { content, markQuestionComplete, currentScore, totalAttempts, streak, resetProgress } = useLearning();
  
  const [selectedTopic, setSelectedTopic] = useState<string | 'all'>('all');
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [quizComplete, setQuizComplete] = useState(false);

  // Filter questions by topic
  const availableQuestions = useMemo(() => {
    if (selectedTopic === 'all') {
      return content.questions;
    }
    return content.questions.filter(q => q.topicId === selectedTopic);
  }, [content.questions, selectedTopic]);

  // Shuffle questions for variety
  const shuffledQuestions = useMemo(() => {
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(10, shuffled.length)); // Limit to 10 questions per quiz
  }, [availableQuestions]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  const handleAnswer = (answerIndex: number) => {
    if (answeredQuestions.has(currentQuestion.id) || showExplanation) return;

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Track in learning context
    markQuestionComplete(currentQuestion.id, isCorrect);
  };

  const handleNext = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions(new Set());
    setQuizComplete(false);
  };

  const handleReset = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions(new Set());
    setQuizComplete(false);
  };

  // Get unique topics from questions
  const availableTopics = useMemo(() => {
    const topicMap = new Map<string, Topic>();
    content.topics.forEach(topic => {
      topicMap.set(topic.id, topic);
    });
    const questionTopics = new Set(content.questions.map(q => q.topicId));
    return Array.from(questionTopics)
      .map(id => topicMap.get(id))
      .filter((t): t is Topic => t !== undefined)
      .sort((a, b) => a.order - b.order);
  }, [content]);

  // Show topic selection screen
  if (!quizStarted) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className={`flex items-center gap-2 mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            <Brain className="w-5 h-5" />
            <span className="text-sm font-medium">Quiz Mode</span>
          </div>
          <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Machine Learning Quiz
          </h1>
          <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Test your understanding of ML concepts and algorithms
          </p>
        </div>

        {/* Stats Card */}
        <div className={`p-6 rounded-xl border mb-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Trophy className="w-6 h-6" />
              </div>
              <div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {currentScore}
              </div>
              <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Total Score
              </div>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                <Flame className="w-6 h-6" />
              </div>
              <div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {streak}
              </div>
              <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Current Streak
              </div>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                <Target className="w-6 h-6" />
              </div>
              <div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {totalAttempts}
              </div>
              <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Questions Answered
              </div>
            </div>
          </div>
        </div>

        {/* Topic Selection */}
        <div className={`p-6 rounded-xl border mb-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Filter className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Select Topic
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedTopic === 'all'
                  ? darkMode
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-blue-500 bg-blue-50'
                  : darkMode
                    ? 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                All Topics
              </div>
              <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {content.questions.length} questions
              </div>
            </button>
            {availableTopics.map(topic => {
              const topicQuestionCount = content.questions.filter(q => q.topicId === topic.id).length;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedTopic === topic.id
                      ? darkMode
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-blue-500 bg-blue-50'
                      : darkMode
                        ? 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {topic.title}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {topicQuestionCount} questions
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={handleStartQuiz}
            disabled={availableQuestions.length === 0}
            className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Quiz ({shuffledQuestions.length} questions)
          </button>
        </div>

        {totalAttempts > 0 && (
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button
              onClick={resetProgress}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
            >
              <RotateCcw className="w-4 h-4" />
              Reset Progress
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show completion screen
  if (quizComplete) {
    const percentage = Math.round((score / shuffledQuestions.length) * 100);
    const isExcellent = percentage >= 90;
    const isGood = percentage >= 70;
    const isPassing = percentage >= 50;

    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className={`rounded-2xl border p-12 text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
            isExcellent
              ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
              : isGood
                ? darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                : isPassing
                  ? darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                  : darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
          }`}>
            <Award className="w-12 h-12" />
          </div>
          <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {isExcellent ? 'Excellent!' : isGood ? 'Great Job!' : isPassing ? 'Good Effort!' : 'Keep Learning!'}
          </h2>
          <p className={`text-xl mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            You scored <span className={`font-bold ${isExcellent ? 'text-green-500' : isGood ? 'text-blue-500' : 'text-amber-500'}`}>
              {score}
            </span> out of {shuffledQuestions.length} ({percentage}%)
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => navigate('/learn')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              Review Topics
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show question screen
  if (!currentQuestion) {
    return null;
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className={`flex items-center gap-2 mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          <Brain className="w-5 h-5" />
          <span className="text-sm font-medium">Quiz Mode</span>
        </div>
        <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Machine Learning Quiz
        </h1>
      </div>

      {/* Progress */}
      <div className={`p-4 rounded-xl border mb-8 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
          </span>
          <div className="flex items-center gap-4">
            {streak > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Flame className={`w-4 h-4 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                <span className={darkMode ? 'text-orange-400' : 'text-orange-600'}>{streak} streak</span>
              </div>
            )}
            <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Score: {score}/{currentQuestionIndex + 1}
            </span>
          </div>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className={`rounded-2xl border p-8 mb-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h2 className={`text-2xl font-semibold mb-8 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showExplanation}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selectedAnswer === index
                  ? isCorrect
                    ? darkMode
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-green-500 bg-green-50'
                    : darkMode
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-red-500 bg-red-50'
                  : showExplanation && index === currentQuestion.correctAnswer
                    ? darkMode
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-green-500 bg-green-50'
                    : darkMode
                      ? 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  selectedAnswer === index
                    ? isCorrect
                      ? 'bg-green-500'
                      : 'bg-red-500'
                    : showExplanation && index === currentQuestion.correctAnswer
                      ? 'bg-green-500'
                      : darkMode
                        ? 'bg-slate-700'
                        : 'bg-slate-200'
                }`}>
                  {selectedAnswer === index && (
                    isCorrect ? <CheckCircle className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-white" />
                  )}
                  {showExplanation && index === currentQuestion.correctAnswer && selectedAnswer !== index && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className={`rounded-xl border p-6 mb-6 ${
          isCorrect
            ? darkMode
              ? 'bg-green-500/5 border-green-500/30'
              : 'bg-green-50 border-green-200'
            : darkMode
              ? 'bg-red-500/5 border-red-500/30'
              : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            ) : (
              <XCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
            )}
            <div>
              <div className={`font-semibold mb-1 ${
                isCorrect
                  ? darkMode ? 'text-green-400' : 'text-green-700'
                  : darkMode ? 'text-red-400' : 'text-red-700'
              }`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </div>
              <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                {currentQuestion.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      {showExplanation && (
        <button
          onClick={handleNext}
          className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
        >
          {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
        </button>
      )}
    </div>
  );
}
