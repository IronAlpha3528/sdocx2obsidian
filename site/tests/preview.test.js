import test from "node:test";
import assert from "node:assert/strict";
import { formatPlainTextPreview } from "../js/preview.js";

test("formatPlainTextPreview handles plain text cleanly", () => {
  const input = "# Hello World\n\nThis is a note.";
  const output = formatPlainTextPreview(input);
  assert.equal(output, input);
});

test("formatPlainTextPreview keeps hostile HTML and scripts inert as pure string", () => {
  const hostile = "<script>alert('xss')</script><img src=x onerror=alert(1)>";
  const output = formatPlainTextPreview(hostile);
  // It returns string as-is for textContent assignment without parsing HTML elements
  assert.equal(output, hostile);
});

test("formatPlainTextPreview truncates excessively large previews for UI safety", () => {
  const large = "a".repeat(100_000);
  const output = formatPlainTextPreview(large, 50_000);
  assert.equal(output.length, 50_000 + "\n\n... (preview truncated)".length);
  assert(output.endsWith("... (preview truncated)"));
});
