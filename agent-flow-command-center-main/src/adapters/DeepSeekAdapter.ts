import { ModelAdapter } from "./ModelAdapter";

export class DeepSeekAdapter implements ModelAdapter {
  modelName: string;
  providerName = "DeepSeek";
  supportedFeatures = ["text"];
  constructor(modelName: string) {
    // Normalize model name to lowercase
    this.modelName = modelName.toLowerCase();
  }
  buildRequest(input: string, config: any) {
    // Map to API-recognized model identifiers
    let apiModel: string;
    if (this.modelName.includes('v3')) {
      apiModel = 'deepseek-chat';
    } else if (this.modelName.includes('r1')) {
      apiModel = 'deepseek-reasoner';
    } else {
      apiModel = this.modelName;
    }
    return {
      model: apiModel,
      messages: [
        { role: "system", content: config.systemPrompt || "You are helpful." },
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
      systemPrompt: "You are a helpful assistant."
    };
  }
}
