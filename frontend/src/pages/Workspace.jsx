import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import GradientLaboratory from "../components/GradientLaboratory";
import GraphLaboratory from "../components/Laboratory/GraphLaboratory";
import DataPoisoningLab from "../components/Laboratory/DataPoisoningLab";
import PseudoCompilerLayout from "../components/Compiler/PseudoCompilerLayout";
import { useSharedOptimizerStore } from "../store/optimizerStore";
import { useSocraticWatcher } from "../hooks/useSocraticWatcher";
import { createSession, rehydrateSession } from "../api/client";
import { supabase } from "../lib/supabaseClient";
import * as db from "../lib/db";
import SocraticSidebar from "../components/Chat/SocraticSidebar";
import ProblemLibrary from "../components/ProblemLibrary";
import ProgressDashboard from "../components/ProgressDashboard";

const LAB_VIEWS = ["surface", "graph", "sandbox", "compiler"];

// Custom CSS Transition Wrapper for Smooth Layout Morphing
function LabTransitionWrapper({ activeView }) {
  const [displayView, setDisplayView] = useState(activeView);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (activeView !== displayView) {
      // Trigger fade out
      setIsTransitioning(true);
      // Wait for fade out, then swap components and fade in
      const timer = setTimeout(() => {
        setDisplayView(activeView);
        // A tiny delay before removing the transition class to ensure DOM has updated
        requestAnimationFrame(() => setIsTransitioning(false));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeView, displayView]);

  return (
    <div
      className={`w-full h-full transition-all duration-300 origin-center flex flex-col ${
        isTransitioning ? 'opacity-0 scale-[0.97] blur-[2px]' : 'opacity-100 scale-100 blur-0'
      }`}
    >
      {displayView === 'surface' && <GradientLaboratory />}
      {displayView === 'graph' && <GraphLaboratory />}
      {displayView === 'sandbox' && <DataPoisoningLab />}
      {displayView === 'compiler' && <PseudoCompilerLayout />}
    </div>
  );
}

export default function Workspace() {
  const navigate = useNavigate();
  const { labView } = useParams();

  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [hintLevel, setHintLevel] = useState(1);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);

  const createNewSession = useSharedOptimizerStore(state => state.createNewSession);
  const loadCloudSession = useSharedOptimizerStore(state => state.loadCloudSession);
  const setUser = useSharedOptimizerStore(state => state.setUser);
  const setAuthLoading = useSharedOptimizerStore(state => state.setAuthLoading);
  const activeLabView = useSharedOptimizerStore(state => state.activeLabView);
  const setLabView = useSharedOptimizerStore(state => state.setLabView);
  const user = useSharedOptimizerStore(state => state.user);
  const isAuthLoading = useSharedOptimizerStore(state => state.isAuthLoading);
  const setEngagement = useSharedOptimizerStore(state => state.setEngagement);
  const xp = useSharedOptimizerStore(state => state.xp);
  const streak = useSharedOptimizerStore(state => state.streak);
  const longestStreak = useSharedOptimizerStore(state => state.longestStreak);

  // Socratic Watcher (Interceptor)
  const { pulseChat } = useSocraticWatcher();

  // Keep the URL's :labView segment and the store in sync (URL is the source of truth on load/back/forward)
  useEffect(() => {
    if (labView && labView !== activeLabView) setLabView(labView);
  }, [labView, activeLabView, setLabView]);

  const goToLab = useCallback((view) => {
    setLabView(view);
    navigate(`/app/${view}`);
  }, [navigate, setLabView]);

  // Hydrate streak/XP from the cloud once a user is known (best-effort).
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    db.getStreak(user.id).then((s) => {
      if (cancelled || !s) return;
      setEngagement({
        xp: s.xp,
        streak: s.current_streak,
        longestStreak: s.longest_streak,
        lastActiveDate: s.last_active_date,
      });
    });
    return () => { cancelled = true; };
  }, [user, setEngagement]);

  // Supabase Global Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setAuthLoading]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsConnecting(true);
      setError(null);
      try {
        const data = await createSession(null);
        if (cancelled) return;
        setSessionId(data.session_id);
        setSessionActive(true);
        if (data.goal) setCurrentGoal(data.goal);
      } catch (err) {
        if (cancelled) return;
        console.error("Session creation failed:", err);
        setError("Couldn't reach the tutor backend — it may still be waking up. Give it a few seconds and try again. The labs work fine without it.");
      } finally {
        if (!cancelled) setIsConnecting(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const handleNewSession = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    setHintLevel(1);
    setCurrentGoal(null);
    setCurrentTopic(null);
    setSessionId(null);
    setSessionActive(false);

    try {
      const data = await createSession(null);
      setSessionId(data.session_id);
      setSessionActive(true);
      if (data.goal) setCurrentGoal(data.goal);

      createNewSession(data.session_id);
    } catch (err) {
      console.error("New session failed:", err);
      setError("Couldn't start a new session — the backend may still be waking up. Try again in a few seconds.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleSessionUpdate = useCallback((newHintLevel, newGoal) => {
    setHintLevel(newHintLevel ?? 1);
    if (newGoal) setCurrentGoal(newGoal);
  }, []);

  // Reopen a past cloud session: load its saved transcript for display, and
  // REHYDRATE a live backend session from that transcript (the FastAPI store
  // is in-memory and won't have this id after a restart/reload) so the tutor
  // has real conversational context, not just the bare goal. New messages
  // keep saving under the SAME stable cloud id, so it stays one continuous
  // thread in Supabase regardless of how many backend restarts happen.
  const handleSelectCloudSession = useCallback(async (cloudSession) => {
    setIsConnecting(true);
    setError(null);
    try {
      const msgs = await db.loadMessages(cloudSession.id);
      loadCloudSession(cloudSession.id, cloudSession.title, msgs);
      setCurrentGoal(cloudSession.goal || null);
      setCurrentTopic(null);
      setHintLevel(1);

      const data = msgs.length > 0
        ? await rehydrateSession(msgs, cloudSession.goal || null, 1)
        : await createSession(cloudSession.goal || null);
      setSessionId(data.session_id);
      setSessionActive(true);
    } catch (err) {
      console.error("Failed to load cloud session:", err);
      setError("Couldn't load that session — the backend may still be waking up. Try again in a few seconds.");
    } finally {
      setIsConnecting(false);
    }
  }, [loadCloudSession]);

  // Start a problem from the library: mints a session with the problem's
  // goal pre-set so the tutor immediately knows what to guide toward.
  const handleStartProblem = useCallback(async (problem) => {
    setShowLibrary(false);
    setIsConnecting(true);
    setError(null);
    try {
      const data = await createSession(problem.goal_text);
      setSessionId(data.session_id);
      setSessionActive(true);
      setCurrentGoal(data.goal || problem.goal_text);
      setCurrentTopic(problem.topic || null);
      setHintLevel(1);
      createNewSession(data.session_id);
      navigate(`/app/${activeLabView || "surface"}`);
    } catch (err) {
      console.error("Failed to start problem:", err);
      setError("Couldn't start that problem — the backend may still be waking up. Try again in a few seconds.");
    } finally {
      setIsConnecting(false);
    }
  }, [createNewSession, navigate, activeLabView]);

  if (!LAB_VIEWS.includes(labView)) {
    return <Navigate to="/app/surface" replace />;
  }

  // No sign-in wall. Every lab runs for anonymous visitors — sign-in only buys
  // you cross-device persistence (history, streak/XP, the problem library).
  // db.js is best-effort and no-ops without a user, so guest sessions simply
  // aren't saved rather than erroring. Gating the labs behind Google OAuth was
  // the single biggest bounce driver: a stranger will not grant an OAuth scope
  // to look at a tool they haven't seen yet.
  const isGuest = !isAuthLoading && !user;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-300 font-sans selection:bg-slate-700 selection:text-white">
      {showLibrary && (
        <ProblemLibrary onStart={handleStartProblem} onClose={() => setShowLibrary(false)} />
      )}
      {showProgress && <ProgressDashboard onClose={() => setShowProgress(false)} />}
      <Sidebar
        onNewSession={handleNewSession}
        onSelectSession={handleSelectCloudSession}
        onOpenLibrary={() => setShowLibrary(true)}
        onOpenProgress={() => setShowProgress(true)}
        isConnecting={isConnecting}
        sessionActive={sessionActive}
        hintLevel={hintLevel}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-950/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/")}
              title="Back to home"
              className="flex items-center gap-2 px-2.5 py-1.5 -ml-1 font-mono text-xs text-slate-400 border border-transparent hover:border-slate-700 hover:text-slate-100 transition-colors shrink-0"
            >
              <span aria-hidden="true">←</span>
              <span className="flex h-5 w-5 items-center justify-center border border-slate-700 bg-slate-900 text-[11px] font-bold text-emerald-400">
                λ
              </span>
            </button>
            <div className="text-sm font-mono truncate text-slate-400">
              {currentGoal ? (
                <>
                  <strong className="text-slate-200">Goal:</strong> {currentGoal}
                </>
              ) : (
                <>
                  <strong className="text-slate-200">subgrad</strong> — Socratic ML Tutor
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Streak + XP — rewards verified steps. For guests these are
                local-only and vanish on reload, so say so rather than
                implying progress is being banked somewhere. */}
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-700 text-amber-400"
              title={isGuest
                ? `${streak}-day streak — not saved while signed out`
                : `${streak}-day streak · longest ${longestStreak}`}
            >
              <span>🔥</span>
              {streak}
            </span>
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-700 text-emerald-400"
              title={isGuest
                ? "XP from SymPy-verified steps — not saved while signed out"
                : "XP earned from SymPy-verified steps"}
            >
              {xp} XP
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-700 text-slate-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse"></span>
              GEMINI + SYMPY
            </span>
            {isGuest && (
              <button
                type="button"
                onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
                title="Optional — saves your sessions, streak and progress across devices"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-700 text-slate-400 transition-colors hover:border-emerald-500 hover:text-emerald-400"
              >
                Sign in to save
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="flex items-center justify-between p-3 bg-red-950 border-b border-red-900 text-red-300 font-mono text-sm px-6">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="px-3 py-1 bg-red-900/50 hover:bg-red-900 border border-red-800 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Pane: Chat (40%) */}
          <div className={`w-full lg:w-2/5 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-700 bg-slate-950 overflow-hidden relative transition-all duration-300 ${
            pulseChat ? 'shadow-[0_0_30px_rgba(6,182,212,0.6)] z-10' : ''
          }`}>
            <ChatContainer
              sessionId={sessionId}
              initialMessages={[]}
              onSessionUpdate={handleSessionUpdate}
              isConnecting={isConnecting}
              topic={currentTopic}
            />
          </div>

          {/* Right Pane: Visualization Sandbox (60%) */}
          <div className="w-full lg:w-3/5 flex flex-col relative overflow-hidden bg-slate-950">
            {/* View Toggle */}
            <div className="absolute top-4 right-4 z-50 flex bg-slate-900/80 backdrop-blur border border-slate-700 rounded-md shadow-lg overflow-hidden p-1">
              <button
                onClick={() => goToLab('surface')}
                className={`px-4 py-1.5 text-xs font-mono transition-colors rounded ${activeLabView === 'surface' ? 'bg-slate-700 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Surface Lab (3D)
              </button>
              <button
                onClick={() => goToLab('graph')}
                className={`px-4 py-1.5 text-xs font-mono transition-colors rounded ${activeLabView === 'graph' ? 'bg-slate-700 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Graph Lab (Node)
              </button>
              <button
                onClick={() => goToLab('sandbox')}
                className={`px-4 py-1.5 text-xs font-mono transition-colors rounded ${activeLabView === 'sandbox' ? 'bg-slate-700 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Data (Sandbox)
              </button>
              <button
                onClick={() => goToLab('compiler')}
                className={`px-4 py-1.5 text-xs font-mono transition-colors rounded ${activeLabView === 'compiler' ? 'bg-slate-700 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Compiler
              </button>
            </div>

            {/* Canvas Area with Morph Animations */}
            <LabTransitionWrapper activeView={activeLabView} />
          </div>
        </div>
      </main>

      {/* Socratic Debug Sidebar (overlays from the right) */}
      <SocraticSidebar />
    </div>
  );
}
