import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootVercelPath = path.resolve(__dirname, "../../vercel.json");
const siteVercelPath = path.resolve(__dirname, "../vercel.json");

test("vercel.json exists and contains required static security headers and MIME types", () => {
  // At least one valid vercel.json must exist (root or site)
  const configPath = fs.existsSync(rootVercelPath) ? rootVercelPath : siteVercelPath;
  assert.ok(fs.existsSync(configPath), "vercel.json should exist");

  const raw = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(raw);

  assert.ok(Array.isArray(config.headers), "config.headers should be an array");

  // Flatten headers to inspect rules
  const globalRule = config.headers.find(h => h.source === "/(.*)");
  assert.ok(globalRule, "Global header rule /(.*) must be defined");

  const headerMap = new Map(globalRule.headers.map(h => [h.key, h.value]));

  assert.strictEqual(headerMap.get("X-Content-Type-Options"), "nosniff");
  assert.strictEqual(headerMap.get("X-Frame-Options"), "DENY");
  assert.strictEqual(headerMap.get("Referrer-Policy"), "no-referrer");
  assert.ok(headerMap.get("Strict-Transport-Security")?.includes("max-age=63072000"), "HSTS should have 2-year max-age");

  // Check CSP
  const csp = headerMap.get("Content-Security-Policy");
  assert.ok(csp, "CSP header must be present");
  assert.ok(csp.includes("default-src 'none'"));
  assert.ok(csp.includes("script-src 'self' 'wasm-unsafe-eval'"));
  assert.ok(csp.includes("worker-src 'self' blob:"));

  // Check vendor caching
  const vendorRule = config.headers.find(h => h.source?.includes("vendor"));
  assert.ok(vendorRule, "Vendor caching rule should be defined");
  const vendorCache = vendorRule.headers.find(h => h.key === "Cache-Control");
  assert.ok(vendorCache?.value.includes("max-age=31536000"), "Vendor cache should be 1 year immutable");

  // Check wasm MIME type
  const wasmRule = config.headers.find(h => h.source?.includes(".wasm"));
  assert.ok(wasmRule, "WASM MIME type rule should be defined");
  const wasmType = wasmRule.headers.find(h => h.key === "Content-Type");
  assert.strictEqual(wasmType?.value, "application/wasm");

  // Confirm no serverless functions configured
  assert.strictEqual(config.functions, undefined, "No serverless functions should be configured");
});
