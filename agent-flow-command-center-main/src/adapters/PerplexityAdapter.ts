
import { ModelAdapter } from "./ModelAdapter";

export class PerplexityAdapter implements ModelAdapter {
  modelName: string;
  providerName = "Perplexity";
  supportedFeatures = ["text", "web_search"];

  constructor(modelId: string) {
    this.modelName = modelId;
  }

  buildRequest(input: string, config: any) {
    return {
      model: this.modelName,
      messages: [
        { role: "system", content: config.systemPrompt || "You are a helpful assistant." },
        { role: "user", content: input }
      ],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 8000,
      top_p: 0.9,
      return_images: false,
      return_related_questions: false,
      frequency_penalty: 1,
      presence_penalty: 0
    };
  }

  parseResponse(response: any) {
    return {
      output: response.choices?.[0]?.message?.content || "",
      usage: response.usage || {},
      citations: response.citations || [],
      raw: response
    };
  }

  validateConfig(config: any) {
    return (
      typeof config === 'object' && 
      (config.systemPrompt === undefined || typeof config.systemPrompt === 'string') &&
      (config.temperature === undefined || (typeof config.temperature === 'number' && config.temperature >= 0 && config.temperature <= 1)) &&
      (config.maxTokens === undefined || (typeof config.maxTokens === 'number' && config.maxTokens > 0))
    );
  }

  getDefaultConfig() {
    return {
      systemPrompt: "You are a helpful assistant.",
      temperature: 0.7,
      maxTokens: 8000,
      enableWebSearch: true
    };
  }
}
