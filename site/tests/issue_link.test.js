import test from "node:test";
import assert from "node:assert/strict";
import { buildIssueLink, getCoarseSizeBucket } from "../src/utils/issueLink.ts";

test("getCoarseSizeBucket buckets file sizes appropriately", () => {
  assert.equal(getCoarseSizeBucket(500 * 1024), "< 1 MB");
  assert.equal(getCoarseSizeBucket(5 * 1024 * 1024), "1 - 10 MB");
  assert.equal(getCoarseSizeBucket(25 * 1024 * 1024), "10 - 50 MB");
  assert.equal(getCoarseSizeBucket(60 * 1024 * 1024), "> 50 MB");
});

test("buildIssueLink produces valid URL containing only allowed metadata", () => {
  const urlStr = buildIssueLink({
    repoUrl: "https://github.com/IronAlpha3528/sdocx2obsidian",
    errorClass: "CORRUPT_ARCHIVE",
    fileSizeBytes: 2 * 1024 * 1024,
    browserFamily: "Chrome",
    toolVersion: "0.1.0",
    runtimeVersion: "Pyodide 0.26.4",
  });

  const url = new URL(urlStr);
  assert.equal(url.origin, "https://github.com");
  assert.equal(url.pathname, "/IronAlpha3528/sdocx2obsidian/issues/new");

  const title = url.searchParams.get("title");
  const body = url.searchParams.get("body");

  assert(title?.includes("Web Conversion Error: CORRUPT_ARCHIVE"));
  assert(body?.includes("**Tool Version:** 0.1.0"));
  assert(body?.includes("**Runtime Version:** Pyodide 0.26.4"));
  assert(body?.includes("**Error Code:** CORRUPT_ARCHIVE"));
  assert(body?.includes("**File Size Bucket:** 1 - 10 MB"));
  assert(body?.includes("**Browser:** Chrome"));

  // Crucial security / privacy invariant: Must NEVER contain personal info or note text
  assert.equal(body?.includes("sdocx"), false);
  assert.equal(body?.includes("Meeting Notes"), false);
  assert.equal(body?.includes("Private Document"), false);
  assert.equal(body?.includes("filename"), false);

  // URL length stays well under HTTP server limits (2048 chars)
  assert(urlStr.length < 1000);
});
