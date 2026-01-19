/**
 * Loads and transforms the quiz questions JSON and study material
 * into the LearningContent format
 */

import { LearningContent, Topic, Question } from '../types/learningContent';
import { STUDY_MATERIAL_CONTENT } from './studyMaterial';
// @ts-ignore - JSON import
import quizQuestionsRaw from '../../../quizquestionsraw.json';

/**
 * Parse study material text into topic content map
 */
function parseStudyMaterial(): Record<string, string> {
  // List of all topic names in order (matching JSON keys)
  const topicNames = [
    'Introduction to Machine Learning',
    'Data Understanding',
    'Data Preprocessing',
    'Data Visualization',
    'Feature Engineering',
    'Feature Selection',
    'Regression',
    'Classification',
    'Logistic Regression',
    'Decision Trees',
    'Ensemble Methods',
    'Support Vector Machines',
    'K-Nearest Neighbors',
    'Naive Bayes',
    'Clustering',
    'Dimensionality Reduction',
    'Model Evaluation & Validation',
    'Overfitting vs Underfitting',
    'Regularization',
    'Optimization Algorithms',
    'Neural Networks',
    'Deep Learning',
    'Reinforcement Learning',
    'Natural Language Processing',
    'Time Series Analysis',
  ];

  // Read study material - we'll use a fetch/import or hardcode it
  // For now, we'll create a simple splitter
  const studyMaterialText = getStudyMaterialText();
  const topics: Record<string, string> = {};
  
  // Split text by topic names
  let remainingText = studyMaterialText;
  
  for (let i = 0; i < topicNames.length; i++) {
    const topicName = topicNames[i];
    const nextTopicName = topicNames[i + 1];
    
    // Find the start of this topic
    const startIdx = remainingText.indexOf(topicName);
    if (startIdx === -1) {
      // Try without exact match
      const altName = topicName.replace(/\([^)]*\)/g, '').trim();
      const altStart = remainingText.indexOf(altName);
      if (altStart !== -1) {
        const endIdx = nextTopicName 
          ? remainingText.indexOf(nextTopicName, altStart + altName.length)
          : remainingText.length;
        topics[topicName] = remainingText
          .substring(altStart + altName.length, endIdx)
          .trim();
        remainingText = remainingText.substring(endIdx);
      } else {
        topics[topicName] = `Content for ${topicName} will be loaded here.`;
      }
      continue;
    }
    
    // Find the end (start of next topic or end of text)
    const endIdx = nextTopicName 
      ? remainingText.indexOf(nextTopicName, startIdx + topicName.length)
      : remainingText.length;
    
    // Extract content (skip the topic name line itself)
    const content = remainingText
      .substring(startIdx + topicName.length, endIdx)
      .replace(/^\s*\n+/, '') // Remove leading blank lines
      .trim();
    
    topics[topicName] = content || `Learn about ${topicName}.`;
  }
  
  return topics;
}

/**
 * Get study material text - this will be replaced with actual file read
 * For now, we'll use the provided study material content
 */
function getStudyMaterialText(): string {
  // In production, you'd fetch this from a file
  // For now, return empty - we'll fetch it dynamically or embed it
  return '';
}

/**
 * Convert quiz JSON format to our Question format
 */
function convertQuestions(rawData: any): Question[] {
  const questions: Question[] = [];
  let questionId = 1;
  
  for (const [topicName, topicData] of Object.entries(rawData)) {
    if (topicData && typeof topicData === 'object' && 'questions' in topicData) {
      const topicQuestions = (topicData as any).questions;
      if (Array.isArray(topicQuestions)) {
        for (const q of topicQuestions) {
          // Find correct answer index
          let correctAnswerIndex = 0;
          if (q.options && Array.isArray(q.options) && q.answer) {
            const answerText = q.answer;
            correctAnswerIndex = q.options.findIndex((opt: string) => opt === answerText);
            if (correctAnswerIndex === -1) correctAnswerIndex = 0;
          }
          
          // Ensure we have exactly 4 options
          const options = q.options && q.options.length === 4 
            ? q.options as [string, string, string, string]
            : [
                'Option 1',
                'Option 2',
                'Option 3',
                'Option 4',
              ] as [string, string, string, string];
          
          questions.push({
            id: `q${questionId++}`,
            question: q.question || 'Question text missing',
            options,
            correctAnswer: correctAnswerIndex,
            explanation: q.explanation || `The correct answer is: ${q.answer || options[correctAnswerIndex]}`,
            topicId: topicName.toLowerCase().replace(/\s+/g, '-'),
          });
        }
      }
    }
  }
  
  return questions;
}

/**
 * Create topics from quiz data structure (will be populated with study material later)
 */
function createTopics(studyMaterialMap: Record<string, string>): Topic[] {
  const topicNames = Object.keys(quizQuestionsRaw);
  const topics: Topic[] = [];
  
  topicNames.forEach((name, index) => {
    const content = studyMaterialMap[name] || `Learn about ${name}. This topic covers key concepts and fundamentals.`;
    
    // Extract a summary (first sentence or first 150 chars)
    const summary = content.split('.')[0] || `Learn about ${name}`;
    
    topics.push({
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[&]/g, 'and'),
      title: name,
      summary: summary.length > 150 ? summary.substring(0, 147) + '...' : summary,
      content: content,
      order: index + 1,
      category: getCategory(name),
      estimatedTime: 5, // 5 minutes per topic
    });
  });
  
  return topics;
}

/**
 * Guess category from topic name
 */
function getCategory(topicName: string): string {
  const lower = topicName.toLowerCase();
  if (lower.includes('data') || lower.includes('feature') || lower.includes('visualization')) return 'data';
  if (lower.includes('regression') || lower.includes('classification') || 
      lower.includes('logistic') || lower.includes('tree') ||
      lower.includes('neighbor') || lower.includes('bayes') ||
      lower.includes('svm') || lower.includes('ensemble')) return 'algorithms';
  if (lower.includes('evaluation') || lower.includes('validation') || 
      lower.includes('overfitting') || lower.includes('regularization')) return 'evaluation';
  if (lower.includes('neural') || lower.includes('deep') || 
      lower.includes('reinforcement') || lower.includes('nlp') || 
      lower.includes('time series') || lower.includes('optimization')) return 'advanced';
  return 'fundamentals';
}

/**
 * Load study material from file - will be fetched or imported
 * For now, we return empty and will populate via fetch or hardcoded content
 */
async function fetchStudyMaterial(): Promise<string> {
  try {
    // Try to fetch the study material file
    const response = await fetch('/studymaterial');
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {
    // Fallback: return empty or use embedded content
  }
  return '';
}

/**
 * Load and transform all learning content
 * This is the main export function
 */
export function loadLearningContent(): LearningContent {
  // Use embedded study material content
  const topics = createTopics(STUDY_MATERIAL_CONTENT);
  const questions = convertQuestions(quizQuestionsRaw);
  
  return {
    topics,
    questions,
    metadata: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalTopics: topics.length,
      totalQuestions: questions.length,
    },
  };
}

/**
 * Parse study material text into topic content
 */
export function parseStudyMaterialText(text: string): Record<string, string> {
  const topicNames = Object.keys(quizQuestionsRaw);
  const topics: Record<string, string> = {};
  
  let remainingText = text.replace(/^Study Materials\s*\n?/i, '').trim();
  
  for (let i = 0; i < topicNames.length; i++) {
    const topicName = topicNames[i];
    const nextTopicName = topicNames[i + 1];
    
    // Find topic start - try exact match first
    let startIdx = remainingText.indexOf(topicName);
    
    // If not found, try without parentheses
    if (startIdx === -1) {
      const cleanName = topicName.replace(/\([^)]*\)/g, '').trim();
      startIdx = remainingText.indexOf(cleanName);
    }
    
    if (startIdx === -1) {
      // Still not found, create placeholder
      topics[topicName] = `Content for ${topicName}. Learn the key concepts and fundamentals.`;
      continue;
    }
    
    // Find end of this topic's content
    let endIdx = remainingText.length;
    if (nextTopicName) {
      // Look for next topic name
      let nextStart = remainingText.indexOf(nextTopicName, startIdx + topicName.length);
      if (nextStart === -1) {
        // Try without parentheses
        const cleanNext = nextTopicName.replace(/\([^)]*\)/g, '').trim();
        nextStart = remainingText.indexOf(cleanNext, startIdx + topicName.length);
      }
      if (nextStart !== -1) {
        endIdx = nextStart;
      }
    }
    
    // Extract content
    const contentStart = startIdx + topicName.length;
    const content = remainingText
      .substring(contentStart, endIdx)
      .replace(/^\s*\n+/g, '')
      .trim();
    
    topics[topicName] = content || `Content for ${topicName}.`;
    
    // Move remaining text forward
    remainingText = remainingText.substring(endIdx);
  }
  
  return topics;
}
