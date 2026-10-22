/**
 * Normalizes output string for deterministic comparison.
 * 1. Convert CRLF -> LF
 * 2. Remove trailing whitespace from each line
 * 3. Remove trailing empty lines
 */
export function normalizeOutput(output: string): string {
  if (!output) return '';
  
  // 1. CRLF -> LF
  let normalized = output.replace(/\r\n/g, '\n');
  
  // 2. Remove trailing whitespace per line
  const lines = normalized.split('\n').map(line => line.trimEnd());
  
  // 3. Remove trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  
  return lines.join('\n');
}

/**
 * Compare two outputs exactly after normalization.
 */
export function compareOutputs(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}
