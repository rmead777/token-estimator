import { Node, Edge } from '@xyflow/react';

export const initialNodes: Node[] = [
  {
    id: 'node-1',
    type: 'agent',
    position: { x: 250, y: 100 },
    data: {
      label: 'User Input',
      type: 'input',
      status: 'idle',
      metrics: {
        tasksProcessed: 124,
        latency: 12,
        errorRate: 0.5,
      },
      // Add model ID and config
      modelId: 'gpt-4o',
      config: {
        systemPrompt: 'You are a helpful AI assistant.',
        temperature: 0.7,
        maxTokens: 512,
        streamResponse: true,
        retryOnError: true
      }
    },
  },
  {
    id: 'node-2',
    type: 'agent',
    position: { x: 250, y: 250 },
    data: {
      label: 'Process Data',
      type: 'action',
      status: 'active',
      metrics: {
        tasksProcessed: 87,
        latency: 56,
        errorRate: 2.1,
      },
      // Add model ID and config
      modelId: 'claude-3.7-sonnet',
      config: {
        systemPrompt: 'You analyze and process data efficiently.',
        temperature: 0.5,
        maxTokens: 1024,
        streamResponse: false,
        retryOnError: true
      }
    },
  },
  {
    id: 'node-3',
    type: 'agent',
    position: { x: 250, y: 400 },
    data: {
      label: 'Generate Response',
      type: 'response',
      status: 'error',
      metrics: {
        tasksProcessed: 56,
        latency: 230,
        errorRate: 5.3,
      },
      // Add model ID and config
      modelId: 'gemini-2.5-pro',
      config: {
        systemPrompt: 'You generate thoughtful and accurate responses.',
        temperature: 0.8,
        maxTokens: 2048,
        streamResponse: true,
        retryOnError: false
      }
    },
  },
];

export const initialEdges: Edge[] = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    animated: true,
  },
  {
    id: 'edge-2-3',
    source: 'node-2',
    target: 'node-3',
    animated: true,
  },
];

export function createChapterBundle(id: string, label: string, positionY: number = 100): Node[] {
  return [
    {
      id: `${id}-chapter`,
      type: 'agent',
      position: { x: 100, y: positionY },
      data: {
        label,
        type: 'model',
        nodeKind: 'chapter',
        output: '' // Ensure chapter node always has an output property
      }
    },
    {
      id: `${id}-summary`,
      type: 'agent',
      position: { x: 300, y: positionY + 180 },
      data: {
        label: `Summary of ${label}`,
        type: 'model',
        nodeKind: 'summary'
      }
    },
    {
      id: `${id}-inject`,
      type: 'agent',
      position: { x: 500, y: positionY + 360 },
      data: {
        label: `RetroInject for ${label}`,
        type: 'model',
        nodeKind: 'retroinject'
      }
    }
  ];
}

export function createChapterEdges(id: string): Edge[] {
  return [
    { id: `e-${id}-c-s`, source: `${id}-chapter`, target: `${id}-summary` },
    { id: `e-${id}-s-i`, source: `${id}-summary`, target: `${id}-inject` }
  ];
}

export function createDefaultNovelFlow(): {
  nodes: Node[];
  edges: Edge[];
} {
  // Add InputPrompt node for user prompt
  const inputPromptNode: Node = {
    id: 'user-prompt',
    type: 'inputPrompt',
    position: { x: 100, y: -150 },
    data: {
      label: 'User Prompt',
      type: 'inputPrompt',
      prompt: '', // initial value, can be set by user
      status: 'idle',
    }
  };

  const outlineNode: Node = {
    id: 'outline',
    type: 'agent', // changed from 'input' to 'agent'
    position: { x: 100, y: 0 },
    data: {
      label: 'Outline Planner',
      type: 'input',
      nodeKind: 'outline',
      output: 'No outline generated yet.'
    }
  };

  const chapterNodes = createChapterBundle('ch1', 'Chapter 1', 200);
  const chapterEdges = createChapterEdges('ch1');

  // Connect InputPrompt to Outline
  const connectPromptToOutline: Edge = {
    id: 'e-userprompt-outline',
    source: 'user-prompt',
    target: 'outline',
    animated: true,
  };

  const connectOutlineToChapter: Edge = {
    id: 'e-outline-ch1',
    source: 'outline',
    target: 'ch1-chapter'
  };

  return {
    nodes: [inputPromptNode, outlineNode, ...chapterNodes],
    edges: [connectPromptToOutline, ...chapterEdges, connectOutlineToChapter]
  };
}
