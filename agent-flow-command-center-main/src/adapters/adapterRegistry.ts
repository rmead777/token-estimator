import { ModelAdapter } from "./ModelAdapter";
import { OpenAIAdapter } from "./OpenAIAdapter";
import { AnthropicAdapter } from "./AnthropicAdapter";
import { GoogleAdapter } from "./GoogleAdapter";
import { MistralAdapter } from "./MistralAdapter";
import { CohereAdapter } from "./CohereAdapter";
import { XAIAdapter } from "./XAIAdapter";
import { DeepSeekAdapter } from "./DeepSeekAdapter";
import { MockAdapter } from "./MockAdapter";
import { PerplexityAdapter } from "./PerplexityAdapter";
import { TogetherAdapter } from "./TogetherAdapter";

// Register all provider models
export const adapterRegistry: Record<string, ModelAdapter> = {
  // OpenAI Models
  "gpt-4o": new OpenAIAdapter("gpt-4o"),
  "gpt-4.1": new OpenAIAdapter("gpt-4.1"),
  "gpt-4o-mini": new OpenAIAdapter("gpt-4o-mini"),
  "gpt-4.5-preview": new OpenAIAdapter("gpt-4.5-preview"),
  "gpt-4.1-mini-2025-04-14": new OpenAIAdapter("gpt-4.1-mini-2025-04-14"),
  // OpenAI o-models with normalized IDs
  "o3": new OpenAIAdapter("o3"),
  "o3-mini": new OpenAIAdapter("o3-mini"),
  "o4-mini": new OpenAIAdapter("o4-mini"),

  // Anthropic Models with latest IDs
  "claude-3-7-sonnet-20250219": new AnthropicAdapter("claude-3-7-sonnet-20250219"),
  // Legacy alias without date for backward compatibility
  "claude-3.7-sonnet": new AnthropicAdapter("claude-3-7-sonnet-20250219"),

  // Google Gemini Models with correct model names
  "gemini-2.5-flash-preview-04-17": new GoogleAdapter("gemini-2.5-flash-preview-04-17"),
  "gemini-2.5-pro-preview-03-25": new GoogleAdapter("gemini-2.5-pro-preview-03-25"),
  "gemini-2.0-flash": new GoogleAdapter("gemini-2.0-flash"),
  "gemini-2.0-flash-lite": new GoogleAdapter("gemini-2.0-flash-lite"),
  "gemini-1.5-flash": new GoogleAdapter("gemini-1.5-flash"),
  "gemini-1.5-flash-8b": new GoogleAdapter("gemini-1.5-flash-8b"),
  "gemini-1.5-pro": new GoogleAdapter("gemini-1.5-pro"),
  
  // Mistral Models
  "mistral-large": new MistralAdapter("mistral-large"),
  "mistral-medium": new MistralAdapter("mistral-medium"),
  "mistral-small": new MistralAdapter("mistral-small"),
  
  // Cohere Models
  "command-r": new CohereAdapter("command-r"),
  "command-r-plus": new CohereAdapter("command-r-plus"),
  "command-light": new CohereAdapter("command-light"),

  // XAI Models normalized to lowercase
  "grok-3-beta": new XAIAdapter("grok-3-beta"),
  "grok-3-mini-beta": new XAIAdapter("grok-3-mini-beta"),
  // Keep legacy uppercase versions for backward compatibility
  "Grok-3-beta": new XAIAdapter("grok-3-beta"),
  "Grok-3-mini-beta": new XAIAdapter("grok-3-mini-beta"),

  // DeepSeek Models normalized
  "deepseek-r1": new DeepSeekAdapter("deepseek-r1"),
  "deepseek-v3-0324": new DeepSeekAdapter("deepseek-v3-0324"),
  // Keep legacy versions for backward compatibility
  "DeepSeek-R1": new DeepSeekAdapter("deepseek-r1"),
  "DeepSeek-V3-0324": new DeepSeekAdapter("deepseek-v3-0324"),
  
  // Mock Model
  "mock-model": new MockAdapter(),
  
  // Perplexity Models
  "sonar-pro": new PerplexityAdapter("sonar-pro"),
  "sonar-deep-research": new PerplexityAdapter("sonar-deep-research"),
  
  // Together AI Models
  "llama-4-maverick-instruct": new TogetherAdapter("llama-4-maverick-instruct"),
  "llama-4-scout-instruct": new TogetherAdapter("llama-4-scout-instruct"),
};

// Utility function to get all available models by provider
export function getModelsByProvider(): Record<string, string[]> {
  const providers: Record<string, string[]> = {};
  
  Object.entries(adapterRegistry).forEach(([modelId, adapter]) => {
    if (!providers[adapter.providerName]) {
      providers[adapter.providerName] = [];
    }
    providers[adapter.providerName].push(modelId);
  });
  
  return providers;
}

// Get an adapter by model ID
export function getAdapter(modelId: string): ModelAdapter | undefined {
  return adapterRegistry[modelId];
}

// Get all adapters by provider name
export function getAdaptersByProvider(providerName: string): ModelAdapter[] {
  return Object.values(adapterRegistry).filter(adapter => 
    adapter.providerName === providerName
  );
}
