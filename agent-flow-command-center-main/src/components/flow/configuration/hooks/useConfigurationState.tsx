
import { useState, useEffect } from 'react';
import { Node as ReactFlowNode } from '@xyflow/react';
import { AgentNodeData } from '../types/configuration.types';
import { toast } from '@/components/ui/use-toast';

const STORAGE_KEY_PREFIX = 'flow_config_';
const getNodeStorageKey = (nodeId: string, field: string) => `${STORAGE_KEY_PREFIX}${nodeId}_${field}`;

export function useConfigurationState(node: ReactFlowNode<AgentNodeData>) {
  const [tempProvider, setTempProvider] = useState<string>("");
  const [tempAgentType, setTempAgentType] = useState<string>("");
  const [hasShownMockHint, setHasShownMockHint] = useState(false);

  useEffect(() => {
    const savedProvider = localStorage.getItem(getNodeStorageKey(node.id, 'provider'));
    const savedModel = localStorage.getItem(getNodeStorageKey(node.id, 'model'));
    const savedType = localStorage.getItem(getNodeStorageKey(node.id, 'type'));
    const savedColor = localStorage.getItem(getNodeStorageKey(node.id, 'color'));

    if (savedType) {
      setTempAgentType(savedType);
    } else if (node.data?.type) {
      setTempAgentType(node.data.type);
    }

    if (savedProvider) {
      setTempProvider(savedProvider);
    }

    setHasShownMockHint(false);
  }, [node.id]);

  const showMockModelHint = () => {
    if (!hasShownMockHint) {
      toast({
        title: "Mock Model Selected",
        description: "This agent will simulate output using MockAdapter. No real API calls will be made.",
      });
      setHasShownMockHint(true);
    }
  };

  return {
    tempProvider,
    setTempProvider,
    tempAgentType,
    setTempAgentType,
    hasShownMockHint,
    showMockModelHint,
    getNodeStorageKey
  };
}

