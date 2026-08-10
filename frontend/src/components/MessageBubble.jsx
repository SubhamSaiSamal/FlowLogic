
import SystemBadge from "./SystemBadge";
import { parseMessageWithTooltips } from "../utils/mathParser";


export default function MessageBubble({ role, content, toolUsed, isLoading }) {
  const isUser = role === "user";

  if (isLoading) {
    return (
      <div className="flex flex-col mb-6">
        <div className="flex gap-4 items-start w-full max-w-4xl mx-auto">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-900 border border-slate-700 text-slate-400 font-mono text-sm shadow-sm">
            λ
          </div>
          <div className="flex-1 flex flex-col items-start min-w-0">
            <SystemBadge type="loading" />
            <div className="px-5 py-4 bg-slate-900 border border-slate-800 text-slate-300 w-fit">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-none animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-none animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-none animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col mb-6 ${isUser ? "items-end" : "items-start"}`}>
      <div className={`flex gap-4 items-start w-full max-w-4xl mx-auto ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center font-mono text-sm border shadow-sm
          ${isUser 
            ? "bg-slate-800 border-slate-700 text-slate-300" 
            : "bg-slate-900 border-slate-700 text-slate-400"
          }`}>
          {isUser ? "U" : "λ"}
        </div>
        
        {/* Content */}
        <div className={`flex-1 flex flex-col min-w-0 ${isUser ? "items-end" : "items-start"}`}>
          <div className={`px-5 py-4 max-w-[85%] border shadow-sm
            ${isUser 
              ? "bg-slate-800 border-slate-700 text-slate-200" 
              : "bg-slate-900 border-slate-800 text-slate-300 markdown-body w-full"
            }`}>
            {parseMessageWithTooltips(content)}
          </div>
          
          {/* Tool Verification Badge */}
          {toolUsed && (
            <SystemBadge type="verified" toolUsed={toolUsed} />
          )}
        </div>
      </div>
    </div>
  );
}
