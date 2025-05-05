
import { adapterRegistry } from "../adapters/adapterRegistry";
import { MockAdapter } from "../adapters/MockAdapter";
import { FlowNode } from "./types";
import { resolveDAG } from "./resolveDAG";
import { FlowOutput } from "@/components/flow/FlowOutputPanel";
import { toast } from "@/components/ui/use-toast";

/**
 * Simulates flow execution across nodes using adapters (MockAdapter if unavailable).
 * @param flowNodes The nodes describing the computation flow.
 * @param inputs The initial input context, keyed by node id.
 * @returns Object containing final node outputs as a context object and an array of all outputs.
 */
export async function runSimulatedFlow(
  flowNodes: FlowNode[],
  inputs: Record<string, any>
): Promise<{
  context: Record<string, any>;
  outputs: FlowOutput[];
}> {
  try {
    // Resolve the DAG and catch any cycle detection errors
    const dagLevels = resolveDAG(flowNodes);
    const context: Record<string, any> = { ...inputs };
    const outputs: FlowOutput[] = [];
    
    // Create a single mock adapter instance for consistent simulation
    const mockAdapter = new MockAdapter();

    for (const level of dagLevels) {
      for (const node of level) {
        const startTime = performance.now();
        
        // Gather inputs from previous nodes
        const inputData = (node.inputNodeIds || []).map(id => context[id]);
        
        try {
          // For simulation, we use the mock adapter for consistent behavior
          // but we still get the correct node configuration from the actual adapter
          const actualAdapter = 
            (node.modelId && adapterRegistry[node.modelId]) ||
            adapterRegistry["mock-model"];
          
          // Build the request using the actual adapter's configuration
          const request = actualAdapter.buildRequest(inputData, node.config || {});
          
          // But use the mock adapter to parse the response
          const fakeResponse = mockAdapter.parseResponse({
            model: node.modelId || "mock-model",
            input: JSON.stringify(inputData),
            config: node.config
          });
          
          // Store the result in context for next nodes
          context[node.id] = fakeResponse.output;
          
          // Calculate execution time
          const endTime = performance.now();
          const executionTime = Math.round(endTime - startTime);
          
          // Find the label for this node
          const nodeInfo = flowNodes.find(fn => fn.id === node.id);
          
          // Track the output for UI display
          outputs.push({
            nodeId: node.id,
            nodeName: nodeInfo?.config?.label || `Node ${node.id}`,
            nodeType: node.type,
            modelId: node.modelId,
            timestamp: new Date().toISOString(),
            input: inputData,
            output: fakeResponse.output,
            executionTime
          });
        } catch (error) {
          console.error(`Error executing node ${node.id}:`, error);
          
          // Store error in context
          context[node.id] = `Error: ${error.message || "Unknown error"}`;
          
          // Track the error for UI display
          outputs.push({
            nodeId: node.id,
            nodeName: flowNodes.find(fn => fn.id === node.id)?.config?.label || `Node ${node.id}`,
            nodeType: "error", // Mark as error type
            modelId: node.modelId,
            timestamp: new Date().toISOString(),
            input: inputData,
            output: `Error: ${error.message || "Unknown error"}`,
            executionTime: Math.round(performance.now() - startTime)
          });
        }
      }
    }

    return { context, outputs };
  } catch (error) {
    // Handle DAG errors (cycles, unreachable nodes)
    toast({
      title: "Flow Execution Error",
      description: error.message || "Unknown error in flow execution",
      variant: "destructive"
    });
    
    // Return empty results with the error
    return { 
      context: {}, 
      outputs: [{
        nodeId: "error",
        nodeName: "Flow Engine",
        nodeType: "error",
        timestamp: new Date().toISOString(),
        input: null,
        output: `Error: ${error.message || "Unknown flow execution error"}`
      }]
    };
  }
}
