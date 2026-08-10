import { createClient } from '@supabase/supabase-js';

// Credentials come from Vite env only — see .env.example. There is deliberately
// no hardcoded fallback: a committed project ref meant a misconfigured deploy
// silently pointed production at the developer's personal Supabase project
// instead of failing in a way anyone would notice.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
    'Running in guest-only mode: every lab works, but sign-in and cross-device ' +
    'persistence are disabled. Set both in frontend/.env to enable accounts.'
  );
}

/**
 * Stub used when Supabase isn't configured. The whole product is usable signed
 * out, so a missing key must degrade to "no accounts" rather than white-screen
 * the app — a stranger arriving from a link should still get the labs even if
 * auth is misconfigured or Supabase is down.
 *
 * db.js already early-returns on a falsy userId, so `from()` is never reached
 * in this mode; it's stubbed defensively rather than out of necessity.
 */
const stub = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe() {} } },
    }),
    signInWithOAuth: async () => {
      console.warn('[supabase] Sign-in unavailable — no Supabase credentials configured.');
      return { data: null, error: new Error('Supabase not configured') };
    },
    signOut: async () => ({ error: null }),
  },
  from: () => {
    const result = Promise.resolve({ data: null, error: null });
    const chain = {
      select: () => chain,
      insert: () => result,
      upsert: () => result,
      update: () => chain,
      delete: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => result,
      single: () => result,
      then: result.then.bind(result),
    };
    return chain;
  },
};

export const isSupabaseConfigured = isConfigured;

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : stub;
