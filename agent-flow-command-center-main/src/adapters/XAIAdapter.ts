import { ModelAdapter } from "./ModelAdapter";

export class XAIAdapter implements ModelAdapter {
  modelName: string;
  providerName = "XAI";
  supportedFeatures = ["text"];
  baseUrl = "https://api.x.ai/v1";

  constructor(modelName: string) {
    // Map model names to their API equivalents
    const modelMap: { [key: string]: string } = {
      "grok-3-beta": "grok-3-latest",
      "grok-3-mini-beta": "grok-3-mini-latest",
      // Keep legacy uppercase versions mapped
      "Grok-3-beta": "grok-3-latest",
      "Grok-3-mini-beta": "grok-3-mini-latest"
    };

    // Use mapped model name or the original if not found
    this.modelName = modelMap[modelName] || modelName;
  }

  buildRequest(input: string, config: any) {
    return {
      model: this.modelName,
      messages: [
        { role: "system", content: config.systemPrompt || "You are helpful." },
        { role: "user", content: input }
      ],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 512,
    };
  }

  parseResponse(response: any) {
    // Handle potential error responses
    if (response.error) {
      throw new Error(`XAI API Error: ${response.error.message || 'Unknown error'}`);
    }

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
