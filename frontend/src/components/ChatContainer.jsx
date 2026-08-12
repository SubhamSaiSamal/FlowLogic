import { useState, useRef, useEffect, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { sendMessage, generateSessionTitle } from "../api/client";
import { useSharedOptimizerStore } from "../store/optimizerStore";
import { SURFACES } from "../constants/surfaces";
import { exportSessionToMarkdown } from "../utils/exportSession";
import * as db from "../lib/db";

export default function ChatContainer({ sessionId, onSessionUpdate, isConnecting, topic }) {
  const messages = useSharedOptimizerStore(state => state.messages);
  const setMessages = useSharedOptimizerStore(state => state.setMessages);
  const updateSessionTitle = useSharedOptimizerStore(state => state.updateSessionTitle);
  const user = useSharedOptimizerStore(state => state.user);
  const recordVerifiedStepLocal = useSharedOptimizerStore(state => state.recordVerifiedStepLocal);
  // The STABLE cloud identity for this conversation (persisted store id) —
  // distinct from `sessionId` (the prop), which is the backend's ephemeral
  // live session used only for /chat/message calls this page load.
  const cloudSessionId = useSharedOptimizerStore(state => state.activeSessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Error reset on new session ID. Adjusted during render rather than in an
  // effect — setting state synchronously in an effect makes React throw the
  // first render away and re-run, so the stale error was briefly painted
  // before being cleared.
  const [prevSessionId, setPrevSessionId] = useState(sessionId);
  if (sessionId !== prevSessionId) {
    setPrevSessionId(sessionId);
    setError(null);
  }

  const clearSession = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the session history?")) {
      useSharedOptimizerStore.persist.clearStorage();
      window.location.reload();
    }
  }, []);

  const simulateStepDown = useSharedOptimizerStore(state => state.simulateStepDown);
  const currentSurfaceId = useSharedOptimizerStore(state => state.currentSurface);
  const triggerBackpropAnimation = useSharedOptimizerStore(state => state.triggerBackpropAnimation);

  const handleSend = useCallback(async (text) => {
    if (!sessionId) {
      setError("No active session. Click '+ New Session' to start.");
      return;
    }
    if (isLoading) return;

    if (text.trim() === 'test-step-down') {
      const activeSurface = SURFACES[currentSurfaceId] || SURFACES['saddle'];
      simulateStepDown(activeSurface.evaluate);
      
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setMessages((prev) => [...prev, { role: "tutor", content: "I've stepped down the gradient in the Laboratory!", toolUsed: null }]);
      return;
    }

    if (text.trim() === 'test-backprop') {
      triggerBackpropAnimation();
      
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setMessages((prev) => [...prev, { role: "tutor", content: "Backpropagation triggered! The chain rule flows backward, updating the gradients (e.g., ∂L/∂w = -4.0).", toolUsed: null }]);
      return;
    }

    // If this is the first message in the session, generate a title automatically.
    // Read the length off the store at call time rather than closing over
    // `messages`: the callback deliberately doesn't depend on the array (that
    // would rebuild it on every incoming message), so a captured `messages`
    // would go stale and re-fire title generation on later sends.
    if (useSharedOptimizerStore.getState().messages.length === 0) {
      generateSessionTitle(text).then(title => {
        updateSessionTitle(title);
      }).catch(err => {
        console.error("Title generation failed:", err);
      });
    }

    // Optimistic user message
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);
    setError(null);

    try {
      const data = await sendMessage(sessionId, text);
      setMessages((prev) => [
        ...prev,
        { role: "tutor", content: data.tutor_response, toolUsed: data.tool_used },
      ]);

      // Pass session updates up (hint level, goal)
      if (onSessionUpdate) {
        onSessionUpdate(data.hint_level, data.current_goal);
      }

      // Reward + cloud-sync a *verified* step (badge-worthy turns only).
      if (data.tool_used) {
        recordVerifiedStepLocal();
        if (user?.id) db.recordVerifiedStep(user.id);
      }

      // Mastery tracking: only when the tutor actually judged a submission
      // this turn (data.outcome), never on clarifying questions/hints.
      if (data.outcome && user?.id) {
        db.recordProgress(user.id, topic || "General", data.outcome === "correct");
      }

      // Best-effort per-user cloud persistence, keyed on the STABLE cloud id
      // (no-ops without sign-in/tables; survives backend restarts/reloads).
      if (user?.id && cloudSessionId) {
        const st = useSharedOptimizerStore.getState();
        const title =
          st.sessions.find((s) => s.id === cloudSessionId)?.title || null;
        db.upsertSession(user.id, {
          id: cloudSessionId,
          title,
          goal: data.current_goal,
          hintLevel: data.hint_level,
        });
        db.saveMessage(user.id, cloudSessionId, { role: "user", content: text });
        db.saveMessage(user.id, cloudSessionId, {
          role: "tutor",
          content: data.tutor_response,
          toolUsed: data.tool_used,
        });
      }
    } catch (err) {
      console.error("Message send failed:", err);
      setError(err.message || "Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading, onSessionUpdate, simulateStepDown, currentSurfaceId, user, recordVerifiedStepLocal, cloudSessionId, topic, setMessages, triggerBackpropAnimation, updateSessionTitle]);

  return (
    <div className="flex flex-col flex-1 h-full relative bg-slate-950">
      
      {/* Floating Header Actions */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Clear Session Button */}
        <button 
          onClick={clearSession}
          className="p-2 bg-slate-900/50 backdrop-blur border border-slate-700/50 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-all rounded shadow-sm group"
          title="Clear Session"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-105 transition-transform">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>

        {/* Floating Export Button */}
        <button 
          onClick={() => {
            exportSessionToMarkdown(messages, useSharedOptimizerStore.getState());
            alert("Horizon log compiled successfully!");
          }}
          className="p-2 bg-slate-900/50 backdrop-blur border border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all rounded shadow-sm group"
          title="Export Session to Markdown"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-0.5 transition-transform">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto w-full">
          {/* Cold start: the backend sleeps on the free tier and takes 30-60s to
              wake. Without this the whole pane renders empty and the input sits
              disabled, which reads as "broken" rather than "waking". */}
          {isConnecting && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 mt-20">
              <div className="w-16 h-16 border border-slate-800 flex items-center justify-center mb-6 text-3xl font-mono text-emerald-500/70 bg-slate-900 shadow-sm animate-pulse">
                λ
              </div>
              <h2 className="text-xl font-mono mb-2 text-slate-300">Waking the math engine</h2>
              <p className="text-sm max-w-xs text-center leading-relaxed">
                The backend sleeps on a free tier, so the first request can take
                up to a minute. The labs on the right work right now — go break
                something while this catches up.
              </p>
            </div>
          )}

          {messages.length === 0 && !isLoading && !isConnecting && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 mt-20">
              <div className="w-16 h-16 border border-slate-800 flex items-center justify-center mb-6 text-3xl font-mono text-slate-700 bg-slate-900 shadow-sm">
                λ
              </div>
              <h2 className="text-xl font-mono mb-2 text-slate-300">subgrad Socratic Engine</h2>
              <p className="text-sm">Start by asking a mathematical question or defining your goal.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble 
              key={i} 
              role={msg.role} 
              content={msg.content} 
              toolUsed={msg.toolUsed} 
            />
          ))}

          {isLoading && <MessageBubble isLoading={true} />}

          {error && (
            <div className="p-4 mb-6 bg-red-950 border border-red-900 text-red-300 font-mono text-sm shadow-sm max-w-4xl mx-auto w-full flex justify-between items-center">
              <span>Error: {error}</span>
              <button 
                onClick={() => setError(null)}
                className="px-3 py-1 bg-red-900/50 hover:bg-red-900 border border-red-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 border-t border-slate-900 bg-slate-950/80 backdrop-blur">
        <div className="max-w-4xl mx-auto w-full">
          <ChatInput 
            onSend={handleSend} 
            disabled={!sessionId || isConnecting || isLoading} 
          />
        </div>
      </div>
    </div>
  );
}
