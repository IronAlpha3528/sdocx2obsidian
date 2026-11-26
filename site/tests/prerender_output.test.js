import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(__dirname, "..");
const distDir = path.resolve(siteDir, "dist");
const siteMeta = JSON.parse(
  fs.readFileSync(path.resolve(siteDir, "src/site-meta.json"), "utf-8")
);

test("prerendered dist output matches all routes in site-meta.json", () => {
  assert.ok(fs.existsSync(distDir), "site/dist must exist (run pnpm run build)");

  for (const route of siteMeta.routes) {
    let htmlPath;
    if (route.path === "/") {
      htmlPath = path.join(distDir, "index.html");
    } else if (route.path === "/404") {
      htmlPath = path.join(distDir, "404.html");
    } else {
      htmlPath = path.join(distDir, route.path.slice(1), "index.html");
    }

    assert.ok(fs.existsSync(htmlPath), `Missing prerendered HTML for ${route.path}: ${htmlPath}`);
    const html = fs.readFileSync(htmlPath, "utf-8");
    assert.ok(html.includes(`<title>${route.title}</title>`), `Title mismatch for ${route.path}`);
    assert.ok(html.includes(`<h1`), `Missing <h1> on ${route.path}`);
    assert.ok(!html.includes("pages.dev"), `Stale pages.dev URL found in ${route.path}`);

    const expectedCanonical = `${siteMeta.siteUrl}${route.path === "/" ? "" : route.path}`;
    assert.ok(
      html.includes(`<link rel="canonical" href="${expectedCanonical}">`),
      `Canonical mismatch for ${route.path}`
    );
  }

  const sitemap = fs.readFileSync(path.join(distDir, "sitemap.xml"), "utf-8");
  const robots = fs.readFileSync(path.join(distDir, "robots.txt"), "utf-8");
  assert.ok(sitemap.includes(siteMeta.siteUrl));
  assert.ok(!sitemap.includes("pages.dev"));
  assert.ok(robots.includes(`Sitemap: ${siteMeta.siteUrl}/sitemap.xml`));
  assert.ok(fs.existsSync(path.join(distDir, "worker.js")));
  assert.ok(fs.existsSync(path.join(distDir, "vendor/pyodide/pyodide.js")));
});
