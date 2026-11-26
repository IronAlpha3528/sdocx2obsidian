import { test } from "node:test";
import assert from "node:assert/strict";
import { ROUTES_META, SITE_URL, getRouteMeta } from "../src/seo-config.ts";

test("SITE_URL uses unified workers.dev URL without trailing slash", () => {
  assert.strictEqual(SITE_URL, "https://sdocx2obsidian.abhay-gugale153.workers.dev");
  assert.ok(!SITE_URL.endsWith("/"));
});

test("getRouteMeta resolves exact paths, trailing slashes, and 404 fallback", () => {
  assert.strictEqual(getRouteMeta("/").path, "/");
  assert.strictEqual(getRouteMeta("/features").path, "/features");
  assert.strictEqual(getRouteMeta("/features/").path, "/features");
  assert.strictEqual(getRouteMeta("/nonexistent-route").path, "/404");

  const paths = new Set(ROUTES_META.map((r) => r.path));
  for (const expected of [
    "/",
    "/features",
    "/how-it-works",
    "/preview",
    "/limitations",
    "/faq",
    "/privacy",
    "/about",
    "/404",
  ]) {
    assert.ok(paths.has(expected), `Missing route metadata for ${expected}`);
  }
});
