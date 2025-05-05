
import { adapterRegistry } from "../../adapters/adapterRegistry";

// 2. Adapter Interface Validation
export function validateAdapterImplementations(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  Object.entries(adapterRegistry).forEach(([modelId, adapter]) => {
    // Check required properties
    if (!adapter.modelName) errors.push(`Model "${modelId}" adapter is missing modelName property`);
    if (!adapter.providerName) errors.push(`Model "${modelId}" adapter is missing providerName property`);
    if (!adapter.supportedFeatures || !Array.isArray(adapter.supportedFeatures)) {
      errors.push(`Model "${modelId}" adapter is missing supportedFeatures array`);
    }
    
    // Check required methods
    if (!adapter.buildRequest || typeof adapter.buildRequest !== 'function') {
      errors.push(`Model "${modelId}" adapter is missing buildRequest method`);
    }
    if (!adapter.parseResponse || typeof adapter.parseResponse !== 'function') {
      errors.push(`Model "${modelId}" adapter is missing parseResponse method`);
    }
    if (!adapter.validateConfig || typeof adapter.validateConfig !== 'function') {
      errors.push(`Model "${modelId}" adapter is missing validateConfig method`);
    }
    if (!adapter.getDefaultConfig || typeof adapter.getDefaultConfig !== 'function') {
      errors.push(`Model "${modelId}" adapter is missing getDefaultConfig method`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
