# Frontend Redesign Brief — sdocx2obsidian

> **Notice:** All visual UI layouts, design tokens, wireframes, and styling descriptions have been removed from this document. A separate document will specify the upcoming frontend visual design and user interface layout.

## 1. Architectural Scope & Functional Constraints
This document preserves the non-visual architectural requirements for the browser-based presentation layer under `site/`:
- **Client-Side Execution:** Note conversion executes 100% inside the user's browser via Pyodide WebAssembly. Zero note uploads, zero server compute.
- **Privacy & Security:** Strict Content Security Policy (`default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; worker-src 'self' blob:; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none';`), zero external or third-party requests, and content-free issue reporting.
- **Underlying Engine:** Integration with the `sdocx2obsidian` Web Worker (`worker.js`) and `ConversionSession` interface.
- **Safety Limits:** Pre-read file and session bounds enforced by the web adapter (`WEB_LIMITS`: 50 MB max per file, 100 MB session total, 5 files max).
- **Plain-Text Preview:** Preview of Markdown output is text-only (`textContent` assignment), never parsed as HTML.

## 2. Visual Design Reference
All visual UI wireframes, typography scales, color palettes, component specifications, and user interface layouts will be defined in a dedicated frontend design document.
