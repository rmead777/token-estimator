
import { adapterRegistry } from "../../adapters/adapterRegistry";
import { PROVIDERS } from "../../pages/api-keys/apiKeyProviders";

// 1. Registry Consistency  
export function validateModelRegistryConsistency(): { 
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Build map of all models from PROVIDERS (case-insensitive)
  const providerModels = new Map<string, Map<string, string>>();
  
  // First, collect all models and their original casing
  PROVIDERS.forEach(provider => {
    if (!providerModels.has(provider.name)) {
      providerModels.set(provider.name, new Map());
    }
    
    const modelsMap = providerModels.get(provider.name)!;
    provider.models.forEach(model => {
      modelsMap.set(model.toLowerCase(), model);
    });
  });
  
  // Check if all models in adapterRegistry are in PROVIDERS (case-insensitive)
  Object.entries(adapterRegistry).forEach(([modelId, adapter]) => {
    const providerModelsMap = providerModels.get(adapter.providerName);
    
    if (!providerModelsMap) {
      errors.push(`Model "${modelId}" has provider "${adapter.providerName}" which is not in the PROVIDERS list`);
    } else {
      // Check if the model exists in provider's models (case-insensitive)
      const modelLowerCase = modelId.toLowerCase();
      if (!providerModelsMap.has(modelLowerCase)) {
        errors.push(`Model "${modelId}" from provider "${adapter.providerName}" is in adapter registry but missing from PROVIDERS list`);
      }
    }
  });
  
  // Check if all models in PROVIDERS are in adapterRegistry
  PROVIDERS.forEach(provider => {
    provider.models.forEach(model => {
      // Try exact match first
      if (!adapterRegistry[model]) {
        // Try case-insensitive match
        const matchFound = Object.keys(adapterRegistry).some(
          regModel => regModel.toLowerCase() === model.toLowerCase() && 
                      adapterRegistry[regModel].providerName === provider.name
        );
        
        if (!matchFound) {
          errors.push(`Model "${model}" from provider "${provider.name}" is missing in adapter registry`);
        }
      } else if (adapterRegistry[model].providerName !== provider.name) {
        errors.push(`Model "${model}" has inconsistent provider name: "${adapterRegistry[model].providerName}" in registry vs "${provider.name}" in providers list`);
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
