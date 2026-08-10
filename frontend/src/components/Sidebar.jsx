import { useEffect, useState, useCallback } from 'react';
import { useSharedOptimizerStore } from '../store/optimizerStore';
import { listSessions } from '../lib/db';
import UserProfile from './UserProfile';

function relativeTime(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const Sidebar = ({ isConnecting, hintLevel, onNewSession, onSelectSession, onOpenLibrary, onOpenProgress }) => {
  const sessions = useSharedOptimizerStore(state => state.sessions);
  const activeSessionId = useSharedOptimizerStore(state => state.activeSessionId);
  const switchSession = useSharedOptimizerStore(state => state.switchSession);
  const user = useSharedOptimizerStore(state => state.user);

  // Signed-in users see their real cloud history instead of the local-only
  // list. Best-effort: an empty/failed fetch just falls back to local state.
  const [cloudSessions, setCloudSessions] = useState(null);

  const refreshCloudSessions = useCallback(() => {
    if (!user?.id) {
      setCloudSessions(null);
      return;
    }
    listSessions(user.id).then(setCloudSessions);
  }, [user]);

  useEffect(() => {
    refreshCloudSessions();
  }, [refreshCloudSessions]);

  const showCloud = !!user?.id && cloudSessions !== null;

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-full text-slate-300 shadow-sm z-10 flex-shrink-0">
      <header className="p-6 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 flex items-center justify-center bg-slate-900 border border-slate-700 text-slate-200 font-mono text-lg shadow-sm">
            λ
          </span>
          <div className="flex flex-col leading-tight">
            <h1 className="font-mono text-sm text-slate-200 uppercase tracking-widest font-semibold">subgrad</h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">SUBGRAD TERMINAL ENV</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-2">
        <button
          className="w-full py-2.5 px-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 text-slate-200 text-sm font-mono flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:hover:bg-slate-900 shadow-sm"
          onClick={() => { onNewSession?.(); setTimeout(refreshCloudSessions, 800); }}
          disabled={isConnecting}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="3" x2="8" y2="13" />
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
          {isConnecting ? 'CONNECTING...' : 'NEW SESSION'}
        </button>
        <button
          className="w-full py-2 px-4 border border-emerald-800/50 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-600/60 text-emerald-300 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
          onClick={onOpenLibrary}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          PROBLEM LIBRARY
        </button>
        <button
          className="w-full py-2 px-4 border border-slate-700 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-500 text-slate-300 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
          onClick={onOpenProgress}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          MASTERY
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {showCloud ? (
          cloudSessions.length === 0 ? (
            <p className="px-3 py-2 text-[11px] font-mono text-slate-600">
              No saved sessions yet — start one above.
            </p>
          ) : (
            cloudSessions.map((cs) => (
              <button
                key={cs.id}
                onClick={() => onSelectSession?.(cs)}
                className={`w-full text-left px-3 py-2 text-xs font-mono truncate transition-colors border-l-2 flex items-center justify-between gap-2 ${
                  cs.id === activeSessionId
                    ? 'bg-slate-900/50 border-emerald-500 text-slate-200'
                    : 'border-transparent text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                }`}
              >
                <span className="truncate">{cs.title || 'Untitled Session'}</span>
                <span className="shrink-0 text-[10px] text-slate-600">{relativeTime(cs.updated_at)}</span>
              </button>
            ))
          )
        ) : (
          sessions.map(session => (
            <button
              key={session.id}
              onClick={() => switchSession(session.id)}
              className={`w-full text-left px-3 py-2 text-xs font-mono truncate transition-colors border-l-2 ${
                session.id === activeSessionId
                  ? 'bg-slate-900/50 border-emerald-500 text-slate-200'
                  : 'border-transparent text-slate-500 hover:bg-slate-900 hover:text-slate-300'
              }`}
            >
              {session.title || 'New Optimization Proof'}
            </button>
          ))
        )}
      </div>

      <section className="p-4 border-t border-slate-900 bg-slate-950">
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase">Session</span>
            <span className={activeSessionId ? "text-emerald-400" : "text-slate-600"}>{activeSessionId ? 'ACTIVE' : 'NONE'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase">Hint Level</span>
            <span className="text-slate-300">{hintLevel ?? 0}/4</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase">Engine</span>
            <span className="text-slate-300">SYMPY</span>
          </div>
        </div>
      </section>

      <div className="p-4 border-t border-slate-900 flex flex-col gap-1">
        <button className="flex items-center gap-3 px-3 py-1.5 text-xs font-mono text-slate-600 opacity-50 cursor-not-allowed">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
          </svg>
          Settings
        </button>
      </div>

      {/* Auth Profile Component */}
      <UserProfile />
    </aside>
  );
};

export default Sidebar;
