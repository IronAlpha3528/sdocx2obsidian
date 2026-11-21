/**
 * File utility helpers for validation and sizing.
 */

export const LARGE_FILE_THRESHOLD_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_SESSION_FILES = 5;

/**
 * Format bytes into human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

/**
 * Filter valid .sdocx files from a FileList or array.
 * @param {FileList|File[]} fileList
 * @returns {File[]}
 */
export function filterSdocxFiles(fileList) {
  return Array.from(fileList || []).filter(
    (f) => f && f.name && f.name.toLowerCase().endsWith(".sdocx")
  );
}

/**
 * Inspect files for large archives that warrant a memory warning.
 * @param {File[]} files
 * @param {number} [threshold]
 * @returns {{ hasLarge: boolean, largeFiles: Array<{ name: string, size: number, formattedSize: string }>, totalBytes: number }}
 */
export function checkLargeFiles(files, threshold = LARGE_FILE_THRESHOLD_BYTES) {
  const largeFiles = [];
  let totalBytes = 0;

  for (const f of files) {
    totalBytes += f.size || 0;
    if ((f.size || 0) >= threshold) {
      largeFiles.push({
        name: f.name,
        size: f.size,
        formattedSize: formatBytes(f.size),
      });
    }
  }

  const hasLarge = largeFiles.length > 0 || totalBytes >= threshold;

  return {
    hasLarge,
    largeFiles,
    totalBytes,
  };
}
