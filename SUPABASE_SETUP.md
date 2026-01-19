# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details
5. Wait for the project to be created

## 2. Get Your API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Copy your **Project URL** (this is your `VITE_SUPABASE_URL`)
3. Copy your **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

## 3. Set Up Environment Variables

### Option A: Automated Setup (Recommended)

**On Windows:**
```bash
setup.bat
```

**On Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Or directly with Node.js:**
```bash
node setup.js
```

The script will prompt you for your Supabase credentials and create the `.env` file automatically.

### Option B: Manual Setup

1. Copy `.env.example` to `.env` in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

## 4. Create the Database Table

**Option A: Use the provided SQL file (Easiest)**

1. Open the file `supabase-schema.sql` in this project
2. Copy the entire contents
3. Go to your Supabase dashboard → SQL Editor → New Query
4. Paste the SQL script
5. Click "Run" or press Ctrl+Enter

**Option B: Copy from below**

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Create user_progress table
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

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own progress
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 5. Enable Email Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Make sure **Email** is enabled
3. Configure email templates if needed (optional)

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the app
3. Try signing up with a test email
4. Check your Supabase dashboard → Authentication → Users to see if the user was created
5. Check the `user_progress` table to see if a progress record was created

## Troubleshooting

- **"Invalid API key"**: Make sure you're using the `anon` key, not the `service_role` key
- **"Table doesn't exist"**: Make sure you ran the SQL script in step 4
- **"RLS policy violation"**: Make sure the RLS policies are set up correctly
- **Email not sending**: Check your Supabase project settings for email configuration

## Security Notes

- Never commit your `.env` file to version control
- The `anon` key is safe to use in client-side code (it's protected by RLS)
- Never expose your `service_role` key in client-side code
