export interface NarrativeMemory {
  characterArcs: Record<string, string>;
  emotionalTone: string;
  openThreads: string[];
  worldState: string;
  fallback?: string;
  [key: string]: any;
}

/**
 * Merges multiple memory objects into one, with later values taking precedence.
 */
export function mergeNarrativeMemory(...memories: NarrativeMemory[]): NarrativeMemory {
  return Object.assign({}, ...memories);
}
