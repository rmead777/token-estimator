import { create } from 'zustand';

export interface DebugRecord {
  nodeId: string;
  modelId: string;
  prompt: string;
  rawOutput: string;
  parsedOutput?: any;
  timestamp: string;
  durationMs: number;
}

export const useDebugStore = create<{
  logs: DebugRecord[];
  addLog: (entry: DebugRecord) => void;
  clearAll: () => void;
}>((set) => ({
  logs: [],
  addLog: (entry) => set((state) => ({ logs: [...state.logs, entry] })),
  clearAll: () => set({ logs: [] })
}));
