import { X, Play, Pause, Trash, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { PROVIDERS } from '@/pages/api-keys/apiKeyProviders';
import { getAdapter, getModelsByProvider } from '@/adapters/adapterRegistry';
import { useState, useEffect, useRef } from 'react';
import { Node as ReactFlowNode } from '@xyflow/react';
import { toast } from '@/components/ui/use-toast';
import { ColorPickerWithOpacity } from "./ColorPickerWithOpacity";

interface AgentNodeData extends Record<string, unknown> {
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
    [key: string]: any;
  };
  color?: string;
}

interface ConfigurationPanelProps {
  node: ReactFlowNode<AgentNodeData>;
  onNodeChange: (updater: (prev: ReactFlowNode<AgentNodeData>) => ReactFlowNode<AgentNodeData>) => void;
  onClose: () => void;
  onDeleteNode?: (nodeId: string) => void;
}

const STORAGE_KEY_PREFIX = 'flow_config_';
const getNodeStorageKey = (nodeId: string, field: string) => `${STORAGE_KEY_PREFIX}${nodeId}_${field}`;

export function ConfigurationPanel({ node, onNodeChange, onClose, onDeleteNode }: ConfigurationPanelProps) {
  const data = node.data || {} as AgentNodeData;
  const [tempProvider, setTempProvider] = useState<string>("");
  const [tempAgentType, setTempAgentType] = useState<string>("");

  const [hasShownMockHint, setHasShownMockHint] = useState(false);
  const modelsByProvider = getModelsByProvider();

  useEffect(() => {
    const savedProvider = localStorage.getItem(getNodeStorageKey(node.id, "provider"));
    const savedType = localStorage.getItem(getNodeStorageKey(node.id, "type"));

    if (savedProvider) {
      setTempProvider(savedProvider);
    } else if (data.modelId) {
      const adapter = getAdapter(data.modelId);
      setTempProvider(adapter ? adapter.providerName : "");
    }

    if (savedType) {
      setTempAgentType(savedType);
    } else {
      setTempAgentType(data.type || "");
    }
  }, [node.id, data.modelId, data.type]);

  const selectedProvider = tempProvider;
  const selectedModel = data.modelId || "";
  const availableModels = selectedProvider ? modelsByProvider[selectedProvider] || [] : [];
  const selectedAgentType = data.type || tempAgentType || "";
  const color = data.color || "#8E9196";
  const colorInputRef = useRef<HTMLInputElement>(null);

  const [opacity, setOpacity] = useState<number>(() => {
    if (!color) return 1;
    if (color.startsWith('#') && color.length === 9) {
      const alphaHex = color.slice(7, 9);
      return Math.round((parseInt(alphaHex, 16) / 255) * 100) / 100;
    }
    if (color.startsWith('rgba(')) {
      const alpha = color.split(',')[3];
      if (alpha) return parseFloat(alpha.replace(')', '').trim());
    }
    return 1;
  });
  useEffect(() => {
    if (!color) return;
    if (color.startsWith('#') && color.length === 9) {
      const alphaHex = color.slice(7, 9);
      setOpacity(Math.round((parseInt(alphaHex, 16) / 255) * 100) / 100);
      return;
    }
    if (color.startsWith('rgba(')) {
      const alpha = color.split(',')[3];
      if (alpha) {
        setOpacity(parseFloat(alpha.replace(')', '').trim()));
        return;
      }
    }
    setOpacity(1);
  }, [color]);

  const systemPrompt = data.config?.systemPrompt || "";
  const temperature = data.config?.temperature ?? 0.7;
  const streamResponse = data.config?.streamResponse ?? true;
  const retryOnError = data.config?.retryOnError ?? true;
  const agentName = data.label || "";
  const agentType = selectedAgentType;

  const updateConfig = (key: string, value: any) => {
    onNodeChange(prev => ({
      ...prev,
      data: {
        ...prev.data,
        config: {
          ...(prev.data?.config || {}),
          [key]: value
        }
      }
    }));
  };

  const updateLabel = (value: string) => {
    onNodeChange(prev => ({
      ...prev,
      data: {
        ...prev.data,
        label: value
      }
    }));
  };

  const updateAgentType = (value: string) => {
    localStorage.setItem(getNodeStorageKey(node.id, 'type'), value);
    setTempAgentType(value);
    onNodeChange(prev => ({
      ...prev,
      data: {
        ...prev.data,
        type: value
      }
    }));
  };

  const updateProvider = (provider: string) => {
    localStorage.setItem(getNodeStorageKey(node.id, 'provider'), provider);
    setTempProvider(provider);

    localStorage.removeItem(getNodeStorageKey(node.id, 'model'));
    onNodeChange(prev => ({
      ...prev,
      data: {
        ...prev.data,
        modelId: "",
        config: {
          ...(prev.data?.config || {}),
        }
      }
    }));
  };

  const updateModel = (modelId: string) => {
    localStorage.setItem(getNodeStorageKey(node.id, 'model'), modelId);

    onNodeChange(prev => ({
      ...prev,
      data: {
        ...prev.data,
        modelId
      }
    }));
  };

  const handleTemperature = (value: number[]) => {
    updateConfig("temperature", value[0]);
  };

  if (!node) return null;
  const isRunning = data.status === 'active';

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

  useEffect(() => {
    if (
      selectedProvider === "Mock" &&
      selectedModel === "mock-model" &&
      !hasShownMockHint
    ) {
      toast({
        title: "Mock Model Selected",
        description: "This agent will simulate output using MockAdapter. No real API calls will be made.",
      });
      setHasShownMockHint(true);
    }
  }, [selectedProvider, selectedModel, hasShownMockHint]);

  return (
    <div className="h-full w-80 flex-shrink-0 overflow-auto border-l border-gray-800 bg-gray-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Configure Agent</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">{agentName}</span>
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

      {selectedProvider === "Mock" && selectedModel === "mock-model" && (
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
        <div>
          <label className="mb-2 block text-sm font-medium">Agent Name</label>
          <Input 
            value={agentName}
            onChange={(e) => updateLabel(e.target.value)}
            className="border-gray-700 bg-gray-800 text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Agent Type</label>
          <Select value={agentType} onValueChange={updateAgentType}>
            <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="border-gray-700 bg-gray-900 text-white">
              <SelectItem value="input">Input</SelectItem>
              <SelectItem value="model">Model</SelectItem>
              <SelectItem value="action">Action</SelectItem>
              <SelectItem value="output">Output</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">System Prompt</label>
          <Textarea 
            rows={4}
            className="border-gray-700 bg-gray-800 text-white"
            value={systemPrompt}
            onChange={(e) => updateConfig("systemPrompt", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">AI Provider</label>
          <Select 
            value={selectedProvider}
            onValueChange={updateProvider}
          >
            <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent className="border-gray-700 bg-gray-900 text-white">
              {Object.keys(modelsByProvider).map(provider => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Model</label>
          <Select 
            value={selectedModel}
            onValueChange={updateModel}
            disabled={!selectedProvider}
          >
            <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="border-gray-700 bg-gray-900 text-white">
              {availableModels.map(model => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Temperature</label>
            <span className="text-xs text-gray-400">{temperature}</span>
          </div>
          <Slider 
            value={[temperature]} 
            onValueChange={handleTemperature} 
            max={1} 
            step={0.1} 
            className="py-4" 
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Stream Response</label>
          <Switch 
            checked={streamResponse}
            onCheckedChange={val => updateConfig("streamResponse", val)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Retry on Error</label>
          <Switch 
            checked={retryOnError}
            onCheckedChange={val => updateConfig("retryOnError", val)}  
          />
        </div>

        <ColorPickerWithOpacity
          color={color}
          opacity={opacity}
          onChange={(nextColor, nextAlpha) => {
            setOpacity(nextAlpha);
            onNodeChange(prev => ({
              ...prev,
              data: {
                ...prev.data,
                color: nextColor,
              }
            }));
          }}
          className="mb-4"
        />
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
