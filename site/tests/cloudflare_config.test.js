import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wranglerPath = path.resolve(__dirname, "../wrangler.jsonc");
const headersPath = path.resolve(__dirname, "../public/_headers");

test("wrangler.jsonc configures static assets without worker entrypoint", () => {
  assert.ok(fs.existsSync(wranglerPath), "site/wrangler.jsonc must exist");
  const config = JSON.parse(fs.readFileSync(wranglerPath, "utf-8"));

  assert.strictEqual(config.name, "sdocx2obsidian");
  assert.ok(config.compatibility_date, "compatibility_date must be set");
  assert.strictEqual(config.main, undefined, "no dynamic worker entrypoint should be configured");
  assert.strictEqual(config.assets?.directory, "./dist");
  assert.strictEqual(config.assets?.not_found_handling, "404-page");
});

test("public/_headers enforces CSP, security headers, MIME types, and caching", () => {
  assert.ok(fs.existsSync(headersPath), "site/public/_headers must exist");
  const raw = fs.readFileSync(headersPath, "utf-8");

  assert.ok(raw.includes("X-Content-Type-Options: nosniff"));
  assert.ok(raw.includes("X-Frame-Options: DENY"));
  assert.ok(raw.includes("Content-Security-Policy:"));
  assert.ok(raw.includes("default-src 'none'"));
  assert.ok(raw.includes("script-src 'self' 'wasm-unsafe-eval'"));
  assert.ok(raw.includes("worker-src 'self' blob:"));
  assert.ok(raw.includes("manifest-src 'self'"));
  assert.ok(raw.includes("Content-Type: application/wasm"));
  assert.ok(raw.includes("Content-Type: application/octet-stream"));
  assert.ok(raw.includes("Cache-Control: public, max-age=31536000, immutable"));
});
