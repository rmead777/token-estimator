
import { ModelAdapter } from "./ModelAdapter";

/**
 * MockAdapter simulates a model for UI and logic testing without API calls.
 */
export class MockAdapter implements ModelAdapter {
  modelName = "mock-model";
  providerName = "Mock";
  supportedFeatures = ["test"];

  buildRequest(input: any, config: any) {
    return { input, config };
  }

  parseResponse(response: any) {
    return {
      output: `[Simulated output for: ${response.input}]`,
      usage: {}
    };
  }

  validateConfig(config: any) {
    return true;
  }

  getDefaultConfig() {
    return {};
  }
}
