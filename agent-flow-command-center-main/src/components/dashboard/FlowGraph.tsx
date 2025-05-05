import React, { useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Panel,
  Connection,
  NodeMouseHandler,
  Node,
  Edge,
  useReactFlow,
  EdgeProps,
  EdgeLabelRenderer,
  useStore,
  getBezierPath,
} from "@xyflow/react";
import { AgentNode } from "@/components/flow/AgentNode";
import { InputPromptNode } from "@/components/flow/InputPromptNode";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { X } from "lucide-react";

import "@xyflow/react/dist/style.css";

interface BaseNodeData {
  label: string;
  type: string;
  status?: "active" | "idle" | "error";
  color?: string;
  [key: string]: any;
}

interface AgentNodeData extends BaseNodeData {
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
}

interface InputPromptNodeData extends BaseNodeData {
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
}

type FlowNodeData = AgentNodeData | InputPromptNodeData;

const nodeTypes = {
  agent: AgentNode,
  inputPrompt: InputPromptNode,
};

interface FlowGraphProps {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: (params: Connection) => void;
  onNodeClick: NodeMouseHandler<Node<FlowNodeData>>;
  onDeleteEdge: (edgeId: string) => void;
  children?: React.ReactNode;
  setOutlineToView?: React.Dispatch<React.SetStateAction<any[]>>;
  setShowOutline?: React.Dispatch<React.SetStateAction<boolean>>;
  autoScrollToOutline?: boolean;
}

function DeletableEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style } = props;
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((edges: Edge[]) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <path
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 1000,
          }}
          className="nodrag nopan"
        >
          <button
            className="flex items-center justify-center w-5 h-5 bg-gray-700 text-white rounded-full border border-gray-500 hover:bg-red-600 transition-colors"
            title="Delete connection"
            onClick={handleDelete}
            aria-label="Delete edge"
          >
            <X size={12} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function AutoScrollToOutline({ nodes, enabled }: { nodes: any[]; enabled: boolean }) {
  const reactFlowInstance = useReactFlow();
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (
      enabled &&
      nodes.find(n => n.id === 'outline') &&
      !scrolledRef.current
    ) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.3 });
        reactFlowInstance.setCenter(100, 50);
        scrolledRef.current = true;
      }, 250);
    }
  }, [enabled, nodes, reactFlowInstance]);
  return null;
}

const edgeTypes = {
  deletable: DeletableEdge,
};

export const FlowGraph: React.FC<FlowGraphProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onDeleteEdge,
  children,
  setOutlineToView,
  setShowOutline,
  autoScrollToOutline,
}) => {
  const mappedEdges = edges.map((edge) => ({
    ...edge,
    type: "deletable",
  }));

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={mappedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-[#0F0F1A]"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        defaultEdgeOptions={{ animated: true }}
      >
        <AutoScrollToOutline nodes={nodes} enabled={!!autoScrollToOutline} />
        <Controls className="bg-gray-800 text-white" />
        <MiniMap
          nodeColor={(node) => {
            const nodeData = node.data as FlowNodeData;
            if (nodeData?.color) {
              return nodeData.color;
            }
            switch (nodeData.type) {
              case "input":
                return "#6366f1";
              case "action":
                return "#8b5cf6";
              case "response":
                return "#10b981";
              case "inputPrompt":
                return "#3b82f6";
              default:
                return "#64748b";
            }
          }}
          maskColor="rgba(15, 15, 26, 0.8)"
          className="bg-gray-800"
        />
        <Background color="#333" gap={16} />
        {children}
      </ReactFlow>
    </div>
  );
};
