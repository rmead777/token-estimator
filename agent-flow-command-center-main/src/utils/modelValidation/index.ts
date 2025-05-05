
export { validateModelRegistryConsistency } from "./registry";
export { validateAdapterImplementations } from "./adapters";
export { validateConfigurationCompatibility } from "./config";
export { validateFlowNodeConfig } from "./flowNode";
export { validateBeforeExecution } from "./beforeExecution";

// Compound validator (preserved public API)
import { validateModelRegistryConsistency } from "./registry";
import { validateAdapterImplementations } from "./adapters";
import { validateConfigurationCompatibility } from "./config";

/**
 * Run all validations and return combined results
 */
export function validateModelSystem(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const registryResults = validateModelRegistryConsistency();
  const adapterResults = validateAdapterImplementations();
  const configResults = validateConfigurationCompatibility();
  
  const allErrors = [
    ...registryResults.errors,
    ...adapterResults.errors,
    ...configResults.errors
  ];
  
  const allWarnings = [
    ...configResults.warnings
  ];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}
