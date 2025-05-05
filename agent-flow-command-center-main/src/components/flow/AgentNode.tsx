import { Handle, Position, NodeResizer } from '@xyflow/react';
import { FlowNode } from '@/flow/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AgentNodeProps {
  data: {
    label: string;
    type: string;
    status: 'active' | 'idle' | 'error';
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
      [key: string]: any;
    };
    color?: string;
    nodeKind?: string;
    debugPrompt?: string;
    output?: string;
  };
  selected: boolean;
  setOutlineToView?: (outline: any[]) => void;
  setShowOutline?: (show: boolean) => void;
}

export function AgentNode({ data, selected, setOutlineToView, setShowOutline }: AgentNodeProps) {
  const metrics = data.metrics || { tasksProcessed: 0, latency: 0, errorRate: 0 };
  const [showPrompt, setShowPrompt] = useState(false);

  const nodeKindStyles = {
    chapter: { color: 'bg-purple-900 text-purple-100', emoji: '📖' },
    dialogue: { color: 'bg-teal-700 text-teal-100', emoji: '💬' },
    summary: { color: 'bg-blue-200 text-blue-900', emoji: '📝' },
    retroinject: { color: 'bg-amber-300 text-amber-900', emoji: '🧠' },
    outline: { color: 'bg-orange-200 text-orange-900', emoji: '🗂️' },
    compiler: { color: 'bg-emerald-400 text-emerald-900', emoji: '📚' },
    input: { color: 'bg-indigo-900 text-indigo-100', emoji: '✏️' },
    action: { color: 'bg-purple-900 text-purple-100', emoji: '⚡' },
    output: { color: 'bg-green-900 text-green-100', emoji: '✅' },
    response: { color: 'bg-green-900 text-green-100', emoji: '✅' },
    default: { color: 'bg-gray-800 text-gray-100', emoji: '🤖' }
  };

  // --- Retroinject warning helper ---
  function getRetroinjectWarning(output?: string) {
    if (!output) return null;
    try {
      const parsed = JSON.parse(output);
      // If fallback key is present, or required keys are missing, show warning
      if (
        parsed.fallback ||
        !('characterArcs' in parsed) ||
        !('openThreads' in parsed) ||
        !('emotionalTone' in parsed) ||
        !('worldState' in parsed)
      ) {
        return '⚠️ Model output was malformed or missing required fields. Check your model prompt and output format.';
      }
    } catch {
      // If not valid JSON, show warning
      return '⚠️ Model output is not valid JSON. Check your model prompt and output format.';
    }
    return null;
  }

  // Special rendering for outline node
  if (data.nodeKind === 'outline') {
    const { color, emoji } = nodeKindStyles['outline'];
    return (
      <div
        className={`rounded-md p-4 shadow-md ${color} ${selected ? 'ring-2 ring-blue-400/60' : ''}`}
        style={{ minWidth: 260, minHeight: 140, maxWidth: 340, maxHeight: 260, display: 'flex', flexDirection: 'column' }}
      >
        <NodeResizer
          minWidth={260}
          minHeight={140}
          isVisible={selected}
          lineClassName="border-blue-400"
          handleClassName="h-3 w-3 bg-blue-400 border-2 rounded-full"
        />
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-gray-300"
          isConnectable={true}
        />
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xl mr-2">{emoji}</span>
          <div className="font-bold text-base truncate" title={data.label}>{data.label}</div>
          {data.modelId && (
            <span className="ml-auto px-2 py-1 rounded bg-black/20 text-xs font-mono border border-black/10">
              {data.modelId}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 rounded p-2 text-xs mt-1 mb-2" style={{ minHeight: 60, maxHeight: 120 }}>
          {data.output ? (
            <pre className="whitespace-pre-wrap break-words text-xs text-black" style={{ background: 'transparent', margin: 0 }}>
              {data.output}
            </pre>
          ) : (
            <span className="text-gray-400">No outline generated yet.</span>
          )}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-gray-300"
          isConnectable={true}
        />
        {setOutlineToView && setShowOutline && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-2 text-xs bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200"
            onClick={() => {
              let parsed: any[] = [];
              try {
                parsed = JSON.parse(data.output || '[]');
              } catch {
                parsed = [];
              }
              setOutlineToView(parsed);
              setShowOutline(true);
            }}
          >
            📖 View Outline
          </Button>
        )}
      </div>
    );
  }

  const { color, emoji } = nodeKindStyles[data.nodeKind] || nodeKindStyles.default;

  const getStatusColor = () => {
    if (data.status === 'active') return 'bg-green-500';
    if (data.status === 'error') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <div 
      className={`rounded-md p-4 shadow-md ${color} ${selected ? 'ring-2 ring-white/50' : ''}`}
      style={data.color ? { background: data.color } : undefined}
    >
      <NodeResizer 
        minWidth={180}
        minHeight={100}
        isVisible={selected}
        lineClassName="border-white"
        handleClassName="h-3 w-3 bg-white border-2 rounded-full"
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-gray-300"
        isConnectable={true}
      />

      <div className="mb-2 flex items-center justify-between">
        <span className="text-xl mr-2">{emoji}</span>
        <div className="text-sm font-medium">{data.label}</div>
        {data.modelId && (
          <span className="ml-auto px-2 py-1 rounded bg-black/20 text-xs font-mono border border-black/10">
            {data.modelId}
          </span>
        )}
        <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
      </div>

      <div className="flex flex-col gap-1 text-xs opacity-80">
        <div className="flex justify-between">
          <span>Tasks:</span>
          <span>{metrics.tasksProcessed}</span>
        </div>
        <div className="flex justify-between">
          <span>Latency:</span>
          <span>{metrics.latency}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Error Rate:</span>
          <span>{metrics.errorRate}%</span>
        </div>
        {data.modelId && (
          <div className="flex justify-between">
            <span>Model:</span>
            <span className="truncate max-w-[100px]">{data.modelId}</span>
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-gray-300"
        isConnectable={true}
      />

      {/* Debug Prompt Viewer */}
      <Button
        onClick={() => setShowPrompt(!showPrompt)}
        size="sm"
        className="mt-2 text-xs"
      >
        {showPrompt ? 'Hide Prompt' : 'Show Prompt'}
      </Button>
      {showPrompt && (
        <pre className="mt-2 bg-slate-800 text-xs p-2 rounded max-h-60 overflow-auto whitespace-pre-wrap">
          {data?.debugPrompt || 'No prompt available'}
        </pre>
      )}

      {/* Output panel for all nodes except outline */}
      {data.nodeKind !== 'outline' && (
        <div className="mt-2">
          {data.nodeKind === 'retroinject' && getRetroinjectWarning(data.output) && (
            <div className="mb-2 p-2 bg-yellow-100 text-yellow-900 rounded text-xs border border-yellow-300">
              {getRetroinjectWarning(data.output)}
            </div>
          )}
          {data.output ? (
            <pre className="whitespace-pre-wrap break-words text-xs bg-gray-900 text-white p-2 rounded max-h-60 overflow-auto">
              {data.output}
            </pre>
          ) : (
            <span className="text-gray-400">No output yet.</span>
          )}
        </div>
      )}
    </div>
  );
}
