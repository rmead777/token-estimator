import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BasePanelProps } from '../types/configuration.types';
import { useConfigurationState } from '../hooks/useConfigurationState';

export function GeneralSettingsPanel({ node, onNodeChange, nodeTypes }: BasePanelProps & { nodeTypes?: { label: string; value: string }[] }) {
  const { tempAgentType, setTempAgentType, getNodeStorageKey } = useConfigurationState(node);
  const agentName = node.data?.label || "";

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

  // Use nodeTypes prop if provided, otherwise fallback to default
  const typeOptions = nodeTypes || [
    { label: "Input", value: "input" },
    { label: "Model", value: "model" },
    { label: "Action", value: "action" },
    { label: "Output", value: "output" },
  ];

  return (
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
        <Select value={tempAgentType} onValueChange={updateAgentType}>
          <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="border-gray-700 bg-gray-900 text-white">
            {typeOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

