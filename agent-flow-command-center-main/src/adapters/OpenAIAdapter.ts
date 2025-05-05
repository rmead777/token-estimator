
import { ModelAdapter } from "./ModelAdapter";

export class OpenAIAdapter implements ModelAdapter {
  modelName: string;
  providerName = "OpenAI";
  supportedFeatures = ["text", "images", "web_search"];

  constructor(modelName = "gpt-4o") {
    this.modelName = modelName;
  }

  buildRequest(input: string, config: any) {
    // Base request configuration
    const request: any = {
      model: this.modelName,
      messages: [
        { role: "system", content: config.systemPrompt || "You are helpful." },
        { role: "user", content: input }
      ],
      temperature: config.temperature ?? 0.7,
    };

    // For o3, o3-mini, and o4-mini models, use max_completion_tokens
    if (["o3", "o3-mini", "o4-mini"].includes(this.modelName)) {
      request.max_completion_tokens = config.maxTokens ?? 512;
    } else {
      // For other models, use max_tokens
      request.max_tokens = config.maxTokens ?? 512;
    }

    // Add web search tool if enabled and model supports it
    if (config.enableWebSearch && ["gpt-4.1", "gpt-4.1-mini-2025-04-14"].includes(this.modelName)) {
      request.tools = [{
        type: "function",
        function: {
          name: "web_search",
          description: "Search the web for relevant information",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }];
    }

    return request;
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
      systemPrompt: "You are a helpful assistant.",
      enableWebSearch: false
    };
  }
}
