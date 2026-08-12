import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import NotationDecoder from './NotationDecoder';

// ============================================================================
//  SOCRATIC SIDEBAR
//  A slide-out panel on the right side of the screen that renders the
//  compiler debug chat using the NotationDecoder for rich tooltip rendering.
// ============================================================================

export default function SocraticSidebar() {
  const messages = useChatStore(state => state.messages);
  const isOpen = useChatStore(state => state.isOpen);
  const isLoading = useChatStore(state => state.isLoading);
  const sendMessage = useChatStore(state => state.sendMessage);
  const toggleOpen = useChatStore(state => state.toggleOpen);
  const clearMessages = useChatStore(state => state.clearMessages);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleOpen}
        />
      )}

      {/* Toggle tab (always visible when closed) */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[91]
                     px-2 py-6 rounded-l-lg
                     bg-slate-900/90 backdrop-blur border border-r-0 border-slate-700/50
                     text-slate-400 hover:text-cyan-400 hover:bg-slate-800/90
                     transition-all duration-200 shadow-lg
                     cursor-pointer"
          title="Open Debug Chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Sidebar panel */}
      <div
        className={`
          fixed right-0 top-0 z-[95] h-full w-[420px] max-w-[90vw]
          flex flex-col
          bg-slate-950/95 backdrop-blur-xl
          border-l border-slate-700/50
          shadow-[-8px_0_40px_rgba(0,0,0,0.5)]
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">Socratic Debugger</div>
              <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">AI Shape Analysis</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Clear button */}
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="p-1.5 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-2 14H7L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            )}

            {/* Close button */}
            <button
              onClick={toggleOpen}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="text-slate-500 text-sm font-medium mb-1">No conversation yet</div>
              <div className="text-slate-600 text-xs max-w-[240px]">
                Click "Help Me Debug" on a shape error to start a Socratic debugging session.
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <span className="text-cyan-400 text-xs font-mono font-bold">AI</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-800 bg-slate-900/40 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue || ''}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your shape error..."
              rows={1}
              disabled={isLoading}
              className="
                flex-1 resize-none
                bg-slate-800/60 border border-slate-700/50 rounded-xl
                px-4 py-2.5
                text-sm text-slate-200 placeholder:text-slate-600
                outline-none
                focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20
                disabled:opacity-50
                transition-all duration-200
                caret-cyan-400
                max-h-32
              "
              style={{ minHeight: '42px' }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="
                shrink-0 w-10 h-10 rounded-xl
                bg-cyan-500/20 border border-cyan-500/40
                text-cyan-400
                hover:bg-cyan-500/30 hover:border-cyan-500/50
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center
                cursor-pointer
              "
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div className="text-[10px] text-slate-700 font-mono mt-1.5 px-1">
            Enter to send · Shift+Enter for newline · Use %%term%% for notation tooltips
          </div>
        </form>
      </div>
    </>
  );
}

// ============================================================================
//  MESSAGE BUBBLE
//  Renders a single chat message with role-specific styling.
//  Uses the NotationDecoder for assistant responses.
// ============================================================================
function MessageBubble({ message }) {
  const { role, content } = message;

  if (role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg px-4 py-2.5 max-w-[90%]">
          <div className="text-xs text-slate-400 leading-relaxed">
            <NotationDecoder content={content} />
          </div>
        </div>
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-cyan-950/40 border border-cyan-500/20 rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
          <div className="text-sm text-slate-200 leading-relaxed">
            {content}
          </div>
        </div>
        <div className="shrink-0 w-7 h-7 rounded-lg bg-slate-700/50 border border-slate-600/50 flex items-center justify-center">
          <span className="text-slate-400 text-xs font-mono font-bold">U</span>
        </div>
      </div>
    );
  }

  // Assistant messages — use the full NotationDecoder
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
        <span className="text-cyan-400 text-xs font-mono font-bold">AI</span>
      </div>
      <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
        <div className="text-sm text-slate-300 leading-relaxed">
          <NotationDecoder content={content} />
        </div>
      </div>
    </div>
  );
}
