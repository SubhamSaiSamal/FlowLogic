import { create } from 'zustand';
import { sendMessage as sendApiMessage, createSession } from '../api/client';

// ============================================================================
//  CHAT STORE
//  Manages the Socratic Debug Chat sidebar state.
//  Supports injecting hidden system context (from the compiler) into prompts
//  that the LLM sees but the user does not.
// ============================================================================

export const useChatStore = create((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,
  sessionId: null,

  // -------------------------------------------------------------------
  //  Toggle the sidebar visibility
  // -------------------------------------------------------------------
  toggleOpen: () => set(state => ({ isOpen: !state.isOpen })),
  setOpen: (value) => set({ isOpen: value }),

  // -------------------------------------------------------------------
  //  Clear the entire conversation
  // -------------------------------------------------------------------
  clearMessages: () => set({ messages: [], sessionId: null }),

  // -------------------------------------------------------------------
  //  Inject a system/tutor message directly (no LLM call).
  //  Used by DebugAction to prime the conversation with context.
  // -------------------------------------------------------------------
  injectSystemMessage: (content) => {
    set(state => ({
      messages: [
        ...state.messages,
        { role: 'system', content }
      ]
    }));
  },

  // -------------------------------------------------------------------
  //  sendMessage(text, hiddenSystemContext?)
  //
  //  1. Appends the user message to the visible chat.
  //  2. If hiddenSystemContext is provided, it is prepended as a system
  //     message in the payload sent to the LLM but is NOT shown in the UI.
  //  3. Calls the backend and appends the tutor response.
  // -------------------------------------------------------------------
  sendMessage: async (text, hiddenSystemContext = null) => {
    if (!text.trim()) return;

    // Append the user message to the visible chat immediately
    set(state => ({
      messages: [
        ...state.messages,
        { role: 'user', content: text }
      ],
      isLoading: true,
    }));

    try {
      // Build the full prompt for the LLM.
      // The hidden context is prepended so the model has full state awareness,
      // but the user never sees it in the chat history.
      const contextPrefix = hiddenSystemContext
        ? `[SYSTEM CONTEXT — NOT VISIBLE TO USER]\n${hiddenSystemContext}\n[END CONTEXT]\n\nUser says: `
        : '';

      const fullPrompt = contextPrefix + text;

      let currentSessionId = get().sessionId;
      if (!currentSessionId) {
        const sessionData = await createSession(null);
        currentSessionId = sessionData.session_id;
        set({ sessionId: currentSessionId });
      }

      const data = await sendApiMessage(currentSessionId, fullPrompt);

      set(state => ({
        messages: [
          ...state.messages,
          { role: 'assistant', content: data.tutor_response }
        ],
        isLoading: false,
      }));
    } catch (error) {
      console.error('[chatStore] sendMessage failed:', error);

      set(state => ({
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: '⚠️ I couldn\'t reach the tutor backend. It runs on a free tier and may be waking up — give it a few seconds and send that again. The labs on the right keep working either way.'
          }
        ],
        isLoading: false,
      }));
    }
  },
}));
