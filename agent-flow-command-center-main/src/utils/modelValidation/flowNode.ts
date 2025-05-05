import { adapterRegistry } from "../../adapters/adapterRegistry";

/**
 * Validate a flow node's configuration against its model adapter
 */
export function validateFlowNodeConfig(
  modelId: string | undefined,
  config: Record<string, any> | undefined
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!modelId) {
    errors.push("Flow node is missing modelId");
    return { isValid: false, errors };
  }

  const adapter = adapterRegistry[modelId];
  if (!adapter) {
    errors.push(`Flow node has invalid modelId: "${modelId}"`);
    return { isValid: false, errors };
  }

  if (!config) {
    return { isValid: true, errors: [] };
  }

  const defaultConfig = adapter.getDefaultConfig();
  // Allow these generic flow configuration keys
  const extraAllowedKeys = ['streamResponse', 'retryOnError', 'label'];
  for (const [key, value] of Object.entries(config)) {
    // Allow and skip type checks for generic flow keys
    if (extraAllowedKeys.includes(key)) {
      continue;
    }
    if (!(key in defaultConfig)) {
      errors.push(`Unknown configuration key: "${key}"`);
    } else if (typeof value !== typeof defaultConfig[key]) {
      errors.push(`Invalid type for key "${key}": expected ${typeof defaultConfig[key]}, got ${typeof value}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}
