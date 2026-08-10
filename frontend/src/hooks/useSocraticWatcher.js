import { useEffect, useState, useRef } from 'react';
import { useSharedOptimizerStore } from '../store/optimizerStore';
import { useDataSandboxStore } from '../store/dataSandboxStore';

export function useSocraticWatcher() {
  const [pulseChat, setPulseChat] = useState(false);
  
  // Shared Store
  const graphValues = useSharedOptimizerStore(state => state.graphValues);
  const setMessages = useSharedOptimizerStore(state => state.setMessages);
  const activeLabView = useSharedOptimizerStore(state => state.activeLabView);
  const hasFiredGraphRef = useRef(false);
  
  // Sandbox Store
  const mseLoss = useDataSandboxStore(state => state.mseLoss);
  const hasFiredSandboxRef = useRef(false);

  // --- Graph Lab Watcher ---
  useEffect(() => {
    if (activeLabView !== 'graph') return;

    const { w, b, x, y } = graphValues;
    const pred = w * x + b;
    const loss = Math.pow(pred - y, 2);

    if ((loss > 1000 || Number.isNaN(loss) || !isFinite(loss)) && !hasFiredGraphRef.current) {
      hasFiredGraphRef.current = true;
      
      setMessages((prev) => [
        ...prev,
        {
          role: "tutor",
          content: "🤖 **subgrad Engine**: I noticed your loss just skyrocketed past 1,000. Look at your learning rate parameter. What happens to the step size when the gradient gets that large?",
          toolUsed: null
        }
      ]);

      setPulseChat(true);
      setTimeout(() => setPulseChat(false), 3000);
    }
    
    if (isFinite(loss) && loss < 100) {
        hasFiredGraphRef.current = false;
    }
  }, [graphValues, setMessages, activeLabView]);

  // --- Sandbox Watcher ---
  useEffect(() => {
    if (activeLabView !== 'sandbox') return;

    if (mseLoss > 100 && !hasFiredSandboxRef.current) {
      hasFiredSandboxRef.current = true;
      
      setMessages((prev) => [
        ...prev,
        {
          role: "tutor",
          content: "🤖 **subgrad Engine**: Your Mean Squared Error just blew up. Look at how that single outlier pulled the entire regression line off the main cluster.",
          toolUsed: null
        }
      ]);

      setPulseChat(true);
      setTimeout(() => setPulseChat(false), 3000);
    }

    if (mseLoss < 50) {
      hasFiredSandboxRef.current = false;
    }
  }, [mseLoss, setMessages, activeLabView]);

  return { pulseChat };
}

