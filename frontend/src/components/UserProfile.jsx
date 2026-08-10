import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSharedOptimizerStore } from '../store/optimizerStore';

export default function UserProfile() {
  const user = useSharedOptimizerStore(state => state.user);
  const isAuthLoading = useSharedOptimizerStore(state => state.isAuthLoading);

  if (isAuthLoading) {
    return (
      <div className="p-4 border-t border-slate-900 bg-slate-950 flex justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 border-t border-slate-900 bg-slate-950">
        <button
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          className="w-full py-2 px-4 bg-slate-900/50 backdrop-blur border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 text-slate-300 text-xs font-mono transition-colors shadow-sm flex items-center justify-center gap-2 group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-105 transition-transform">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-slate-900 bg-slate-950 flex items-center justify-between">
      <div className="flex items-center gap-3 overflow-hidden">
        {user.user_metadata?.avatar_url ? (
          <img 
            src={user.user_metadata.avatar_url} 
            alt="Avatar" 
            className="w-8 h-8 rounded border border-slate-700 shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 rounded border border-slate-700 bg-slate-800 flex items-center justify-center text-xs font-mono text-slate-400">
            {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
        )}
        <div className="flex flex-col truncate">
          <span className="text-xs font-mono text-slate-200 truncate">
            {user.user_metadata?.full_name || 'Terminal User'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono truncate">
            {user.email}
          </span>
        </div>
      </div>
      
      <button 
        onClick={() => supabase.auth.signOut()}
        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors ml-2"
        title="Sign Out"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}
