import { create } from 'zustand';

export const useDataSandboxStore = create((set, get) => ({
  // Initialize with a dataset showing a rough positive correlation
  points: [
    { id: 1, x: 20, y: 30 },
    { id: 2, x: 30, y: 40 },
    { id: 3, x: 40, y: 55 },
    { id: 4, x: 60, y: 60 },
    { id: 5, x: 70, y: 75 },
    { id: 6, x: 80, y: 80 },
  ],
  regressionLine: { m: 1, b: 0 },
  mseLoss: 0,
  highlightedOutlierId: null,
  
  updatePointPosition: (id, newX, newY) => {
    set((state) => {
      const newPoints = state.points.map(p => 
        p.id === id ? { ...p, x: newX, y: newY } : p
      );
      return { points: newPoints };
    });
    get().calculateOLS();
  },
  
  // Calculate Ordinary Least Squares regression for current point distribution
  calculateOLS: () => {
    const points = get().points;
    const n = points.length;
    
    if (n === 0) return;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    points.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += (p.x * p.y);
      sumXX += (p.x * p.x);
    });
    
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    const denominator = (sumXX - n * meanX * meanX);
    // Fallback slope to 0 if all x are identical to prevent division by zero
    const m = denominator === 0 ? 0 : (sumXY - n * meanX * meanY) / denominator;
    const b = meanY - m * meanX;
    
    // Calculate Mean Squared Error (MSE) to determine the loss (poisoning extent)
    let sumSquaredError = 0;
    points.forEach(p => {
      const predictedY = m * p.x + b;
      const error = p.y - predictedY;
      sumSquaredError += (error * error);
    });
    const mseLoss = sumSquaredError / n;

    set({ regressionLine: { m, b }, mseLoss });
  },

  highlightWorstOutlier: () => {
    const state = get();
    const { m, b } = state.regressionLine;
    let worstId = null;
    let maxError = -1;
    
    state.points.forEach(p => {
      const predictedY = m * p.x + b;
      const error = Math.abs(p.y - predictedY);
      if (error > maxError) {
        maxError = error;
        worstId = p.id;
      }
    });
    
    set({ highlightedOutlierId: worstId });
    // Remove highlight after 3 seconds
    setTimeout(() => {
      set({ highlightedOutlierId: null });
    }, 3000);
  }
}));
