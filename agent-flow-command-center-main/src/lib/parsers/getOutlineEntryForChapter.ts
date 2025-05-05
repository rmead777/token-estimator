// Utility: Robustly extract outline entry for a chapter
export function getOutlineEntryForChapter(raw: string, chapterIndex: number): { title: string; summary: string } {
  let parsed: any[] = [];

  // Remove code fence if present
  let cleaned = raw.trim().replace(/^```json/, '').replace(/```$/, '').trim();

  // Try parsing as JSON array directly
  try {
    parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      // parsed is good
    } else if (typeof parsed === 'string') {
      // Handles double-wrapped string
      parsed = JSON.parse(parsed);
    }
  } catch {
    // Try to extract array from string
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      try {
        const slice = cleaned.slice(arrayStart, arrayEnd + 1);
        parsed = JSON.parse(slice);
      } catch (err) {
        console.warn('[Outline Parser] JSON.parse failed:', err);
        return { title: `Chapter ${chapterIndex}`, summary: '' };
      }
    } else {
      return { title: `Chapter ${chapterIndex}`, summary: '' };
    }
  }

  const entry = parsed?.[chapterIndex - 1];
  if (!entry || typeof entry !== 'object') return { title: `Chapter ${chapterIndex}`, summary: '' };

  return {
    title: entry.title || `Chapter ${chapterIndex}`,
    summary: entry.summary || ''
  };
}
