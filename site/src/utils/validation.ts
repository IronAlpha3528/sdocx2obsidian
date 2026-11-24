import type { StagedFile } from "../types/index.js";

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const MAX_SESSION_SIZE = 100 * 1024 * 1024; // 100 MB
export const LARGE_FILE_THRESHOLD = 25 * 1024 * 1024; // 25 MB

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const num = bytes / Math.pow(k, i);
  return `${num.toFixed(num >= 10 ? 1 : 2)} ${sizes[i]}`;
}

export function validateFiles(
  incomingFiles: FileList | File[],
  existingFiles: StagedFile[]
): { valid: StagedFile[]; error?: string } {
  const filesArray = Array.from(incomingFiles);
  if (filesArray.length === 0) {
    return { valid: [] };
  }

  const existingTotalSize = existingFiles.reduce((acc, f) => acc + f.size, 0);
  let accumulatedSize = existingTotalSize;
  const newValid: StagedFile[] = [];

  for (const file of filesArray) {
    // Check extension
    if (!file.name.toLowerCase().endsWith(".sdocx")) {
      return {
        valid: newValid,
        error: `"${file.name}" is not a valid Samsung Notes file. Only .sdocx files are supported.`,
      };
    }

    // Check count limit
    if (existingFiles.length + newValid.length >= MAX_FILES) {
      return {
        valid: newValid,
        error: `Maximum ${MAX_FILES} notes can be converted in a single session.`,
      };
    }

    // Check single file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: newValid,
        error: `"${file.name}" exceeds the 50 MB single-note limit (${formatBytes(file.size)}).`,
      };
    }

    // Check session cumulative size
    if (accumulatedSize + file.size > MAX_SESSION_SIZE) {
      return {
        valid: newValid,
        error: `Total session input exceeds the 100 MB limit.`,
      };
    }

    // Check duplicates
    const isDuplicate =
      existingFiles.some((f) => f.name === file.name && f.size === file.size) ||
      newValid.some((f) => f.name === file.name && f.size === file.size);

    if (isDuplicate) {
      continue;
    }

    accumulatedSize += file.size;
    newValid.push({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      isLarge: file.size >= LARGE_FILE_THRESHOLD,
      status: "pending",
    });
  }

  return { valid: newValid };
}
