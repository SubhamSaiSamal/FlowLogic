import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultCanvasState = {
  currentSurface: 'saddle',
  coordinates: { x: 0.0, y: 2.0, z: -4.0 },
  epoch: 154,
  learningRate: 0.5,
  pathHistory: [[0.0, 2.0]],
};

// ==========================================================================
//  DETERMINISTIC GRAPH PASS ENGINE
//  Computes full forward + backward pass and returns updated node/edge arrays.
// ==========================================================================
function runGraphPass(values, isBackpropActive, pathologyMode) {
  const { w, b, x, y } = values;

  // — Forward Pass —
  const pred = w * x + b;
  const loss = Math.pow(pred - y, 2);

  // — Backward Pass —
  let dLoss_dPred = 2 * (pred - y);
  let dLoss_dw    = dLoss_dPred * x;
  let dLoss_db    = dLoss_dPred * 1;

  // — Pathology Override Multipliers —
  let pathologyGradScale = 1;
  if (pathologyMode === 'vanishing') {
    pathologyGradScale = 1e-5;
  } else if (pathologyMode === 'exploding') {
    pathologyGradScale = 1e5;
  } else if (pathologyMode === 'chaotic') {
    // Flip-flop between extremes each render – deterministic based on sign
    pathologyGradScale = dLoss_dw > 0 ? 8.5 : -8.5;
  }

  dLoss_dw *= pathologyGradScale;
  dLoss_db *= pathologyGradScale;

  const fmt = (n) => (isFinite(n) ? Number(n.toFixed(4)).toString() : '∞');

  // — Node visual style per pathology —
  const paramStyle = (() => {
    if (pathologyMode === 'vanishing') return 'border-slate-600 shadow-none opacity-50';
    if (pathologyMode === 'exploding') return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]';
    if (pathologyMode === 'chaotic')   return 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]';
    return isBackpropActive ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'border-emerald-600';
  })();

  const lossStyle = (() => {
    if (pathologyMode === 'exploding') return 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)]';
    if (pathologyMode === 'chaotic')   return 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]';
    return isBackpropActive ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]' : 'border-orange-700';
  })();

  // — Build edge style —
  const edgeBase = isBackpropActive
    ? { stroke: '#06b6d4', strokeWidth: 2 }
    : { stroke: '#475569', strokeWidth: 1 };

  // Backward pass edge labels map: which edge carries which gradient
  const gradLabels = {
    'e-pred-loss': `dL/d_pred = ${fmt(dLoss_dPred)}`,
    'e-w-mult':    `dL/dw = ${fmt(dLoss_dw)}`,
    'e-b-add':     `dL/db = ${fmt(dLoss_db)}`,
  };

  const nodes = [
    {
      id: 'x',
      type: 'inputNode',
      position: { x: 60, y: 60 },
      data: { label: 'Feature x', storeKey: 'x', value: x, grad: null, pathologyMode }
    },
    {
      id: 'w',
      type: 'parameterNode',
      position: { x: 60, y: 200 },
      data: { label: 'Weight w', storeKey: 'w', value: w, grad: fmt(dLoss_dw), pathologyMode, paramStyle }
    },
    {
      id: 'mult',
      type: 'operationNode',
      position: { x: 280, y: 120 },
      data: { symbol: '×' }
    },
    {
      id: 'b',
      type: 'parameterNode',
      position: { x: 280, y: 310 },
      data: { label: 'Bias b', storeKey: 'b', value: b, grad: fmt(dLoss_db), pathologyMode, paramStyle }
    },
    {
      id: 'add',
      type: 'operationNode',
      position: { x: 480, y: 210 },
      data: { symbol: '+' }
    },
    {
      id: 'y_pred',
      type: 'inputNode',
      position: { x: 680, y: 175 },
      data: { label: 'Pred f(x)', storeKey: null, value: fmt(pred), grad: fmt(dLoss_dPred), pathologyMode }
    },
    {
      id: 'y_true',
      type: 'inputNode',
      position: { x: 680, y: 310 },
      data: { label: 'Target y', storeKey: 'y', value: y, grad: null, pathologyMode }
    },
    {
      id: 'loss',
      type: 'lossNode',
      position: { x: 900, y: 240 },
      data: { label: 'MSE Loss', value: fmt(loss), grad: '1.0', lossStyle }
    },
  ];

  const edgeDefs = [
    { id: 'e-x-mult',    source: 'x',      target: 'mult', label: null },
    { id: 'e-w-mult',    source: 'w',      target: 'mult', label: gradLabels['e-w-mult'] },
    { id: 'e-mult-add',  source: 'mult',   target: 'add',  label: null },
    { id: 'e-b-add',     source: 'b',      target: 'add',  label: gradLabels['e-b-add'] },
    { id: 'e-add-pred',  source: 'add',    target: 'y_pred', label: null },
    { id: 'e-pred-loss', source: 'y_pred', target: 'loss', label: gradLabels['e-pred-loss'] },
    { id: 'e-true-loss', source: 'y_true', target: 'loss', label: null },
  ];

  const edges = edgeDefs.map(e => ({
    ...e,
    type: 'gradientEdge',
    animated: isBackpropActive,
    style: edgeBase,
    data: {
      gradient: (isBackpropActive && e.label) ? e.label : null,
      pathologyMode
    }
  }));

  return { nodes, edges };
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultGraphValues = { w: 0.5, b: 1.0, x: 2.0, y: 3.0 };
const initialGraphState = runGraphPass(defaultGraphValues, false, 'normal');

export const useSharedOptimizerStore = create(
  persist(
    (set, get) => {
      const initialId = generateId();
      return {
        sessions: [{
          id: initialId,
          title: 'New Optimization Proof',
          messages: [],
          canvasState: { ...defaultCanvasState }
        }],
        activeSessionId: initialId,

        // Root state for easy component access
        activeLabView: 'surface',
        graphState: initialGraphState,
        graphValues: { ...defaultGraphValues },
        pathologyMode: 'normal',
        isBackpropActive: false,
        
        // Graph Training State
        isTraining: false,
        graphEpoch: 0,
        graphLearningRate: 0.05,
        animationRef: null,

        currentSurface: defaultCanvasState.currentSurface,
        coordinates: defaultCanvasState.coordinates,
        epoch: defaultCanvasState.epoch,
        learningRate: defaultCanvasState.learningRate,
        pathHistory: defaultCanvasState.pathHistory,
        messages: [],

        // Authentication State
        user: null,
        isAuthLoading: true,

        // Engagement (streak / XP) — local mirror; cloud-synced via lib/db.js.
        // Streak advances only on a *verified* step (rigor-aligned, not presence).
        xp: 0,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: null,

        // —— Auth Actions ——
        setUser: (sessionUser) => set({ user: sessionUser }),
        setAuthLoading: (status) => set({ isAuthLoading: status }),

        // —— Engagement Actions ——
        recordVerifiedStepLocal: (xpGain = 10) =>
          set((state) => {
            const today = new Date().toISOString().slice(0, 10);
            const yest = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
            let streak;
            if (state.lastActiveDate === today) streak = state.streak || 1;
            else streak = state.lastActiveDate === yest ? (state.streak || 0) + 1 : 1;
            return {
              xp: (state.xp || 0) + xpGain,
              streak,
              longestStreak: Math.max(streak, state.longestStreak || 0),
              lastActiveDate: today,
            };
          }),

        // Hydrate engagement from the cloud (called after sign-in).
        setEngagement: ({ xp, streak, longestStreak, lastActiveDate }) =>
          set((state) => ({
            xp: xp ?? state.xp,
            streak: streak ?? state.streak,
            longestStreak: longestStreak ?? state.longestStreak,
            lastActiveDate: lastActiveDate ?? state.lastActiveDate,
          })),

        // —— Lab View ——
        setLabView: (view) => set({ activeLabView: view }),

        // —— Pathology ——
        setPathologyMode: (mode) => {
          set((state) => {
            const newGraph = runGraphPass(state.graphValues, state.isBackpropActive, mode);
            return { pathologyMode: mode, graphState: newGraph };
          });
        },

        // —— Core Calculus Engine: updateGraphValue ——
        updateGraphValue: (key, value) => {
          set((state) => {
            const newValues = { ...state.graphValues, [key]: value };
            const newGraph = runGraphPass(newValues, state.isBackpropActive, state.pathologyMode);
            return { graphValues: newValues, graphState: newGraph };
          });
        },

        // —— Backprop Toggle ——
        triggerBackpropAnimation: () => {
          set((state) => {
            const newActive = !state.isBackpropActive;
            const newGraph = runGraphPass(state.graphValues, newActive, state.pathologyMode);
            return { isBackpropActive: newActive, graphState: newGraph };
          });
        },

        // —— Autonomous Training Engine ——
        setGraphLearningRate: (lr) => set({ graphLearningRate: lr }),
        
        startTraining: () => {
          set((state) => {
            if (state.isTraining) return state; // Already training

            let lastFrameTime = performance.now();
            
            const loop = (time) => {
              // Throttle to roughly 10 FPS for visual readability
              if (time - lastFrameTime > 100) {
                lastFrameTime = time;
                
                set((currentState) => {
                  if (!currentState.isTraining) return currentState;

                  const { w, b, x, y } = currentState.graphValues;
                  
                  // Forward Pass
                  const pred = w * x + b;
                  
                  // Backward Pass
                  let dLoss_dPred = 2 * (pred - y);
                  let dLoss_dw = dLoss_dPred * x;
                  let dLoss_db = dLoss_dPred * 1;
                  
                  // Apply Pathology Multipliers
                  let pathologyGradScale = 1;
                  if (currentState.pathologyMode === 'vanishing') {
                    pathologyGradScale = 1e-5;
                  } else if (currentState.pathologyMode === 'exploding') {
                    pathologyGradScale = 1e5;
                  } else if (currentState.pathologyMode === 'chaotic') {
                    pathologyGradScale = dLoss_dw > 0 ? 8.5 : -8.5;
                  }
                  
                  dLoss_dw *= pathologyGradScale;
                  dLoss_db *= pathologyGradScale;

                  // Update Parameters
                  const new_w = w - (currentState.graphLearningRate * dLoss_dw);
                  const new_b = b - (currentState.graphLearningRate * dLoss_db);

                  // Diverged (e.g. high LR + Explode/Chaos pathology) — halt
                  // instead of spinning forever into NaN/Infinity, which used
                  // to freeze the UI in a broken state that survived reloads.
                  if (!Number.isFinite(new_w) || !Number.isFinite(new_b)) {
                    if (currentState.animationRef) cancelAnimationFrame(currentState.animationRef);
                    return { isTraining: false, animationRef: null };
                  }

                  const newValues = { ...currentState.graphValues, w: new_w, b: new_b };
                  const newGraph = runGraphPass(newValues, currentState.isBackpropActive, currentState.pathologyMode);
                  
                  return {
                    graphValues: newValues,
                    graphState: newGraph,
                    graphEpoch: currentState.graphEpoch + 1
                  };
                });
              }
              
              const animRef = requestAnimationFrame(loop);
              set({ animationRef: animRef });
            };
            
            const animRef = requestAnimationFrame(loop);
            return { isTraining: true, animationRef: animRef };
          });
        },

        pauseTraining: () => {
          set((state) => {
            if (state.animationRef) {
              cancelAnimationFrame(state.animationRef);
            }
            return { isTraining: false, animationRef: null };
          });
        },

        resetGraph: () => {
          set((state) => {
            if (state.animationRef) {
              cancelAnimationFrame(state.animationRef);
            }
            const newGraph = runGraphPass(defaultGraphValues, state.isBackpropActive, state.pathologyMode);
            return { 
              isTraining: false, 
              animationRef: null, 
              graphValues: { ...defaultGraphValues }, 
              graphState: newGraph, 
              graphEpoch: 0 
            };
          });
        },

        // —— Session Management ——
        syncSession: (updates) => {
          set((state) => {
            const newRoot = { ...state, ...updates };
            const newCanvasState = {
              currentSurface: newRoot.currentSurface,
              coordinates: newRoot.coordinates,
              epoch: newRoot.epoch,
              learningRate: newRoot.learningRate,
              pathHistory: newRoot.pathHistory,
            };
            return {
              ...newRoot,
              sessions: state.sessions.map(s =>
                s.id === state.activeSessionId
                  ? { ...s, messages: newRoot.messages, canvasState: newCanvasState }
                  : s
              )
            };
          });
        },

        createNewSession: (backendId = null) => {
          const newId = backendId || generateId();
          const newSession = {
            id: newId,
            title: 'New Optimization Proof',
            messages: [],
            canvasState: { ...defaultCanvasState }
          };
          set((state) => ({
            sessions: [newSession, ...state.sessions],
            activeSessionId: newId,
            ...defaultCanvasState,
            messages: []
          }));
        },

        switchSession: (id) => {
          const session = get().sessions.find(s => s.id === id);
          if (session) {
            set({
              activeSessionId: id,
              messages: session.messages,
              ...session.canvasState
            });
          }
        },

        // Load a session fetched from the cloud (Supabase) into the local
        // store, keyed on its stable cloud id. This id is intentionally
        // decoupled from the backend's ephemeral live session_id — the
        // backend is in-memory only and mints a fresh id every reload, but
        // the cloud row (and its messages) persist under this stable id.
        loadCloudSession: (id, title, messages) => {
          set((state) => {
            const exists = state.sessions.some((s) => s.id === id);
            const entry = {
              id,
              title: title || 'Untitled Session',
              messages,
              canvasState: { ...defaultCanvasState },
            };
            return {
              sessions: exists
                ? state.sessions.map((s) => (s.id === id ? { ...s, title: entry.title, messages } : s))
                : [entry, ...state.sessions],
              activeSessionId: id,
              messages,
              ...defaultCanvasState,
            };
          });
        },

        setMessages: (updater) => {
          const currentMessages = get().messages;
          const newMessages = typeof updater === 'function' ? updater(currentMessages) : updater;
          get().syncSession({ messages: newMessages });
        },

        updateSessionTitle: (title) => {
          set((state) => ({
            sessions: state.sessions.map(s =>
              s.id === state.activeSessionId ? { ...s, title } : s
            )
          }));
        },

        setSurface: (surfaceId, startPos) => get().syncSession({
          currentSurface: surfaceId,
          pathHistory: [startPos],
          coordinates: { x: startPos[0], y: startPos[1], z: 0 },
          epoch: 0
        }),

        setLearningRate: (lr) => get().syncSession({ learningRate: lr }),

        simulateStepDown: (evalFunction) => {
          console.log('[STATE BRIDGE] Chat event triggered coordinate transformation.');
          const state = get();
          const newY = state.coordinates.y - 0.5;
          const newX = state.coordinates.x;
          const newZ = evalFunction(newX, newY);
          get().syncSession({
            coordinates: { x: newX, y: newY, z: newZ },
            epoch: state.epoch + 1,
            pathHistory: [...state.pathHistory, [newX, newY]]
          });
        },

        takeGradientStep: (surface) => {
          const state = get();
          const last = state.pathHistory[state.pathHistory.length - 1];
          const [gx, gy] = surface.gradient(last[0], last[1]);
          let nx = last[0] - state.learningRate * gx;
          let ny = last[1] - state.learningRate * gy;
          nx = Math.max(surface.domain[0], Math.min(surface.domain[1], nx));
          ny = Math.max(surface.domain[0], Math.min(surface.domain[1], ny));
          const nz = surface.evaluate(nx, ny);
          get().syncSession({
            coordinates: { x: nx, y: ny, z: nz },
            epoch: state.epoch + 1,
            pathHistory: [...state.pathHistory, [nx, ny]]
          });
        },

        reset: (startPos) => get().syncSession({
          pathHistory: [startPos],
          coordinates: { x: startPos[0], y: startPos[1], z: 0 },
          epoch: 0
        })
      };
    },
    {
      name: 'subgrad-3d-state',
      // Graph Lab's training run is transient — persisting it let a diverged
      // (NaN/Infinity) or merely mid-training run survive a reload, showing
      // a permanently "stuck" lab until the user manually hit Reset.
      partialize: (state) => {
        const {
          isTraining, animationRef, graphEpoch, graphValues, graphState,
          pathologyMode, isBackpropActive, ...rest
        } = state;
        return rest;
      },
    }
  )
);
