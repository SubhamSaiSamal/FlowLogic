export type ExperimentMode = 'visualize' | 'sandbox';

export interface ExperimentRecord {
  id: string;
  mode: ExperimentMode;
  functionId: string;
  learningRate: number;
  iterations: number;
  outcome: 'converged' | 'diverged' | 'stopped';
  timestamp: number;
}

const STORAGE_KEY = 'flowlogic-experiments';

export function loadExperiments(): ExperimentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveExperiments(records: ExperimentRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function appendExperiment(record: ExperimentRecord) {
  const existing = loadExperiments();
  const next = [...existing, record];
  saveExperiments(next.slice(-50)); // keep last 50
}

