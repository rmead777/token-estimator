
import { FlowNode } from "./types";

/**
 * Groups nodes in topological order for DAG execution.
 * Returns an array of levels, each a list of nodes.
 * Includes cycle detection to prevent infinite recursion.
 */
export function resolveDAG(flowNodes: FlowNode[]): FlowNode[][] {
  const levels: FlowNode[][] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();  // Track nodes in current recursion path
  const idToNode: Record<string, FlowNode> = Object.fromEntries(flowNodes.map(n => [n.id, n]));

  function visit(nodeId: string, level = 0) {
    // Check for cycles
    if (visiting.has(nodeId)) {
      throw new Error(`Cycle detected in flow: node ${nodeId} is part of a circular dependency`);
    }
    
    // Skip if already processed in another path
    if (visited.has(nodeId)) return;
    
    // Mark as being visited in current path
    visiting.add(nodeId);
    
    // Create level array if it doesn't exist
    if (!levels[level]) levels[level] = [];
    
    // Add to current level
    levels[level].push(idToNode[nodeId]);
    
    // Find nodes that depend on this node
    const dependents = flowNodes.filter(n => n.inputNodeIds?.includes(nodeId));
    
    // Process dependent nodes
    for (const dep of dependents) {
      visit(dep.id, level + 1);
    }
    
    // Mark as fully visited
    visited.add(nodeId);
    
    // Remove from current path
    visiting.delete(nodeId);
  }

  // Start with root nodes (no inputs)
  const roots = flowNodes.filter(n => !n.inputNodeIds || n.inputNodeIds.length === 0);
  
  // Process each root node
  for (const root of roots) visit(root.id, 0);
  
  // Check if all nodes were visited
  if (visited.size < flowNodes.length) {
    const unreachableNodes = flowNodes
      .filter(node => !visited.has(node.id))
      .map(node => node.id)
      .join(', ');
    
    throw new Error(`Unreachable nodes detected: ${unreachableNodes}`);
  }

  return levels;
}
