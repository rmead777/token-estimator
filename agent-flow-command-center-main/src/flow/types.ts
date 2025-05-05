export interface FlowNode {
  id: string;
  type: "input" | "model" | "action" | "output" | "inputPrompt";
  modelId?: string;
  config?: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    streamResponse?: boolean;
    retryOnError?: boolean;
    label?: string; // Added label for reference
    [key: string]: any;
  };
  inputNodeIds?: string[];
  prompt?: string;
  output?: any; // Store node output during execution
  nodeKind?: 'chapter' | 'dialogue' | 'summary' | 'retroinject' | 'compiler' | string;
}
