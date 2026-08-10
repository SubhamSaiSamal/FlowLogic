import { useState, useRef } from "react";
import MathToolbar from "./MathToolbar";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const insertAtCursor = (textToInsert) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    setValue(before + textToInsert + after);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + textToInsert.length;
      el.focus();
    });
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <MathToolbar onInsert={insertAtCursor} disabled={disabled} />
      
      <div className="flex items-end bg-slate-900 border border-slate-700 shadow-sm focus-within:border-slate-500 transition-colors">
        <textarea
          ref={textareaRef}
          className="flex-1 bg-transparent text-slate-200 p-3 sm:p-4 outline-none resize-none min-h-[52px] max-h-[160px] font-mono text-sm leading-relaxed"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Waiting for tutor..." : "Derive the equation..."}
          disabled={disabled}
          rows={1}
        />
        <button
          className="p-3 sm:p-4 text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:text-slate-400 transition-colors"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 px-1 font-mono">
        <span>Use LaTeX syntax for math.</span>
        <span>Shift+Enter for newline</span>
      </div>
    </div>
  );
}
