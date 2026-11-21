import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatBytes,
  filterSdocxFiles,
  checkLargeFiles,
  LARGE_FILE_THRESHOLD_BYTES,
} from "../js/file_utils.js";

test("formatBytes formats various file sizes accurately", () => {
  assert.strictEqual(formatBytes(0), "0 B");
  assert.strictEqual(formatBytes(512), "512 B");
  assert.strictEqual(formatBytes(1024), "1.0 KB");
  assert.strictEqual(formatBytes(15 * 1024 * 1024), "15 MB");
  assert.strictEqual(formatBytes(26.5 * 1024 * 1024), "27 MB");
});

test("filterSdocxFiles keeps only .sdocx files case-insensitively", () => {
  const mockFiles = [
    { name: "note1.sdocx", size: 100 },
    { name: "NOTE2.SDOCX", size: 200 },
    { name: "doc.pdf", size: 500 },
    { name: "image.png", size: 300 },
    { name: "notesdocx", size: 10 },
  ];

  const filtered = filterSdocxFiles(mockFiles);
  assert.strictEqual(filtered.length, 2);
  assert.strictEqual(filtered[0].name, "note1.sdocx");
  assert.strictEqual(filtered[1].name, "NOTE2.SDOCX");
});

test("checkLargeFiles flags files exceeding 25 MB threshold", () => {
  const smallNotes = [
    { name: "small1.sdocx", size: 2 * 1024 * 1024 },
    { name: "small2.sdocx", size: 5 * 1024 * 1024 },
  ];
  const res1 = checkLargeFiles(smallNotes);
  assert.strictEqual(res1.hasLarge, false);
  assert.strictEqual(res1.largeFiles.length, 0);

  const mixedNotes = [
    { name: "small.sdocx", size: 3 * 1024 * 1024 },
    { name: "huge_lecture.sdocx", size: 28 * 1024 * 1024 },
  ];
  const res2 = checkLargeFiles(mixedNotes);
  assert.strictEqual(res2.hasLarge, true);
  assert.strictEqual(res2.largeFiles.length, 1);
  assert.strictEqual(res2.largeFiles[0].name, "huge_lecture.sdocx");
  assert.strictEqual(res2.largeFiles[0].formattedSize, "28 MB");
});

test("checkLargeFiles flags total batch size exceeding threshold", () => {
  const batchNotes = [
    { name: "note1.sdocx", size: 14 * 1024 * 1024 },
    { name: "note2.sdocx", size: 14 * 1024 * 1024 },
  ];
  const res = checkLargeFiles(batchNotes);
  assert.strictEqual(res.hasLarge, true);
  assert.strictEqual(res.totalBytes, 28 * 1024 * 1024);
});
