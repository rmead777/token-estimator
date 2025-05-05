
import { toast } from "@/components/ui/use-toast";
import { validateFlowNodeConfig } from "./flowNode";

/**
 * Utility function to run validation before flow execution
 */
export function validateBeforeExecution(nodes: any[]): boolean {
  // This function can be called before executing a flow
  let isValid = true;
  const validationErrors: string[] = [];
  
  nodes.forEach(node => {
    if (node.type === 'model' && node.modelId) {
      const nodeValidation = validateFlowNodeConfig(node.modelId, node.config);
      if (!nodeValidation.isValid) {
        isValid = false;
        validationErrors.push(
          `Node "${node.id}" has invalid configuration: ${nodeValidation.errors.join(', ')}`
        );
      }
    }
  });
  
  if (!isValid) {
    validationErrors.forEach(error => {
      toast({
        title: "Flow Validation Error",
        description: error,
        variant: "destructive"
      });
    });
  }
  
  return isValid;
}
