
import { ModelAdapter } from "./ModelAdapter";

export class CohereAdapter implements ModelAdapter {
  modelName: string;
  providerName = "Cohere";
  supportedFeatures = ["text"];

  constructor(modelName = "command-r-plus") {
    this.modelName = modelName;
  }

  buildRequest(input: string, config: any) {
    return {
      model: this.modelName,
      message: input,
      preamble: config.systemPrompt || "You are a helpful AI assistant.",
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 512,
    };
  }

  parseResponse(response: any) {
    return {
      output: response.generations?.[0]?.text || "",
      usage: response.meta?.usage || {},
      raw: response
    };
  }

  validateConfig(config: any) {
    return (
      typeof config === 'object' && 
      (config.temperature === undefined || (typeof config.temperature === "number" && config.temperature >= 0 && config.temperature <= 1)) &&
      (config.maxTokens === undefined || (typeof config.maxTokens === "number" && config.maxTokens > 0))
    );
  }

  getDefaultConfig() {
    return {
      temperature: 0.7,
      maxTokens: 512,
      systemPrompt: "You are a helpful AI assistant."
    };
  }
}
