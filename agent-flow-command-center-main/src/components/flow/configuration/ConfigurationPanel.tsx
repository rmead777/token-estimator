import { X, Play, Pause, Trash, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { ConfigurationPanelProps, AgentNodeData } from './types/configuration.types';
import { GeneralSettingsPanel } from './panels/GeneralSettingsPanel';
import { ModelSettingsPanel } from './panels/ModelSettingsPanel';
import { ColorSettingsPanel } from './panels/ColorSettingsPanel';

export function ConfigurationPanel({ node, onNodeChange, onClose, onDeleteNode }: ConfigurationPanelProps) {
  const data = node.data as AgentNodeData;
  const isRunning = data.status === 'active';

  // Determine available node types for the dropdown
  const baseNodeTypes = [
    { label: "Input", value: "input" },
    { label: "Model", value: "model" },
    { label: "Action", value: "action" },
    { label: "Output", value: "output" },
  ];
  const novelNodeTypes = [
    { label: "Chapter", value: "chapter" },
    { label: "Dialogue", value: "dialogue" },
    { label: "Summary", value: "summary" },
    { label: "RetroInject", value: "retroinject" },
    { label: "Compiler", value: "compiler" },
    { label: "Outline", value: "outline" },
  ];
  // Heuristic: if nodeKind is a novel type, show all novel types
  const isNovel = ["chapter","dialogue","summary","retroinject","compiler","outline"].includes(
    String(data.nodeKind || data.type)
  );
  const nodeTypes = isNovel ? [...baseNodeTypes, ...novelNodeTypes] : baseNodeTypes;

  const handlePlayPause = () => {
    onNodeChange(prev => ({
      ...prev,
      data: {
        ...prev.data,
        status: isRunning ? 'idle' : 'active'
      }
    }));
  };

  const handleDeleteNode = () => {
    if (onDeleteNode) {
      onDeleteNode(node.id);
      toast({
        title: "Agent Node Deleted",
        description: "This agent node was removed from your flow."
      });
      onClose();
    } else {
      toast({
        title: "Delete Not Supported",
        description: "Node deletion is currently not available here.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full w-80 flex-shrink-0 overflow-auto border-l border-gray-800 bg-gray-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium flex items-center gap-2">
          Configure Agent
          {data.nodeKind && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-white border border-gray-700 capitalize">
              {String(data.nodeKind)}
            </span>
          )}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">{data.label}</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
            data.status === 'active' 
              ? 'bg-green-900/40 text-green-400' 
              : data.status === 'error'
              ? 'bg-red-900/40 text-red-400'
              : 'bg-yellow-900/40 text-yellow-400'
          }`}>
            {data.status === 'active' ? 'Running' : data.status === 'idle' ? 'Idle' : 'Error'}
          </span>
        </div>
        <div className="text-xs text-gray-400">ID: {node.id}</div>
      </div>

      {data.modelId === "mock-model" && (
        <div className="mb-4 rounded border border-blue-700 bg-blue-950/70 p-3 text-xs text-blue-300">
          <b>Mock Model Info: </b>
          <span>
            This agent will run a simulated model. Use this for UI or logic testing. Outputs will look like: <br />
            <span className="font-mono">[Simulated output for: ...]</span>
          </span>
        </div>
      )}

      <Separator className="my-4 bg-gray-800" />

      <div className="space-y-4">
        <GeneralSettingsPanel node={node} onNodeChange={onNodeChange} nodeTypes={nodeTypes} />
        <ModelSettingsPanel node={node} onNodeChange={onNodeChange} />
        <ColorSettingsPanel node={node} onNodeChange={onNodeChange} />
      </div>

      <Separator className="my-4 bg-gray-800" />

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className={`flex-1 gap-2 ${isRunning ? 'border-amber-700 text-amber-400' : 'border-emerald-700 text-emerald-400'}`}
          onClick={handlePlayPause}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </Button>

        <Button 
          variant="outline" 
          className="flex-1 gap-2 border-red-700 text-red-400"
          onClick={handleDeleteNode}
        >
          <Trash className="h-4 w-4" />
          <span>Delete</span>
        </Button>
      </div>

      {data.status === 'error' && (
        <div className="mt-4 rounded-md bg-red-900/30 p-3 text-sm text-red-300">
          <div className="mb-1 flex items-center gap-1 font-medium">
            <AlertTriangle className="h-4 w-4" />
            <span>Error encountered</span>
          </div>
          <p className="text-xs">
            Agent failed to process the last request due to a timeout. Check API keys or adjust timeout settings.
          </p>
        </div>
      )}
    </div>
  );
}
