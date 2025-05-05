// 📚 This file contains narrative prompt templates for novel-mode agentic flows.
// Each function returns a prompt tailored to a nodeKind: 'chapter', 'dialogue', 'summary', or 'retroinject'.
// Prompts are used by executeNode() in novel mode to feed model adapters like GPT-4 or Claude.

import { getOutlineEntryForChapter } from '../parsers/getOutlineEntryForChapter';

// Compose narrative memory for chapter prompt
function composeNarrativeMemory(memory: any): string {
  return `
Character Arcs: ${JSON.stringify(memory.characterArcs || {}, null, 2)}
Emotional Tone: ${memory.emotionalTone || 'neutral'}
Open Threads: ${(memory.openThreads || []).join(', ') || 'none'}
World State: ${memory.worldState || 'unchanged'}
  `.trim();
}

export function chapterPrompt({
  chapterNumber,
  outlineTitle,
  outlineSummary,
  memory
}: {
  chapterNumber: number;
  outlineTitle: string;
  outlineSummary: string;
  memory: any;
}) {
  return `
You are writing Chapter ${chapterNumber}: ${outlineTitle} of a nonlinear sci-fi novel.

Goal for this chapter:
${outlineSummary}

Narrative memory from prior chapters:
Character Arcs: ${JSON.stringify(memory.characterArcs || {}, null, 2)}
Emotional Tone: ${memory.emotionalTone || 'neutral'}
Open Threads: ${memory.openThreads?.join(', ') || 'none'}
World State: ${memory.worldState || 'unchanged'}

Write the full chapter.
  `.trim();
}

export const dialoguePrompt = ({
  context,
  characters
}: {
  context: string;
  characters?: string[];
}) => `
Write a dialogue scene based on the following situation:

Context: ${context}
Characters: ${characters?.join(', ') || 'Elena, Dmitri'}

Let them argue, reveal fears, or uncover clues through tense, realistic dialogue.
`;

export const summaryPrompt = ({ chapterText }: { chapterText: string }) => `
You are a helpful summarization assistant.

Task: Summarize the following novel chapter in 3 paragraphs or less.

---

Chapter Content:
${chapterText}

---

Please begin the summary below:
`;

export function retroinjectPrompt({ summary }: { summary: string }) {
  return `
Extract the following information from this chapter summary and return a strict JSON object with these fields:

characterArcs: map of character names to how they evolved (emotionally, psychologically)
emotionalTone: dominant emotion felt by the protagonist
openThreads: array of unresolved plot threads or mysteries
worldState: how the world changed, materially or thematically

Example:
{
  "characterArcs": {
    "Elara": "Shifts from detached scientific observer to determined investigator after learning of the neural fracture",
    "Cassian": "Evolves from confident expert to concerned realist confronting system instability"
  },
  "emotionalTone": "urgency mixed with quiet resolve",
  "openThreads": [
    "What is causing the neural fracture?",
    "Can the anomaly be repaired?",
    "Is it a symptom or a signal?"
  ],
  "worldState": "A subtle but destabilizing anomaly has been discovered in the global neural network, threatening collective consciousness"
}

Respond ONLY with valid JSON. Do NOT include explanations, comments, or markdown.

Chapter Summary:
${summary}
`.trim();
}
