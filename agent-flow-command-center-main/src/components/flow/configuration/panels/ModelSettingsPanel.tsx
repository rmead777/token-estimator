import { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { BasePanelProps } from '../types/configuration.types';
import { useConfigurationState } from '../hooks/useConfigurationState';
import { getModelsByProvider } from '@/adapters/adapterRegistry';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ModelSettingsPanel({ node, onNodeChange }: BasePanelProps) {
  const { 
    tempProvider, 
    setTempProvider, 
    showMockModelHint,
    getNodeStorageKey 
  } = useConfigurationState(node);

  const modelsByProvider = getModelsByProvider();
  const selectedModel = node.data?.modelId || "";
  const availableModels = tempProvider ? modelsByProvider[tempProvider] || [] : [];
  
  const systemPrompt = node.data?.config?.systemPrompt || "";
  const temperature = node.data?.config?.temperature ?? 0.7;
  const maxTokens = node.data?.config?.maxTokens ?? 8000;
  const streamResponse = node.data?.config?.streamResponse ?? true;
  const retryOnError = node.data?.config?.retryOnError ?? true;

  const showWebSearchOption = tempProvider === "OpenAI" && (selectedModel === "gpt-4.1" || selectedModel === "gpt-4.1-mini-2025-04-14");
  const enableWebSearch = node.data?.config?.enableWebSearch ?? false;

  useEffect(() => {
    if (tempProvider === "Mock" && selectedModel === "mock-model") {
      showMockModelHint();
    }
  }, [tempProvider, selectedModel, showMockModelHint]);

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

  return (
    <div className="space-y-4">
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
          value={tempProvider}
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
          disabled={!tempProvider}
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
          onValueChange={(value) => updateConfig("temperature", value[0])} 
          max={1} 
          step={0.1} 
          className="py-4" 
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">Max Tokens</label>
          <span className="text-xs text-gray-400">{maxTokens}</span>
        </div>
        <Slider 
          value={[maxTokens]} 
          onValueChange={(value) => updateConfig("maxTokens", value[0])} 
          max={32000} 
          step={1000} 
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

      {showWebSearchOption && (
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="text-sm font-medium">Enable Web Search</label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Allows the model to search the web for recent information using the web_search tool</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Switch 
            checked={enableWebSearch}
            onCheckedChange={val => updateConfig("enableWebSearch", val)}
          />
        </div>
      )}
    </div>
  );
}
