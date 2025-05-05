
import { ModelAdapter } from "./ModelAdapter";

export class AnthropicAdapter implements ModelAdapter {
  modelName: string;
  providerName = "Anthropic";
  supportedFeatures = ["text"];

  // Model-specific token limits
  private static modelTokenLimits: Record<string, number> = {
    'claude-3-7-sonnet-20250219': 16384,
    'claude-3-opus-20240229': 32768,
    'claude-3-sonnet-20240229': 16384,
    'claude-3-haiku-20240307': 4096
  };

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  buildRequest(input: string, config: any) {
    // Get the model's token limit or use a safe default
    const modelTokenLimit = AnthropicAdapter.modelTokenLimits[this.modelName] || 4096;
    
    // Ensure maxTokens doesn't exceed the model's limit
    const safeMaxTokens = Math.min(config.maxTokens ?? 1024, modelTokenLimit);
    
    console.log(`Building Anthropic request for ${this.modelName} with maxTokens: ${safeMaxTokens} (limit: ${modelTokenLimit})`);
    
    return {
      model: this.modelName,
      system: config.systemPrompt || "You are Claude, a helpful AI assistant.",
      messages: [
        { role: "user", content: input }
      ],
      max_tokens: safeMaxTokens,
      temperature: config.temperature ?? 0.7
    };
  }

  parseResponse(response: any) {
    console.log('Raw Anthropic response:', response);
    
    // Check for the new response format structure
    if (response?.choices?.[0]?.message?.content) {
      const content = response.choices[0].message.content;
      console.log('Parsed content from choices format:', content);
      return {
        output: content,
        usage: response.usage || {},
        raw: response
      };
    }
    
    // Check for the alternative content array format
    if (response?.content && Array.isArray(response.content)) {
      const textContent = response.content.find(item => item.type === 'text');
      const content = textContent?.text || "";
      console.log('Parsed content from content array format:', content);
      return {
        output: content,
        usage: response.usage || {},
        raw: response
      };
    }
    
    console.error('Invalid Anthropic response structure:', response);
    return {
      output: "",
      usage: {},
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
    // Set a safer default maxTokens value
    return {
      temperature: 0.7,
      maxTokens: 4096, // Reduced from 1024 to ensure it stays within limits
      systemPrompt: "You are Claude, a helpful AI assistant."
    };
  }
}
