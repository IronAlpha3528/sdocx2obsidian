/**
 * Plain-text preview handler.
 * MD-3: Plain text only, set through textContent assignment, never HTML parsing.
 */

export function formatPlainTextPreview(markdownText, maxChars = 50_000) {
  if (!markdownText) return "";
  if (markdownText.length > maxChars) {
    return markdownText.slice(0, maxChars) + "\n\n... (preview truncated)";
  }
  return markdownText;
}

export function renderPlainText(containerElement, markdownText) {
  if (!containerElement) return;
  // Assignment to textContent guarantees that HTML tags are rendered as inert literal text
  containerElement.textContent = formatPlainTextPreview(markdownText);
}
