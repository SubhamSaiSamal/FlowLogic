import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LearningContent, Topic, Question } from '../types/learningContent';
import { loadLearningContent } from '../data/learningContentLoader';
import { useAuth } from './AuthContext';

interface LearningContextType {
  content: LearningContent;
  currentTopic: Topic | null;
  completedTopics: Set<string>;
  completedQuestions: Set<string>;
  currentScore: number;
  totalAttempts: number;
  streak: number;
  setCurrentTopic: (topic: Topic | null) => void;
  markTopicComplete: (topicId: string) => void;
  markQuestionComplete: (questionId: string, correct: boolean) => void;
  loadContent: (content: LearningContent) => void;
  resetProgress: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: ReactNode }) {
  const { user, userProgress, updateProgress } = useAuth();
  const [content, setContent] = useState<LearningContent>(() => loadLearningContent());
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  
  // Load from Supabase if user is logged in, otherwise use localStorage
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(() => {
    if (userProgress) {
      return new Set(userProgress.completed_topics || []);
    }
    const saved = localStorage.getItem('flowlogic-completed-topics');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(() => {
    if (userProgress) {
      return new Set(userProgress.completed_questions || []);
    }
    const saved = localStorage.getItem('flowlogic-completed-questions');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [currentScore, setCurrentScore] = useState(() => {
    if (userProgress) {
      return userProgress.quiz_score || 0;
    }
    const saved = localStorage.getItem('flowlogic-quiz-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [totalAttempts, setTotalAttempts] = useState(() => {
    if (userProgress) {
      return userProgress.quiz_attempts || 0;
    }
    const saved = localStorage.getItem('flowlogic-quiz-attempts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [streak, setStreak] = useState(() => {
    if (userProgress) {
      return userProgress.quiz_streak || 0;
    }
    const saved = localStorage.getItem('flowlogic-quiz-streak');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sync with Supabase when userProgress changes
  useEffect(() => {
    if (userProgress) {
      setCompletedTopics(new Set(userProgress.completed_topics || []));
      setCompletedQuestions(new Set(userProgress.completed_questions || []));
      setCurrentScore(userProgress.quiz_score || 0);
      setTotalAttempts(userProgress.quiz_attempts || 0);
      setStreak(userProgress.quiz_streak || 0);
    }
  }, [userProgress]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('flowlogic-completed-topics', JSON.stringify(Array.from(completedTopics)));
  }, [completedTopics]);

  useEffect(() => {
    localStorage.setItem('flowlogic-completed-questions', JSON.stringify(Array.from(completedQuestions)));
  }, [completedQuestions]);

  useEffect(() => {
    localStorage.setItem('flowlogic-quiz-score', currentScore.toString());
  }, [currentScore]);

  useEffect(() => {
    localStorage.setItem('flowlogic-quiz-attempts', totalAttempts.toString());
  }, [totalAttempts]);

  useEffect(() => {
    localStorage.setItem('flowlogic-quiz-streak', streak.toString());
  }, [streak]);

  const markTopicComplete = (topicId: string) => {
    const newSet = new Set([...completedTopics, topicId]);
    setCompletedTopics(newSet);
    
    // Sync with Supabase if logged in
    if (user && updateProgress) {
      updateProgress({
        completed_topics: Array.from(newSet),
      });
    }
  };

  const markQuestionComplete = (questionId: string, correct: boolean) => {
    const newQuestions = new Set([...completedQuestions, questionId]);
    setCompletedQuestions(newQuestions);
    const newAttempts = totalAttempts + 1;
    setTotalAttempts(newAttempts);
    
    let newScore = currentScore;
    let newStreak = streak;
    if (correct) {
      newScore = currentScore + 1;
      newStreak = streak + 1;
      setCurrentScore(newScore);
      setStreak(newStreak);
    } else {
      setStreak(0);
      newStreak = 0;
    }
    
    // Sync with Supabase if logged in
    if (user && updateProgress) {
      updateProgress({
        completed_questions: Array.from(newQuestions),
        quiz_score: newScore,
        quiz_attempts: newAttempts,
        quiz_streak: newStreak,
      });
    }
  };

  const loadContent = (newContent: LearningContent) => {
    setContent(newContent);
    // Optionally save to localStorage or fetch from API
  };

  const resetProgress = () => {
    setCompletedTopics(new Set());
    setCompletedQuestions(new Set());
    setCurrentScore(0);
    setTotalAttempts(0);
    setStreak(0);
  };

  return (
    <LearningContext.Provider
      value={{
        content,
        currentTopic,
        completedTopics,
        completedQuestions,
        currentScore,
        totalAttempts,
        streak,
        setCurrentTopic,
        markTopicComplete,
        markQuestionComplete,
        loadContent,
        resetProgress,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}
