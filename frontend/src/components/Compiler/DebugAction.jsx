import React from 'react';
import { usePseudoCompilerStore } from '../../store/pseudoCompilerStore';
import { useChatStore } from '../../store/chatStore';

// ============================================================================
//  DEBUG ACTION BUTTON
//  A pulsating, glassmorphic "Help Me Debug" button that overlays the DAG
//  canvas when shape validation errors exist. On click, it reads the exact
//  dimension failures from the compiler store, constructs a Socratic context
//  prompt with AUTO-HEAL patch instructions, and dispatches it to the Chat.
// ============================================================================

export default function DebugAction() {
  const validationErrors = usePseudoCompilerStore(state => state.validationErrors);
  const parsedLayers = usePseudoCompilerStore(state => state.parsedLayers);
  const sendMessage = useChatStore(state => state.sendMessage);
  const setOpen = useChatStore(state => state.setOpen);
  const injectSystemMessage = useChatStore(state => state.injectSystemMessage);

  // Don't render if there are no errors
  if (validationErrors.length === 0) return null;

  const handleDebug = () => {
    // Open the Socratic Sidebar
    setOpen(true);

    // Build a rich, structured context string from ALL validation errors.
    // This is the hidden system context that the LLM will see but the user will NOT.
    const errorDescriptions = validationErrors.map((err, i) => {
      const sourceLayer = parsedLayers.find(l => l.id === err.sourceId);
      const targetLayer = parsedLayers.find(l => l.id === err.targetId);
      return [
        `Error ${i + 1}:`,
        `  Source: ${sourceLayer?.raw || err.sourceId} (output dimension: ${err.expected})`,
        `  Target: ${targetLayer?.raw || err.targetId} (input dimension: ${err.received})`,
        `  The user tried to pass a ${err.expected}-dimension output into a ${err.received}-dimension input.`,
        `  To fix: The target layer's input dimension should be changed from ${err.received} to ${err.expected}.`,
        `  Patch command: [PATCH: ${err.targetId}, in, ${err.expected}]`,
      ].join('\n');
    }).join('\n\n');

    const fullLayerList = parsedLayers.map(l =>
      `  ${l.id}: ${l.raw} ${l.isPassthrough ? '(activation/passthrough)' : `[in=${l.in}, out=${l.out}]`}`
    ).join('\n');

    const hiddenContext = [
      'You are an expert PyTorch Socratic tutor embedded in an ML IDE called subgrad.',
      'The student has a PyTorch nn.Sequential model with tensor shape mismatches.',
      'DO NOT give the direct fix immediately. Ask ONE guiding question first to help them discover the error themselves.',
      'Use the %%notation%% syntax (e.g., %%jacobian%%, %%matrix_multiplication%%) to trigger interactive tooltips for any math terms you reference.',
      '',
      'IMPORTANT — AUTO-HEAL PATCH SYNTAX:',
      'When the student successfully deduces the correct dimension (or if they ask you to just fix it),',
      'output the exact fix using this strict syntax on its own line: [PATCH: layer_X, prop, value]',
      'Where X is the layer index, prop is "in" or "out", and value is the correct integer dimension.',
      'Do NOT wrap the patch command in code blocks or backticks. It must appear as raw text.',
      'The IDE will automatically render this as a clickable "Apply Fix" button for the student.',
      'Example: [PATCH: layer_3, in, 64]',
      '',
      '--- COMPILER STATE ---',
      'Full Layer Stack:',
      fullLayerList,
      '',
      'Validation Errors:',
      errorDescriptions,
      '--- END COMPILER STATE ---',
    ].join('\n');

    // Inject a visible system message to prime the conversation
    injectSystemMessage(
      `🔍 **Compiler Analysis Complete** — Detected **${validationErrors.length}** shape mismatch${validationErrors.length > 1 ? 'es' : ''} in your model. Let me ask you a few questions to help you find the bug.`
    );

    // Send the initial user-visible message with the hidden context payload
    sendMessage(
      'I have shape mismatch errors in my nn.Sequential model. Can you help me understand what went wrong?',
      hiddenContext
    );
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={handleDebug}
        className="
          group relative flex items-center gap-2.5
          px-6 py-3 rounded-xl
          bg-red-950/60 backdrop-blur-xl
          border border-red-500/40
          text-red-200 text-sm font-mono font-medium
          shadow-[0_0_30px_rgba(239,68,68,0.2)]
          hover:bg-red-950/80 hover:border-red-500/60 hover:shadow-[0_0_40px_rgba(239,68,68,0.35)]
          active:scale-[0.97]
          transition-all duration-200
          cursor-pointer
        "
      >
        {/* Pulsating ring */}
        <span className="absolute inset-0 rounded-xl border border-red-500/30 animate-ping opacity-20" />

        {/* Icon */}
        <span className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1L8 5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8 7L8 7.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5" strokeOpacity="0.4" />
          </svg>
        </span>

        {/* Label */}
        <span className="relative">
          Help Me Debug
          <span className="ml-2 text-red-400/60 text-xs">
            ({validationErrors.length} error{validationErrors.length > 1 ? 's' : ''})
          </span>
        </span>

        {/* Shimmer effect on hover */}
        <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-red-500/10 to-transparent" />
        </span>
      </button>
    </div>
  );
}
