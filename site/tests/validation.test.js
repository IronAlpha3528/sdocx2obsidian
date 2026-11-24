import test from "node:test";
import assert from "node:assert/strict";
import {
  formatBytes,
  validateFiles,
  MAX_FILES,
  MAX_FILE_SIZE,
  MAX_SESSION_SIZE,
  LARGE_FILE_THRESHOLD,
} from "../src/utils/validation.ts";

test("formatBytes formats byte counts correctly", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(1024), "1.00 KB");
  assert.equal(formatBytes(1536), "1.50 KB");
  assert.equal(formatBytes(10 * 1024 * 1024), "10.0 MB");
  assert.equal(formatBytes(25.5 * 1024 * 1024), "25.5 MB");
});

test("validateFiles accepts valid .sdocx files", () => {
  const fakeFile = {
    name: "lecture.sdocx",
    size: 2 * 1024 * 1024,
  };

  const res = validateFiles([fakeFile], []);
  assert.equal(res.error, undefined);
  assert.equal(res.valid.length, 1);
  assert.equal(res.valid[0].name, "lecture.sdocx");
  assert.equal(res.valid[0].isLarge, false);
});

test("validateFiles flags files >= 25MB as isLarge", () => {
  const largeFile = {
    name: "conference_keynote.sdocx",
    size: 28 * 1024 * 1024,
  };

  const res = validateFiles([largeFile], []);
  assert.equal(res.error, undefined);
  assert.equal(res.valid.length, 1);
  assert.equal(res.valid[0].isLarge, true);
});

test("validateFiles rejects non-.sdocx files", () => {
  const nonSdocx = {
    name: "notes.pdf",
    size: 1024 * 1024,
  };

  const res = validateFiles([nonSdocx], []);
  assert.ok(res.error?.includes("Only .sdocx files are supported"));
  assert.equal(res.valid.length, 0);
});

test("validateFiles enforces 50MB single file limit", () => {
  const hugeFile = {
    name: "huge.sdocx",
    size: 55 * 1024 * 1024,
  };

  const res = validateFiles([hugeFile], []);
  assert.ok(res.error?.includes("exceeds the 50 MB single-note limit"));
  assert.equal(res.valid.length, 0);
});

test("validateFiles enforces 5 file maximum batch limit", () => {
  const existing = Array.from({ length: 5 }, (_, i) => ({
    id: `f-${i}`,
    file: {},
    name: `note_${i}.sdocx`,
    size: 1024,
    isLarge: false,
    status: "pending",
  }));

  const newFile = {
    name: "sixth_note.sdocx",
    size: 1024,
  };

  const res = validateFiles([newFile], existing);
  assert.ok(res.error?.includes("Maximum 5 notes"));
  assert.equal(res.valid.length, 0);
});

test("validateFiles enforces 100MB session cumulative limit", () => {
  const existing = [
    {
      id: "f-1",
      file: {},
      name: "note_1.sdocx",
      size: 45 * 1024 * 1024,
      isLarge: true,
      status: "pending",
    },
    {
      id: "f-2",
      file: {},
      name: "note_2.sdocx",
      size: 45 * 1024 * 1024,
      isLarge: true,
      status: "pending",
    },
  ];

  const newFile = {
    name: "note_3.sdocx",
    size: 15 * 1024 * 1024,
  };

  const res = validateFiles([newFile], existing);
  assert.ok(res.error?.includes("Total session input exceeds the 100 MB limit"));
  assert.equal(res.valid.length, 0);
});

test("validateFiles ignores exact duplicates without error", () => {
  const existing = [
    {
      id: "f-1",
      file: {},
      name: "duplicate.sdocx",
      size: 2 * 1024 * 1024,
      isLarge: false,
      status: "pending",
    },
  ];

  const duplicate = {
    name: "duplicate.sdocx",
    size: 2 * 1024 * 1024,
  };

  const res = validateFiles([duplicate], existing);
  assert.equal(res.error, undefined);
  assert.equal(res.valid.length, 0);
});
