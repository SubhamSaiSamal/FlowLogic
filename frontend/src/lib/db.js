/**
 * subgrad — Supabase persistence layer
 * =====================================
 * Per-user cloud sync for sessions, messages, streaks/XP, and the problem
 * library. Every function is best-effort: it no-ops without a signed-in user
 * and swallows errors (logging a warning) so a persistence hiccup or a missing
 * table NEVER breaks the tutoring UX. Run supabase/migrations/0001_init.sql to
 * create the backing tables.
 */

import { supabase } from "./supabaseClient";

const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () =>
  new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

/** Upsert session metadata (title/goal/stats). Keyed on the backend session id. */
export async function upsertSession(userId, session) {
  if (!userId || !session?.id) return;
  try {
    await supabase.from("sessions").upsert(
      {
        id: session.id,
        user_id: userId,
        title: session.title ?? null,
        goal: session.goal ?? null,
        hint_level: session.hintLevel ?? 1,
        total_correct: session.totalCorrect ?? 0,
        total_errors: session.totalErrors ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (e) {
    console.warn("[db] upsertSession failed:", e?.message || e);
  }
}

/** Persist a single chat message. */
export async function saveMessage(userId, sessionId, { role, content, toolUsed }) {
  if (!userId || !sessionId || !content) return;
  try {
    await supabase.from("messages").insert({
      session_id: sessionId,
      user_id: userId,
      role,
      content,
      tool_used: toolUsed ?? null,
    });
  } catch (e) {
    console.warn("[db] saveMessage failed:", e?.message || e);
  }
}

/** List the user's sessions, newest first. Returns [] on any failure. */
export async function listSessions(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, title, goal, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.warn("[db] listSessions failed:", e?.message || e);
    return [];
  }
}

/** Load a session's messages in order. Returns [] on any failure. */
export async function loadMessages(sessionId) {
  if (!sessionId) return [];
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("role, content, tool_used")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((m) => ({
      role: m.role,
      content: m.content,
      toolUsed: m.tool_used,
    }));
  } catch (e) {
    console.warn("[db] loadMessages failed:", e?.message || e);
    return [];
  }
}

/**
 * Record a verified step toward the daily streak + XP (read-modify-write).
 * Streak only advances on a *verified* step (rigor-aligned, not mere presence).
 * Returns the new { current, longest, xp } or null on failure.
 */
export async function recordVerifiedStep(userId, xpGain = 10) {
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let current = 1;
    let longest = 1;
    let xp = xpGain;
    let freezes = 2;

    if (data) {
      xp = (data.xp || 0) + xpGain;
      freezes = data.freezes_left ?? 2;
      const last = data.last_active_date;
      if (last === today()) current = data.current_streak || 1;
      else current = last === yesterday() ? (data.current_streak || 0) + 1 : 1;
      longest = Math.max(current, data.longest_streak || 0);
    }

    await supabase.from("streaks").upsert(
      {
        user_id: userId,
        current_streak: current,
        longest_streak: longest,
        last_active_date: today(),
        xp,
        freezes_left: freezes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    return { current, longest, xp };
  } catch (e) {
    console.warn("[db] recordVerifiedStep failed:", e?.message || e);
    return null;
  }
}

/** Fetch the user's streak/XP row, or null. */
export async function getStreak(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from("streaks")
      .select("current_streak, longest_streak, xp, freezes_left, last_active_date")
      .eq("user_id", userId)
      .maybeSingle();
    return data ?? null;
  } catch (e) {
    console.warn("[db] getStreak failed:", e?.message || e);
    return null;
  }
}

/**
 * Record a judged outcome (from ChatMessageResponse.outcome) toward the
 * user's per-topic mastery. Read-modify-write, same pattern as
 * recordVerifiedStep. Mastery is a simple correct/attempts ratio — enough
 * signal for an MVP dashboard without inventing a full IRT/SM-2 model.
 */
export async function recordProgress(userId, topic, isCorrect) {
  if (!userId || !topic) return null;
  try {
    const { data } = await supabase
      .from("progress")
      .select("attempts, correct")
      .eq("user_id", userId)
      .eq("topic", topic)
      .maybeSingle();

    const attempts = (data?.attempts || 0) + 1;
    const correct = (data?.correct || 0) + (isCorrect ? 1 : 0);
    const mastery = attempts > 0 ? correct / attempts : 0;

    await supabase.from("progress").upsert(
      {
        user_id: userId,
        topic,
        attempts,
        correct,
        mastery,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "user_id,topic" }
    );
    return { attempts, correct, mastery };
  } catch (e) {
    console.warn("[db] recordProgress failed:", e?.message || e);
    return null;
  }
}

/** Fetch the user's per-topic mastery rows, ordered by most recent. */
export async function listProgress(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("progress")
      .select("topic, attempts, correct, mastery, last_seen")
      .eq("user_id", userId)
      .order("last_seen", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.warn("[db] listProgress failed:", e?.message || e);
    return [];
  }
}

/** Fetch the curated problem library, ordered. Returns [] on failure. */
export async function listProblems() {
  try {
    const { data, error } = await supabase
      .from("problems")
      .select("id, topic, difficulty, title, statement, goal_text, sort")
      .order("sort", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.warn("[db] listProblems failed:", e?.message || e);
    return [];
  }
}
