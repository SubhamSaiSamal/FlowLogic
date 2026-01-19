/**
 * Supabase client configuration
 * Replace these with your actual Supabase project credentials
 */

import { createClient } from '@supabase/supabase-js';

// These will be provided by the user - using environment variables or config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lghajzkpnzwqnbimmydd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaGFqemtwbnp3cW5iaW1teWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODYxNjYsImV4cCI6MjA4NDE2MjE2Nn0.tYvNY0D9zNffJ7ZqoMCTO_qwOVVSado1dqNVFB-xxKo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (will be created in Supabase)
export interface UserProgress {
  id: string;
  user_id: string;
  completed_topics: string[];
  completed_questions: string[];
  quiz_score: number;
  quiz_attempts: number;
  quiz_streak: number;
  experiments: any[];
  updated_at: string;
  created_at: string;
}

