export function extractOutlineFromModelOutput(rawOutput: string): any[] {
  if (!rawOutput) {
    return [{
      title: "❌ Outline parsing failed",
      summary: "Model output was empty."
    }];
  }

  // 🧹 Remove Markdown wrappers
  const cleaned = rawOutput
    .replace(/^```json\s*/i, '')
    .replace(/```$/g, '')
    .trim();

  // 🔍 Extract the array
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');

  if (start === -1 || end === -1 || end <= start) {
    return [{
      title: "❌ Outline parsing failed",
      summary: "No JSON array found in model output."
    }];
  }

  const jsonSlice = cleaned.slice(start, end + 1);

  try {
    const parsed = JSON.parse(jsonSlice);
    if (!Array.isArray(parsed)) {
      throw new Error("Parsed output is not an array");
    }
    return parsed;
  } catch (err) {
    console.warn('[OutlineParser] Failed to parse cleaned model output:', err);
    return [{
      title: "❌ Outline parsing failed",
      summary: "Could not parse array. Model may have returned malformed or incomplete JSON."
    }];
  }
}