/**
 * Frontend application entry point.
 * Ready for new frontend implementation.
 */

// Worker initialization helper
let worker = null;

export function initWorker() {
  if (worker) {
    worker.terminate();
  }
  worker = new Worker("worker.js");
  return worker;
}

console.log("sdocx2obsidian frontend initialized.");
