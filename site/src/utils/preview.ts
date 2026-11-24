/**
 * Plain-text preview handler.
 * MD-3: Plain text only, set through textContent assignment, never HTML parsing.
 */

export function formatPlainTextPreview(
  markdownText?: string,
  maxChars = 50_000
): string {
  if (!markdownText) return "";
  if (markdownText.length > maxChars) {
    return markdownText.slice(0, maxChars) + "\n\n... (preview truncated)";
  }
  return markdownText;
}
