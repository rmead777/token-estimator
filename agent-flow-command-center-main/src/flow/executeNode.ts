import { FlowNode } from "./types";
import { getAdapter } from "../adapters/adapterRegistry";
import { toast } from "@/components/ui/use-toast";
import { validateFlowNodeConfig } from "../utils/modelValidation";
import { supabase } from "@/integrations/supabase/client";
import { executeModel } from "@/api/executeApi";
import { logger } from "../lib/utils"; // Corrected logger import to use named import
import { chapterPrompt, dialoguePrompt, summaryPrompt, retroinjectPrompt } from "@/lib/prompts/novel";
import { executeModel as runModelWithPrompt } from "@/api/executeApi"; // Add this import for model execution
import { adapterRegistry } from "../adapters/adapterRegistry"; // Import adapterRegistry directly
import { extractOutlineFromModelOutput } from '@/lib/parsers/extractOutlineFromModelOutput';
import { mergeNarrativeMemory, NarrativeMemory } from '@/lib/memory';
import { useDebugStore } from "@/lib/debugStore";
import { getOutlineEntryForChapter } from '../lib/parsers/getOutlineEntryForChapter';

/**
 * Renamed the locally defined processInput function to avoid conflict
 */
function localProcessInput(input: any): string {
  if (Array.isArray(input)) {
    return input
      .map(item => {
        if (item && typeof item === 'object') {
          return 'output' in item && item.output !== undefined
            ? typeof item.output === 'string'
              ? item.output
              : JSON.stringify(item.output)
            : JSON.stringify(item);
        }
        return String(item || "");
      })
      .filter(Boolean)
      .join("\n");
  } else if (input && typeof input === 'object') {
    return 'output' in input && input.output !== undefined
      ? typeof input.output === 'string'
        ? input.output
        : JSON.stringify(input.output)
      : JSON.stringify(input);
  } else if (input === undefined || input === null) {
    return "";
  } else if (typeof input !== 'string') {
    return String(input);
  }
  return input;
}

// Utility to extract a JSON array from a string, stripping markdown wrappers
export function extractJsonArrayFromString(input: string): any[] | undefined {
  // Remove code fence if present
  const cleaned = input.trim().replace(/^```json/, '').replace(/```$/, '').trim();
  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');

  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) {
    console.warn('[Outline Parser] No valid array structure found');
    return undefined;
  }

  try {
    const slice = cleaned.slice(arrayStart, arrayEnd + 1);
    return JSON.parse(slice);
  } catch (err) {
    console.warn('[Outline Parser] JSON.parse failed:', err);
    return undefined;
  }
}

// Safe parse for outline, handling double-encoded arrays and fallback
function safeParseOutline(raw: string): any[] | undefined {
  try {
    const once = JSON.parse(raw);
    if (Array.isArray(once)) return once;
    if (typeof once === 'string') return JSON.parse(once); // handles double-wrapped string
  } catch {}
  return extractJsonArrayFromString(raw);
}

// Helper: Compose narrative memory as text for prompt
function composeNarrativeMemoryText(memory: any): string {
  if (!memory) return '';
  let text = '';
  if (memory.characterArcs) {
    text += 'Character Arcs:\n' + JSON.stringify(memory.characterArcs, null, 2) + '\n';
  }
  if (memory.emotionalTone) {
    text += 'Emotional Tone: ' + memory.emotionalTone + '\n';
  }
  if (memory.openThreads) {
    text += 'Open Threads: ' + JSON.stringify(memory.openThreads, null, 2) + '\n';
  }
  if (memory.worldState) {
    text += 'World State: ' + memory.worldState + '\n';
  }
  return text.trim();
}

// Compose narrative memory for chapter prompt
function composeNarrativeMemory(memory: any): string {
  return `
Character Arcs: ${JSON.stringify(memory.characterArcs || {}, null, 2)}
Emotional Tone: ${memory.emotionalTone || 'neutral'}
Open Threads: ${(memory.openThreads || []).join(', ') || 'none'}
World State: ${memory.worldState || 'unchanged'}
  `.trim();
}

// Helper: Extract chapter number from label
function extractChapterNumberFromLabel(label: string): number {
  const match = label.match(/chapter\s*(\d+)/i);
  if (match) return parseInt(match[1]);
  const match2 = label.match(/ch(\d+)/i);
  if (match2) return parseInt(match2[1]);
  return 1;
}

// Helper: Bulletproof JSON extractor
function extractJsonFromText(text: string): any {
  const jsonRegex = /```json\s*([\s\S]+?)\s*```|({[\s\S]+})/;
  const match = jsonRegex.exec(text);
  if (!match) return null;
  try {
    return JSON.parse(match[1] || match[2]);
  } catch (err) {
    console.warn("Failed to parse JSON from matched text", err);
    return null;
  }
}

// --- Novel Mode Helpers ---
const defaultMaxTokensByNodeKind: Record<string, number> = {
  chapter: 2048,
  summary: 1024,
  dialogue: 1024,
  retroinject: 1024,
  outline: 2048,
};

const modelTokenLimit: Record<string, number> = {
  'claude-3-7-sonnet-20250219': 16384,
  'gpt-4o': 128000,
  // Add more as needed
};

function getPromptForNodeKind(kind: string, input: any) {
  switch (kind) {
    case 'chapter': return chapterPrompt(input);
    case 'dialogue': return dialoguePrompt(input);
    case 'summary': return summaryPrompt(input);
    case 'retroinject': return retroinjectPrompt(input);
    case 'outline': return input.prompt || '';
    default: return 'Write something creative.';
  }
}

function updateNarrativeMemory(kind: string, memory: any) {
  if (kind === 'chapter') {
    return { ...memory, scarPresent: true }; // example logic
  }
  return memory;
}

// Centralized input shaping helper
function buildInputObject(node: FlowNode, nodeKind: string, inputs: any[], memory: any) {
  switch (nodeKind) {
    case 'summary': {
      const raw = inputs[0];
      const chapterText =
        typeof raw === 'string' ? raw :
        (typeof raw === 'object' && typeof raw.output === 'string') ? raw.output :
        (typeof raw === 'object' && typeof raw.output?.output === 'string') ? raw.output.output :
        '';
      console.log('[DEBUG] buildInputObject() for summary node');
      console.log('  → raw:', raw);
      console.log('  → chapterText:', chapterText);
      return {
        chapterText,
        memory // use the function parameter, not mergedMemory
      };
    }
    case 'retroinject':
      return { priorSummaries: inputs, memory };
    case 'chapter':
      return { summary: inputs[0] || '', memory, characterArcs: memory.characterArcs || {}, timeline: memory.timeline || '', chapterNumber: (node as any).chapterNumber };
    case 'dialogue':
      return { context: inputs[0] || '', characters: ['Elena', 'Dmitri'], memory };
    case 'outline':
      return { prompt: typeof inputs[0] === 'string' ? inputs[0] : '', memory };
    default:
      return { inputs, memory };
  }
}

// --- Drop-In: generateNarrativeMemory Helper ---
export async function generateNarrativeMemory({
  summary,
  modelId = "gpt-4o",
  executeModel,
  adapterRegistry
}: {
  summary: string;
  modelId?: string;
  executeModel: (provider: string, model: string, body: any) => Promise<any>;
  adapterRegistry: Record<string, any>;
}): Promise<{ output: string; memory: NarrativeMemory }> {
  const adapter = adapterRegistry[modelId];
  if (!adapter) throw new Error(`Adapter not found for model ${modelId}`);

  const prompt = `
You are an expert narrative analyst tasked with extracting memory structure from a chapter summary.

Return ONLY a strict JSON object with the following fields:
- "characterArcs": map of named characters to how they changed
- "emotionalTone": 1-line description of the protagonist’s emotional state
- "openThreads": 2–5 unresolved narrative questions or mysteries
- "worldState": what materially or thematically changed in the world

Example:
{
  "characterArcs": {
    "Elara": "Becomes unsettled by the possibility of alternate realities"
  },
  "emotionalTone": "shaken and questioning reality",
  "openThreads": [
    "What happened to Karim?",
    "Has the core altered history?",
    "Why is Elara the only one who remembers?"
  ],
  "worldState": "Temporal anomalies have likely rewritten reality"
}

Chapter Summary:
${summary}

Respond ONLY with a valid JSON object. Do NOT use markdown, comments, or prose.
`;

  const body = adapter.buildRequest(prompt, {
    temperature: 0.7,
    maxTokens: 1024
  });

  const raw = await executeModel(adapter.providerName, modelId, body);
  const parsed = adapter.parseResponse(raw);

  let memory: NarrativeMemory = {
    characterArcs: {},
    emotionalTone: "unknown",
    openThreads: ["Unclear what the next step is."],
    worldState: "unknown change"
  };
  try {
    const parsedMemory = JSON.parse(parsed.output);
    memory = {
      characterArcs: parsedMemory.characterArcs || {},
      emotionalTone: parsedMemory.emotionalTone || "unknown",
      openThreads: parsedMemory.openThreads?.length ? parsedMemory.openThreads : ["Unclear what the next step is."],
      worldState: parsedMemory.worldState || "unknown change",
      ...parsedMemory
    };
  } catch (err) {
    console.warn("[Memory Parsing] Failed to parse memory, applying fallback.", err);
  }

  return {
    output: parsed.output,
    memory
  };
}

// === Narrative-Aware Node Execution Logic ===
export async function executeNode(
  node: FlowNode,
  input: any,
  flowSettings?: { flowMode?: string; maxTokens?: Record<string, number> }
) {
  // If not in novel mode, run default logic
  if (!flowSettings || flowSettings.flowMode !== 'novel') {
    console.log(`Starting execution of node ${node.id} of type ${node.type} with input:`, input);

    // Handle InputPrompt node type
    if (node.type === "inputPrompt") {
      console.log("Executing input prompt node with prompt:", node.prompt);
      // Return the prompt directly so it can be used by downstream nodes
      return node.prompt || "";
    }

    if (!node.modelId) {
      throw new Error("Node missing modelId");
    }
    
    // Try to get adapter with original model ID first
    let adapter = getAdapter(node.modelId);
    
    // If not found, try normalized version (lowercase)
    if (!adapter && typeof node.modelId === 'string') {
      const normalizedModelId = node.modelId.toLowerCase();
      adapter = getAdapter(normalizedModelId);
      
      if (adapter) {
        console.log(`Found adapter using normalized model ID: ${normalizedModelId}`);
      }
    }
    
    if (!adapter) {
      throw new Error(`Missing adapter for model: ${node.modelId}`);
    }
    
    // Merge default config with user-provided configuration
    const mergedConfig = {
      ...adapter.getDefaultConfig(),
      ...node.config,
    };

    // Validate merged configuration before processing
    const validation = validateFlowNodeConfig(node.modelId, mergedConfig);
    if (!validation.isValid) {
      const errorMessage = `Invalid configuration: ${validation.errors.join(", ")}`;
      logger.error(errorMessage, { nodeId: node.id, modelId: node.modelId });
      throw new Error(errorMessage);
    }
    
    try {
      console.log(`Executing node ${node.id} with input:`, input);
      console.log(`Node config:`, mergedConfig);
      
      // Process input - ensure it's a string
      let processedInput = localProcessInput(input);
      
      // Build the request using the adapter
      const requestBody = adapter.buildRequest(processedInput, mergedConfig);
      
      // For mock model, simulate a response
      if (node.modelId === 'mock-model') {
        console.log("Using mock model for", node.id);
        const mockOutput = `[Mock response for node ${node.id}: ${processedInput}]`;
        useDebugStore.getState().addLog({
          nodeId: node.id,
          modelId: node.modelId,
          prompt: processedInput,
          rawOutput: mockOutput,
          parsedOutput: mockOutput,
          timestamp: new Date().toISOString(),
          durationMs: 0
        });
        return mockOutput;
      }
      
      // Check for user authentication before making API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Authentication required. Please sign in to execute real model calls.");
      }
      
      // Execute the model using our API functions
      const providerName = adapter.providerName;
      console.log(`Executing ${providerName} model: ${node.modelId}`);
      
      // Add specific handling for Perplexity models
      if (node.modelId === 'sonar-pro' || node.modelId === 'sonar-deep-research') {
        // Define the type for Perplexity config
        interface PerplexityConfig {
          systemPrompt: string;
          temperature?: number;
          maxTokens?: number;
          enableWebSearch?: boolean;
          [key: string]: any;
        }
        
        const defaultConfig: PerplexityConfig = {
          systemPrompt: "You are an AI assistant providing concise and helpful information.",
          temperature: 0.7,
          maxTokens: 1000,
          enableWebSearch: true
        };
        
        // Merge default config with user config
        const perplexityConfig: PerplexityConfig = {
          ...defaultConfig,
          ...mergedConfig
        };
        
        const perplexityRequestBody = adapter.buildRequest(processedInput, perplexityConfig);
        const start = Date.now();
        const perplexityResponse = await executeModel(adapter.providerName, node.modelId, perplexityRequestBody);
        const durationMs = Date.now() - start;
        useDebugStore.getState().addLog({
          nodeId: node.id,
          modelId: node.modelId,
          prompt: processedInput,
          rawOutput: JSON.stringify(perplexityResponse),
          parsedOutput: perplexityResponse,
          timestamp: new Date().toISOString(),
          durationMs
        });
        return perplexityResponse;
      }
      const start = Date.now();
      const response = await executeModel(providerName, node.modelId, requestBody);
      const durationMs = Date.now() - start;
      // Handle API errors
      if (response.error) {
        const errorMessage = response.message || 'Unknown API error';
        console.error(`Error from API:`, errorMessage);
        
        toast({
          title: "API Error",
          description: errorMessage,
          variant: "destructive"
        });
        
        throw new Error(errorMessage);
      }
      
      // Handle potential empty response
      if (!response) {
        throw new Error("Empty response from API");
      }
      
      console.log(`Got response from ${providerName}:`, response);
      
      // Parse the response using the adapter
      const parsedResponse = adapter.parseResponse(response);
      useDebugStore.getState().addLog({
        nodeId: node.id,
        modelId: node.modelId,
        prompt: processedInput,
        rawOutput: JSON.stringify(response),
        parsedOutput: parsedResponse,
        timestamp: new Date().toISOString(),
        durationMs
      });
      // Make sure we directly return the parsed response, not additional wrappers
      return parsedResponse;
    } catch (error: any) {
      logger.error(`Execution error for node ${node.id}:`, error);
      toast({
        title: "Execution Error",
        description: error.message || "Unknown execution error",
        variant: "destructive"
      });
      throw new Error("Internal error. Please try again later.");
    }
  }

  // --- Novel Mode Logic ---
  if (flowSettings && flowSettings.flowMode === 'novel') {
    // --- Input shaping ---
    const memoryInputs = Array.isArray(input.memoryInputs) ? input.memoryInputs : [];
    // Simple merge function for narrative memory objects
    const mergedMemory = mergeNarrativeMemory(...memoryInputs);
    const inputs = Array.isArray(input.inputs) ? input.inputs : [input.inputs];
    // Use centralized input shaping
    const inputObject = buildInputObject(node, node.nodeKind, inputs, mergedMemory);
    // --- Token management ---
    const baseMax = flowSettings?.maxTokens?.[node.nodeKind] || defaultMaxTokensByNodeKind[node.nodeKind] || 2048;
    const modelCap = modelTokenLimit[node.modelId] || 16000;
    const finalMaxTokens = Math.min(baseMax, modelCap);
    // --- Adapter-based model execution ---
    const adapter = adapterRegistry[node.modelId];
    if (!adapter) throw new Error(`No adapter for modelId: ${node.modelId}`);

    if (node.nodeKind === 'summary') {
      // Use summaryPrompt template to ensure chapterText is included
      const prompt = summaryPrompt({
        chapterText: inputObject.chapterText || ''
      });
      console.log('[Summary Prompt Check]', prompt.slice(0, 300));
      const request = adapter.buildRequest(prompt, {
        ...node.config,
        maxTokens: finalMaxTokens
      });
      const start = Date.now();
      const raw = await executeModel(adapter.providerName, node.modelId, request);
      const durationMs = Date.now() - start;
      const parsed = adapter.parseResponse(raw);
      useDebugStore.getState().addLog({
        nodeId: node.id,
        modelId: node.modelId,
        prompt,
        rawOutput: JSON.stringify(raw),
        parsedOutput: parsed,
        timestamp: new Date().toISOString(),
        durationMs
      });
      return {
        output: parsed.output,
        memory: updateNarrativeMemory(node.nodeKind, inputObject.memory),
        debugPrompt: prompt
      };
    }

    // --- Chapter: ensure correct chapter number and outline integration in prompt ---
    if (node.nodeKind === 'chapter') {
      // Derive chapter number from label or fallback to 1
      const chapterNumber = extractChapterNumberFromLabel(node.config?.label || node.id);
      // Find upstream outline node using inputNodeIds
      let outlineTitle = `Chapter ${chapterNumber}`;
      let outlineSummary = '';
      if (Array.isArray(node.inputNodeIds)) {
        const outlineNodeId = node.inputNodeIds.find(
          (id) => {
            // Try to find an input node with nodeKind 'outline' in the input object
            const inputNode = (input.inputs || []).find((n: any) => n && n.id === id && n.nodeKind === 'outline');
            return !!inputNode;
          }
        );
        if (outlineNodeId && input[outlineNodeId]) {
          const { title, summary } = getOutlineEntryForChapter(input[outlineNodeId], chapterNumber);
          outlineTitle = title;
          outlineSummary = summary;
        }
      }
      // Compose the prompt with outline injection
      const prompt = chapterPrompt({
        chapterNumber,
        outlineTitle,
        outlineSummary,
        memory: input.memory
      });
      const request = adapter.buildRequest(prompt, {
        ...node.config,
        maxTokens: finalMaxTokens
      });
      const start = Date.now();
      const raw = await executeModel(adapter.providerName, node.modelId, request);
      const durationMs = Date.now() - start;
      const parsed = adapter.parseResponse(raw);
      useDebugStore.getState().addLog({
        nodeId: node.id,
        modelId: node.modelId,
        prompt,
        rawOutput: JSON.stringify(raw),
        parsedOutput: parsed,
        timestamp: new Date().toISOString(),
        durationMs
      });
      return {
        output: parsed.output,
        memory: updateNarrativeMemory(node.nodeKind, inputObject.memory),
        debugPrompt: prompt
      };
    }

    const systemPrompt = node.config?.systemPrompt || '';
    const userPrompt = typeof inputObject.prompt === 'string' ? inputObject.prompt : '';
    if (node.nodeKind === 'outline') {
      // Debug log for system and user prompt
      console.log('[Outline Node] System prompt:', systemPrompt?.slice(0, 100));
      console.log('[Outline Node] User prompt:', userPrompt?.slice(0, 100));
    }
    const fullPrompt = `${systemPrompt}\n\nUser Prompt:\n${userPrompt}`;
    const prompt = node.nodeKind === 'outline' ? fullPrompt : getPromptForNodeKind(node.nodeKind, inputObject);
    const request = adapter.buildRequest(prompt, {
      ...node.config,
      maxTokens: finalMaxTokens
    });
    const start = Date.now();
    const raw = await executeModel(adapter.providerName, node.modelId, request);
    const durationMs = Date.now() - start;
    const parsed = adapter.parseResponse(raw);
    useDebugStore.getState().addLog({
      nodeId: node.id,
      modelId: node.modelId,
      prompt,
      rawOutput: JSON.stringify(raw),
      parsedOutput: parsed,
      timestamp: new Date().toISOString(),
      durationMs
    });
    // --- Output shaping ---
    if (node.nodeKind === 'outline') {
      const parsedOutline = extractOutlineFromModelOutput(parsed.output);
      return {
        output: JSON.stringify(parsedOutline, null, 2),
        memory: { fullOutline: parsedOutline },
        debugPrompt: prompt
      };
    }
    // --- RetroInject: bulletproof JSON extraction and normalization ---
    if (node.nodeKind === 'retroinject') {
      // Use the new generateNarrativeMemory helper for robust memory extraction
      const summary = Array.isArray(inputs) ? inputs.map(localProcessInput).join('\n') : localProcessInput(inputs);
      const { output, memory } = await generateNarrativeMemory({
        summary,
        modelId: node.modelId,
        executeModel,
        adapterRegistry
      });
      // Attach fallback if memory is incomplete
      if (!memory || !memory.characterArcs) {
        console.warn('[RetroInject] Memory structure incomplete:', memory, '\nRaw model output:', output);
        memory.fallback = output;
      }
      // Normalize keys (now type-safe)
      memory.characterArcs = memory.characterArcs || {};
      memory.openThreads = memory.openThreads?.length ? memory.openThreads : ["Unclear what the next step is."];
      memory.emotionalTone = memory.emotionalTone || "unknown";
      memory.worldState = memory.worldState || "unknown change";
      return {
        output,
        memory,
        debugPrompt: summary
      };
    }
    return {
      output: parsed.output,
      memory: updateNarrativeMemory(node.nodeKind, inputObject.memory),
      debugPrompt: prompt
    };
  }
}
