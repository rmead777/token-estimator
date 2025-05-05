import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNodesState, useEdgesState, addEdge, Connection, NodeMouseHandler, Node } from '@xyflow/react';
import { FlowToolbar } from './FlowToolbar';
import { FlowGraph } from './FlowGraph';
import { ConfigurationPanel } from '@/components/flow/configuration/ConfigurationPanel';
import { FlowOutputPanel, FlowOutput } from '@/components/flow/FlowOutputPanel';
import { initialNodes, initialEdges, createChapterBundle, createChapterEdges, createDefaultNovelFlow } from '@/data/flowData';
import { validateBeforeExecution } from '@/utils/modelValidation';
import { toast } from '@/components/ui/use-toast';
import { runSimulatedFlow } from '@/flow/MockRunner';
import { FlowNode } from '@/flow/types';
import { addFlowOutputsToHistory } from '@/data/logData';
import { loadFromLocalStorage } from './helpers';
import { SaveAsWorkflowDialog } from "./SaveAsWorkflowDialog";
import { LoadWorkflowDialog } from "./LoadWorkflowDialog";
import { saveUserFlow, loadUserFlow } from "@/data/workflowStorage";
import { Button } from "@/components/ui/button";
import { executeNode } from '@/flow/executeNode';
import { resolveDAG } from '@/flow/resolveDAG';
import { SettingsDrawer, FlowSettings } from './SettingsDrawer';
import { BookOpen, MessageSquare, FileText, Brain, Book } from "lucide-react";
import { mergeNarrativeMemory, NarrativeMemory } from '@/lib/memory';
import { OutlineViewerPanel } from '@/components/story/OutlineViewerPanel';

interface AgentNodeData {
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
  [key: string]: any;
}

interface InputPromptNodeData {
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
  label: string;
  type: string;
  status?: 'active' | 'idle' | 'error';
  [key: string]: any;
}

type FlowNodeData = AgentNodeData | InputPromptNodeData;

export interface FlowViewHandle {
  runFlow: () => void;
  saveFlow: () => void;
  showSettings: () => void;
  showCode: () => void;
}

interface FlowViewProps {
  masterUserPrompt?: string;
  flowSettings: FlowSettings;
  setFlowSettings: (settings: FlowSettings) => void;
}

const LOCALSTORAGE_NODES_KEY = "ai_flow_nodes";
const LOCALSTORAGE_EDGES_KEY = "ai_flow_edges";
const LOCALSTORAGE_OUTPUTS_KEY = "ai_flow_last_outputs";

export const FlowView = forwardRef<FlowViewHandle, FlowViewProps>(({ masterUserPrompt, flowSettings, setFlowSettings }, ref) => {
  const typedInitialNodes: Node<FlowNodeData>[] = initialNodes.map(node => ({
    ...node,
    data: {
      ...node.data
    } as FlowNodeData
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>(loadFromLocalStorage<Node<FlowNodeData>[]>(LOCALSTORAGE_NODES_KEY, typedInitialNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(loadFromLocalStorage(LOCALSTORAGE_EDGES_KEY, initialEdges));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [flowOutputs, setFlowOutputs] = useState<FlowOutput[]>([]);
  const [showOutputPanel, setShowOutputPanel] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    name: string;
    id: string;
  } | null>(null);
  const [workflowPrompt, setWorkflowPrompt] = useState<string>("");
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [chapterCounter, setChapterCounter] = useState(2); // already created Chapter 1 in default
  const [outlineToView, setOutlineToView] = useState<any[]>([]);
  const [showOutline, setShowOutline] = useState(false);
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);

  useImperativeHandle(ref, () => ({
    runFlow: () => handleExecuteFlow(),
    saveFlow: handleSaveFlow,
    showSettings: () => setShowSettingsDrawer(true),
    showCode: () => {
      toast({
        title: 'Code View',
        description: 'Viewing code is not yet implemented. (Soon!)'
      });
    }
  }));

  useEffect(() => {
    const saved = localStorage.getItem("flowSettings");
    if (saved) setFlowSettings(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("flowSettings", JSON.stringify(flowSettings));
  }, [flowSettings]);

  useEffect(() => {
    // Auto-initialize default novel flow if novel mode is active and nodes are empty
    if (
      flowSettings.flowMode === 'novel' &&
      nodes.length === 0 &&
      edges.length === 0
    ) {
      const { nodes: starterNodes, edges: starterEdges } = createDefaultNovelFlow();
      setNodes(starterNodes.map(node => ({
        ...node,
        data: node.data as FlowNodeData
      })));
      setEdges(starterEdges);
      setChapterCounter(2); // start after Chapter 1
      toast({
        title: "Story Initialized",
        description: "Outline and Chapter 1 nodes created automatically"
      });
    }
  }, []);

  useEffect(() => {
    if (
      flowSettings.flowMode === 'novel' &&
      !localStorage.getItem('novelIntroShown')
    ) {
      setShowIntroOverlay(true);
    }
  }, []);

  // Migration: Ensure all outline nodes have an output property
  useEffect(() => {
    setNodes(ns => ns.map(n => {
      if (n.data && n.data.nodeKind === 'outline' && !n.data.output) {
        return {
          ...n,
          data: {
            ...n.data,
            output: 'No outline generated yet.'
          }
        };
      }
      return n;
    }));
  }, []);

  // Helper: inject onPromptChange for inputPrompt nodes
  const nodesWithPromptHandler = nodes.map(node => {
    if (node.type === 'inputPrompt') {
      return {
        ...node,
        data: {
          ...node.data,
          onPromptChange: (prompt) => {
            setNodes(ns => ns.map(n =>
              n.id === node.id
                ? { ...n, data: { ...n.data, prompt } }
                : n
            ));
          }
        }
      };
    }
    return node;
  });

  // Handler to manually initialize the default novel flow
  const handleInitNovelFlow = () => {
    const { nodes: starterNodes, edges: starterEdges } = createDefaultNovelFlow();
    setNodes(starterNodes.map(node => ({
      ...node,
      data: node.data as FlowNodeData
    })));
    setEdges(starterEdges);
    setChapterCounter(2); // start after Chapter 1
    toast({
      title: "Story Initialized",
      description: "Outline and Chapter 1 nodes created automatically"
    });
  };

  const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge(params, eds)), [setEdges]);
  const onNodeClick: NodeMouseHandler<Node<FlowNodeData>> = useCallback((_, node) => {
    setSelectedNode(node.id);
  }, []);

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;

  const updateNodeData = useCallback((nodeId: string, updater: (n: Node<FlowNodeData>) => Node<FlowNodeData>) => {
    setNodes(ns => ns.map(n => n.id === nodeId ? updater(n) : n));
  }, [setNodes]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges(edges => edges.filter(edge => edge.id !== edgeId));
  }, [setEdges]);

  useEffect(() => {
    const isValid = validateBeforeExecution(nodes);
    setIsValidated(isValid);
  }, [nodes]);

  useEffect(() => {
    try {
      const savedOutputs = localStorage.getItem(LOCALSTORAGE_OUTPUTS_KEY);
      if (savedOutputs) {
        setFlowOutputs(JSON.parse(savedOutputs));
      }
    } catch (error) {
      console.error("Failed to load saved outputs:", error);
    }
  }, []);

  // Node type options for Add Node dropdown
  const baseNodeTypes = [
    { label: "Input", value: "input" },
    { label: "Model", value: "model" },
    { label: "Action", value: "action" },
    { label: "Output", value: "output" },
  ];
  const novelNodeTypes = [
    { label: "Chapter", value: "chapter", icon: <BookOpen size={16} className="text-purple-400" /> },
    { label: "Dialogue", value: "dialogue", icon: <MessageSquare size={16} className="text-teal-400" /> },
    { label: "Summary", value: "summary", icon: <FileText size={16} className="text-blue-400" /> },
    { label: "RetroInject", value: "retroinject", icon: <Brain size={16} className="text-amber-400" /> },
    { label: "Compiler", value: "compiler", icon: <Book size={16} className="text-emerald-400" /> },
    { label: "Outline", value: "outline", icon: <FileText size={16} className="text-orange-400" /> },
  ];
  const nodeTypes = flowSettings.flowMode === 'novel'
    ? [...baseNodeTypes, ...novelNodeTypes]
    : baseNodeTypes;

  function handleSaveFlow() {
    setWorkflowDialogOpen(true);
  }

  async function doSaveWorkflow(name: string) {
    setSaving(true);
    const {
      success,
      error,
      id
    } = await saveUserFlow(name, nodes, edges, activeWorkflow?.id);
    setSaving(false);
    if (success) {
      setActiveWorkflow({
        name,
        id: id!
      });
      toast({
        title: "Workflow Saved",
        description: `Your workflow "${name}" was saved.`
      });
    } else {
      toast({
        title: "Save Failed",
        description: error || "Failed to save workflow.",
        variant: "destructive"
      });
    }
  }

  const handleLoadWorkflow = () => setLoadDialogOpen(true);

  async function onLoadWorkflow(flow: any) {
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setActiveWorkflow({
      name: flow.name,
      id: flow.id
    });
    toast({
      title: "Workflow Loaded",
      description: `Loaded "${flow.name}".`
    });
  }

  const handleAddNode = (typeOverride?: string) => {
    // --- Novel mode: auto-bundle for chapter ---
    if (flowSettings.flowMode === 'novel' && typeOverride === 'chapter') {
      const id = `ch${Date.now()}`;
      const newNodes = createChapterBundle(id, `Chapter ${chapterCounter}`) as Node<FlowNodeData>[];
      const newEdges = createChapterEdges(id);
      setNodes(prev => [
          ...prev,
          ...((newNodes as Node<FlowNodeData>[]) ?? [])
        ]);
      setEdges(prev => [...prev, ...newEdges]);
      setChapterCounter(c => c + 1);
      toast({ title: 'Chapter Bundle Added', description: 'Chapter, Summary, and RetroInject nodes created.' });
      return;
    }
    const newId = `node-${Date.now()}`;
    const last = nodes.length ? nodes[nodes.length - 1] : null;
    const pos = last && last.position ? {
      x: last.position.x + 80,
      y: last.position.y + 60
    } : {
      x: 100,
      y: 100 + nodes.length * 40
    };
    let nodeKind = typeOverride || 'model';
    let label = 'New Agent';
    if (flowSettings.flowMode === 'novel') {
      switch (nodeKind) {
        case 'chapter': label = 'Chapter'; break;
        case 'dialogue': label = 'Dialogue'; break;
        case 'summary': label = 'Summary'; break;
        case 'retroinject': label = 'RetroInject'; break;
        case 'compiler': label = 'Compiler'; break;
        default: label = 'New Agent';
      }
    } else {
      switch (nodeKind) {
        case 'input': label = 'Input'; break;
        case 'model': label = 'Model'; break;
        case 'action': label = 'Action'; break;
        case 'output': label = 'Output'; break;
        default: label = 'New Agent';
      }
    }
    setNodes(nds => [...nds, {
      id: newId,
      type: 'agent',
      position: pos,
      data: {
        label,
        type: nodeKind,
        nodeKind: nodeKind, // for clarity
        status: 'idle',
        metrics: {
          tasksProcessed: 0,
          latency: 0,
          errorRate: 0
        },
        config: {
          systemPrompt: '',
          temperature: 0.7,
          streamResponse: true,
          retryOnError: true
        },
        color: ""
      } as AgentNodeData
    }]);
    toast({
      title: "Node Added",
      description: `${label} node '${newId}' created.`
    });
  };

  const handleAddNextChapter = () => {
    const id = `ch${chapterCounter}`;
    const label = `Chapter ${chapterCounter}`;
    const positionY = 200 + chapterCounter * 300;
    const newNodes = createChapterBundle(id, label, positionY);
    const newEdges = createChapterEdges(id);
    const previousInjectId = `ch${chapterCounter - 1}-inject`;
    const bridgeEdge = {
      id: `e-${previousInjectId}-to-${id}-chapter`,
      source: previousInjectId,
      target: `${id}-chapter`
    };
    setNodes(prev => [
      ...prev,
      ...newNodes.map(node => ({
        ...node,
        data: node.data as FlowNodeData
      }))
    ]);
    setEdges(prev => [...prev, ...newEdges, bridgeEdge]);
    setChapterCounter(c => c + 1);
    toast({
      title: "Chapter Added",
      description: `${label} flow created and linked to prior node`
    });
  };

  function sanitizeNodeOutput(nodeId: string, result: any): string {
    if (typeof result === 'string') return result;
    if (typeof result?.output === 'string') return result.output;
    if (typeof result?.output?.output === 'string') return result.output.output;
    console.warn(`[Node Output Warning] Unexpected structure for node ${nodeId}:`, result);
    return '[UNEXPECTED OUTPUT FORMAT]';
  }

  const handleExecuteFlow = async () => {
    if (!isValidated) {
      const isValid = validateBeforeExecution(nodes);
      setIsValidated(isValid);
      if (!isValid) {
        toast({
          title: "Validation Failed",
          description: "Please fix validation errors before executing flow",
          variant: "destructive"
        });
        return;
      }
    }
    setIsExecuting(true);
    setFlowOutputs([]); // Clear previous outputs

    setNodes(currentNodes => currentNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: 'active'
      }
    })));
    toast({
      title: "Flow Execution Started",
      description: "Running the workflow..."
    });
    try {
      const flowNodes: FlowNode[] = nodes.map(node => {
        const inputIds = edges.filter(edge => edge.target === node.id).map(edge => edge.source);
        console.log(`[DEBUG] Edges for ${node.id}:`, inputIds);
        const nodeData = node.data as FlowNodeData;
        if (node.type === "inputPrompt") {
          return {
            id: node.id,
            type: "inputPrompt",
            inputNodeIds: inputIds,
            prompt: "prompt" in nodeData ? String(nodeData.prompt || "") : undefined
          };
        } else {
          return {
            id: node.id,
            type: node.type as "input" | "model" | "action" | "output" | "inputPrompt",
            modelId: "modelId" in nodeData ? nodeData.modelId : undefined,
            config: "config" in nodeData ? {
              ...nodeData.config,
              label: nodeData.label
            } : undefined,
            inputNodeIds: inputIds,
            nodeKind: (nodeData as any).nodeKind // propagate nodeKind if present
          };
        }
      });
      const outputs: FlowOutput[] = [];
      const nodeOutputs: Record<string, any> = {};
      const nodeMemories: Record<string, NarrativeMemory> = {};
      try {
        const levels = resolveDAG(flowNodes);
        for (const level of levels) {
          const levelPromises = level.map(async node => {
            const startTime = performance.now();
            try {
              // --- Narrative memory propagation ---
              console.log(`[DEBUG] InputNode IDs for ${node.id}:`, node.inputNodeIds);
              const inputNodes = node.inputNodeIds?.map(id => flowNodes.find(n => n.id === id)).filter(Boolean) as FlowNode[] || [];
              const inputs = inputNodes.map(n => nodeOutputs[n.id]);
              console.log(`[DEBUG] Raw inputs for ${node.id}:`, inputs);
              const defaultMemory: NarrativeMemory = {
                characterArcs: {},
                emotionalTone: '',
                openThreads: [],
                worldState: ''
              };
              const memoryInputs = inputNodes.map(n => nodeMemories[n.id] || defaultMemory);
              const mergedMemory = mergeNarrativeMemory(...memoryInputs);
              const inputObject = {
                inputs, // Always wrap in { inputs }
                memory: mergedMemory
              };
              // --- End narrative memory propagation ---
              if (node.type === "inputPrompt") {
                const promptValue = typeof node.prompt === "string" ? node.prompt : "";
                nodeOutputs[node.id] = promptValue;
                nodeMemories[node.id] = mergedMemory;
                const executionTime = Math.round(performance.now() - startTime);
                outputs.push({
                  nodeId: node.id,
                  nodeName: node.config?.label || `Node ${node.id}`,
                  nodeType: node.type,
                  modelId: node.modelId,
                  timestamp: new Date().toISOString(),
                  input: inputs.length > 0 ? inputs : null,
                  output: promptValue,
                  executionTime,
                  config: node.config
                });
                return { nodeId: node.id, success: true };
              }
              const result = await executeNode(node, inputObject, flowSettings);
              console.log(`[DEBUG] executeNode result for ${node.id}:`, result);
              let flatOutput = '[UNDEFINED]';
              if (typeof result === 'string') {
                flatOutput = result;
              } else if (typeof result?.output === 'string') {
                flatOutput = result.output;
              } else if (typeof result?.output?.output === 'string') {
                flatOutput = result.output.output;
              } else {
                console.warn(`[MALFORMED RESULT] node ${node.id} returned weird output:`, result);
              }
              nodeOutputs[node.id] = flatOutput;
              console.log(`[DEBUG] Stored nodeOutputs for ${node.id}:`, nodeOutputs[node.id]);
              nodeMemories[node.id] = result?.memory || mergedMemory;
              const executionTime = Math.round(performance.now() - startTime);
              outputs.push({
                nodeId: node.id,
                nodeName: node.config?.label || `Node ${node.id}`,
                nodeType: node.type,
                modelId: node.modelId,
                timestamp: new Date().toISOString(),
                input: inputs.length === 1 ? inputs[0] : inputs,
                output: result?.output ?? result,
                executionTime,
                config: node.config
              });
              return { nodeId: node.id, success: true };
            } catch (error) {
              console.error(`Error executing node ${node.id}:`, error);
              const executionTime = Math.round(performance.now() - startTime);
              outputs.push({
                nodeId: node.id,
                nodeName: node.config?.label || `Node ${node.id}`,
                nodeType: "error",
                modelId: node.modelId,
                timestamp: new Date().toISOString(),
                input: node.inputNodeIds?.map(id => nodeOutputs[id]) || [],
                output: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                executionTime
              });
              nodeOutputs[node.id] = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
              nodeMemories[node.id] = {
                characterArcs: {},
                emotionalTone: '',
                openThreads: [],
                worldState: ''
              };
              return { nodeId: node.id, success: false };
            }
          });
          await Promise.all(levelPromises);
        }
      } catch (error) {
        console.error("Flow execution error:", error);
        toast({
          title: "Flow Execution Error",
          description: error instanceof Error ? error.message : "Unknown error in flow",
          variant: "destructive"
        });
        outputs.push({
          nodeId: "error",
          nodeName: "Flow Engine",
          nodeType: "error",
          timestamp: new Date().toISOString(),
          input: null,
          output: `Flow Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          executionTime: 0
        });
      }
      setNodes(currentNodes => currentNodes.map(node => {
        const nodeOutput = outputs.find(output => output.nodeId === node.id);
        const hasError = nodeOutput?.nodeType === "error";
        return {
          ...node,
          data: {
            ...node.data,
            status: hasError ? 'error' : 'idle',
            metrics: node.type === 'agent' ? {
              ...(node.data as AgentNodeData).metrics,
              tasksProcessed: ((node.data as AgentNodeData).metrics?.tasksProcessed || 0) + (nodeOutput ? 1 : 0),
              latency: nodeOutput?.executionTime || 0,
              errorRate: hasError ? 100 : 0
            } : undefined
          }
        };
      }));
      setFlowOutputs(outputs);
      setShowOutputPanel(true);
      addFlowOutputsToHistory(outputs);
      localStorage.setItem(LOCALSTORAGE_OUTPUTS_KEY, JSON.stringify(outputs));
      toast({
        title: "Flow Execution Completed",
        description: "Workflow has finished execution"
      });
    } catch (error) {
      console.error("Flow execution error:", error);
      toast({
        title: "Flow Execution Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setNodes(currentNodes => currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: 'error'
        }
      })));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(ns => ns.filter(n => n.id !== nodeId));
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    toast({
      title: "Node Deleted",
      description: `Agent node '${nodeId}' deleted.`
    });
  };

  useEffect(() => {
    if (!localStorage.getItem(LOCALSTORAGE_NODES_KEY)) {
      localStorage.setItem(LOCALSTORAGE_NODES_KEY, JSON.stringify(nodes));
    }
    if (!localStorage.getItem(LOCALSTORAGE_EDGES_KEY)) {
      localStorage.setItem(LOCALSTORAGE_EDGES_KEY, JSON.stringify(edges));
    }
  }, []);

  const toggleOutputPanel = () => {
    setShowOutputPanel(!showOutputPanel);
    if (!showOutputPanel && flowOutputs.length === 0) {
      try {
        const savedOutputs = localStorage.getItem(LOCALSTORAGE_OUTPUTS_KEY);
        if (savedOutputs) {
          setFlowOutputs(JSON.parse(savedOutputs));
        }
      } catch (error) {
        console.error("Failed to load saved outputs:", error);
      }
    }
  };

  const handleAutoLayout = () => {
    const nodeWidth = 180;
    const nodeHeight = 120;
    const spacingX = 60;
    const spacingY = 60;
    const maxCols = 5;
    setNodes(currNodes => {
      return currNodes.map((node, idx) => {
        const col = idx % maxCols;
        const row = Math.floor(idx / maxCols);
        return {
          ...node,
          position: {
            x: 100 + col * (nodeWidth + spacingX),
            y: 100 + row * (nodeHeight + spacingY)
          }
        };
      });
    });
    toast({
      title: "Auto Layout Complete",
      description: "Nodes have been arranged automatically."
    });
  };

  return (
    <div className="h-full w-full rounded-lg border border-gray-800 flex flex-col relative bg-gradient-to-b from-gray-900 to-gray-950">
      {showIntroOverlay && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded shadow-md text-white max-w-md text-center">
            <h2 className="text-xl font-bold mb-2">📘 Welcome to Story Mode</h2>
            <p className="mb-4 text-sm text-slate-300">
              Your canvas is preloaded with an Outline node and Chapter 1 flow.<br />
              Start by editing the outline and clicking “Run Flow.”
            </p>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setShowIntroOverlay(false);
                localStorage.setItem('novelIntroShown', 'true');
              }}
            >
              Let’s Start Writing
            </Button>
          </div>
        </div>
      )}
      <div className="flex-1 relative" style={{ height: 'calc(100% - 2rem)' }}>
        <FlowToolbar 
          onAddNode={handleAddNode} 
          onAutoLayout={handleAutoLayout} 
          onExecuteFlow={handleExecuteFlow} 
          onSaveFlow={handleSaveFlow} 
          onShowCode={() => toast({
            title: "Code View",
            description: "Code export not implemented yet."
          })} 
          onShowSettings={() => setShowSettingsDrawer(true)} 
          onToggleOutputPanel={toggleOutputPanel} 
          isValidated={isValidated} 
          isExecuting={isExecuting} 
          showOutputPanel={showOutputPanel} 
          flowOutputsLength={flowOutputs.length}
          nodeTypes={nodeTypes}
          onInitNovelFlow={handleInitNovelFlow}
          onAddNextChapter={handleAddNextChapter}
          showNovelActions={flowSettings.flowMode === 'novel'}
        />
        <FlowGraph 
          nodes={nodesWithPromptHandler} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onConnect={onConnect} 
          onNodeClick={onNodeClick} 
          onDeleteEdge={handleDeleteEdge}
          setOutlineToView={setOutlineToView}
          setShowOutline={setShowOutline}
          autoScrollToOutline={flowSettings.flowMode === 'novel'}
        >
          {/* Button row for novel mode actions */}
          <Button 
            variant="outline" 
            onClick={handleLoadWorkflow} 
            className="absolute top-2 right-2 z-10 text-gray-300 py-1 bg-indigo-950 hover:bg-indigo-800"
          >
            Load Workflow
          </Button>
        </FlowGraph>

        {selectedNode && selectedNodeData && (
          <>
            <aside className="fixed top-0 right-0 z-40 h-full w-[350px] max-w-[95vw] border-l border-gray-800 bg-gray-900 shadow-lg transition-transform duration-200" style={{
              boxShadow: ' -8px 0 28px -8px rgba(0,0,0,0.36)'
            }} tabIndex={-1}>
              <ConfigurationPanel 
                node={selectedNodeData as Node<AgentNodeData>} 
                onNodeChange={updater => updateNodeData(selectedNode, updater)} 
                onClose={() => setSelectedNode(null)} 
                onDeleteNode={handleDeleteNode} 
              />
            </aside>
            <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSelectedNode(null)} />
          </>
        )}
      </div>

      <FlowOutputPanel outputs={flowOutputs} isVisible={showOutputPanel} onClose={() => setShowOutputPanel(false)} />
      {showOutline && (
        <OutlineViewerPanel
          open={showOutline}
          onClose={() => setShowOutline(false)}
          outline={outlineToView}
        />
      )}
      <SaveAsWorkflowDialog open={workflowDialogOpen} onClose={() => setWorkflowDialogOpen(false)} onSave={doSaveWorkflow} defaultName={activeWorkflow?.name || "My Workflow"} />
      <LoadWorkflowDialog open={loadDialogOpen} onClose={() => setLoadDialogOpen(false)} onLoad={onLoadWorkflow} />
      <SettingsDrawer
        open={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        settings={flowSettings}
        onChange={setFlowSettings}
      />
    </div>
  );
});

FlowView.displayName = "FlowView";
