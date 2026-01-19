-- FlowLogic Supabase Database Schema
-- Copy and paste this entire script into your Supabase SQL Editor
-- Location: Dashboard → SQL Editor → New Query

-- ============================================
-- STEP 1: Create user_progress table
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  completed_topics TEXT[] DEFAULT '{}',
  completed_questions TEXT[] DEFAULT '{}',
  quiz_score INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  quiz_streak INTEGER DEFAULT 0,
  experiments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- STEP 2: Enable Row Level Security
-- ============================================
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create RLS Policies
-- ============================================

-- Policy: Users can only view their own progress
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 4: Create function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: Create trigger to automatically update updated_at
-- ============================================
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! ✅
-- ============================================
-- This script creates:
-- - user_progress table for tracking user learning progress
-- - Row Level Security policies to protect user data
-- - Automatic timestamp updates
-- 
-- Next: Enable Email authentication in Authentication → Providers
