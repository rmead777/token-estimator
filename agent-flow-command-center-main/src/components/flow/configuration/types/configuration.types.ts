
import { Node as ReactFlowNode } from '@xyflow/react';

export interface AgentNodeData extends Record<string, unknown> {
  label: string;
  type: string;
  status?: 'active' | 'idle' | 'error';
  metrics?: {
    tasksProcessed: number;
    latency: number;
    errorRate: number;
  };
  modelId?: string;
  config?: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    streamResponse?: boolean;
    retryOnError?: boolean;
    enableWebSearch?: boolean;
    [key: string]: any;
  };
  color?: string;
}

export interface ConfigurationPanelProps {
  node: ReactFlowNode<AgentNodeData>;
  onNodeChange: (updater: (prev: ReactFlowNode<AgentNodeData>) => ReactFlowNode<AgentNodeData>) => void;
  onClose: () => void;
  onDeleteNode?: (nodeId: string) => void;
}

export interface BasePanelProps {
  node: ReactFlowNode<AgentNodeData>;
  onNodeChange: ConfigurationPanelProps['onNodeChange'];
}
