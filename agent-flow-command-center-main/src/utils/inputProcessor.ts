// Utility function for processing input
export function processInput(input: any): string {
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