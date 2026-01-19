import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProgress } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProgress: (progress: Partial<UserProgress>) => Promise<void>;
  userProgress: UserProgress | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProgress(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProgress(session.user.id);
      } else {
        setUserProgress(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProgress = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error loading progress:', error);
        return;
      }

      if (data) {
        setUserProgress(data);
      } else {
        // Create initial progress record
        const { data: newProgress, error: createError } = await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            completed_topics: [],
            completed_questions: [],
            quiz_score: 0,
            quiz_attempts: 0,
            quiz_streak: 0,
            experiments: [],
          })
          .select()
          .single();

        if (newProgress && !createError) {
          setUserProgress(newProgress);
        }
      }
    } catch (err) {
      console.error('Error in loadUserProgress:', err);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (data.user && !error) {
      // Create user progress record
      await supabase.from('user_progress').insert({
        user_id: data.user.id,
        completed_topics: [],
        completed_questions: [],
        quiz_score: 0,
        quiz_attempts: 0,
        quiz_streak: 0,
        experiments: [],
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProgress(null);
  };

  const updateProgress = async (progress: Partial<UserProgress>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          ...progress,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (data && !error) {
        setUserProgress(data);
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateProgress,
        userProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
