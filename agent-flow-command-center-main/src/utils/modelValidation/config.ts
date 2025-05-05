
import { adapterRegistry } from "../../adapters/adapterRegistry";
import { ModelAdapter } from "../../adapters/ModelAdapter";

// 3. Configuration Compatibility
export function validateConfigurationCompatibility(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Group adapters by provider
  const adaptersByProvider = new Map<string, ModelAdapter[]>();
  
  Object.values(adapterRegistry).forEach(adapter => {
    if (!adaptersByProvider.has(adapter.providerName)) {
      adaptersByProvider.set(adapter.providerName, []);
    }
    adaptersByProvider.get(adapter.providerName)?.push(adapter);
  });
  
  // Check configuration consistency within each provider
  adaptersByProvider.forEach((adapters, providerName) => {
    if (adapters.length <= 1) return; // Skip providers with only one model
    
    const firstAdapter = adapters[0];
    const firstConfig = firstAdapter.getDefaultConfig();
    const firstConfigKeys = Object.keys(firstConfig);
    
    adapters.slice(1).forEach(adapter => {
      const config = adapter.getDefaultConfig();
      const configKeys = Object.keys(config);
      
      // Check for missing keys
      firstConfigKeys.forEach(key => {
        if (!configKeys.includes(key)) {
          warnings.push(`Model "${adapter.modelName}" from "${providerName}" is missing config key "${key}" that other models have`);
        } else if (typeof firstConfig[key] !== typeof config[key]) {
          errors.push(`Model "${adapter.modelName}" from "${providerName}" has config key "${key}" with type ${typeof config[key]}, expected ${typeof firstConfig[key]}`);
        }
      });
      
      // Check for extra keys
      configKeys.forEach(key => {
        if (!firstConfigKeys.includes(key)) {
          warnings.push(`Model "${adapter.modelName}" from "${providerName}" has extra config key "${key}" that other models don't have`);
        }
      });
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
