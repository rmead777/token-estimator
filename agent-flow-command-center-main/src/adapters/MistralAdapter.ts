
import { ModelAdapter } from "./ModelAdapter";

export class MistralAdapter implements ModelAdapter {
  modelName: string;
  providerName = "Mistral";
  supportedFeatures = ["text"];

  constructor(modelName = "mistral-large") {
    this.modelName = modelName;
  }

  buildRequest(input: string, config: any) {
    return {
      model: this.modelName,
      messages: [
        { role: "system", content: config.systemPrompt || "You are a helpful AI assistant." },
        { role: "user", content: input }
      ],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 512,
    };
  }

  parseResponse(response: any) {
    return {
      output: response.choices?.[0]?.message?.content || "",
      usage: response.usage || {},
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
