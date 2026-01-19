/**
 * Supabase client configuration
 * Replace these with your actual Supabase project credentials
 */

import { createClient } from '@supabase/supabase-js';

// These will be provided by the user - using environment variables or config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

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
