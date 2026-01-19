/**
 * Data structure for Learn Mode topics and Quiz Mode questions
 * This will be populated from the JSON file you'll provide
 */

export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string]; // Exactly 4 options
  correctAnswer: number; // 0-3 index
  explanation: string;
  topicId: string; // Links to which topic this question belongs to
}

export interface Topic {
  id: string;
  title: string;
  summary: string; // Short lesson summary
  content: string; // Full content (can be markdown or HTML)
  order: number; // Display order
  category?: string; // e.g., "optimization", "regression", "classification"
  prerequisites?: string[]; // IDs of topics that should be completed first
  estimatedTime?: number; // Minutes
}

export interface LearningContent {
  topics: Topic[];
  questions: Question[];
  metadata?: {
    version: string;
    lastUpdated: string;
    totalTopics: number;
    totalQuestions: number;
  };
}

/**
 * Example structure (you'll replace this with your JSON):
 */
export const exampleLearningContent: LearningContent = {
  topics: [
    {
      id: 'gradient-descent-basics',
      title: 'What is Gradient Descent?',
      summary: 'Understanding how algorithms find optimal solutions through iterative improvement',
      content: 'Full lesson content here...',
      order: 1,
      category: 'optimization',
    },
  ],
  questions: [
    {
      id: 'q1',
      question: 'What does the gradient tell us in gradient descent?',
      options: [
        'The current value of the function',
        'The direction of steepest ascent',
        'How many iterations we\'ve completed',
        'The global minimum location',
      ],
      correctAnswer: 1,
      explanation: 'The gradient points in the direction of steepest ascent. That\'s why we move in the opposite direction (downhill) during gradient descent.',
      topicId: 'gradient-descent-basics',
    },
  ],
  metadata: {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    totalTopics: 1,
    totalQuestions: 1,
  },
};
