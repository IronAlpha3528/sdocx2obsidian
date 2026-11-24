# Frontend Implementation Plan — sdocx2obsidian

**Document:** `docs/frontend/FRONTEND_IMPLEMENTATION_PLAN.md`  
**Status:** Living Implementation Plan  
**Authority:** Aligned with `docs/frontend/PRODUCT_BRIEF.md`, `docs/frontend/UI_UX_SPEC.md`, `docs/frontend/DESIGN_SYSTEM.md`, and `docs/dds.md`

---

## 1. Technical Architecture & Constraints

The frontend of `sdocx2obsidian` is designed as a **modern React + TypeScript single-page application (SPA)**. It executes entirely in client browser memory, provides clean path-based routing via `react-router-dom`, and requires no backend runtime server.

### 1.1 Core Architecture Choices
- **React 18 & TypeScript 5:** Structured into typed, modular components (`site/src/components/`, `site/src/pages/`, `site/src/hooks/`). Bundled and built using Vite for rapid local development and optimized production asset output.
- **Client-Side Routing (`react-router-dom`):** Implements standard HTML5 History API path routing (`/`, `/features`, `/how-it-works`, `/preview`, `/limitations`) with SPA fallback rewrites configured for Vercel deployment.
- **Pure CSS Custom Properties Design System:** Structured CSS with zero CSS-in-JS runtimes and zero preprocessors. Complete theme toggling (MDView-inspired Blue/Grey light mode and deep slate/navy dark mode) via standard CSS variables.
- **Zero External Network Dependencies:** No third-party CDN scripts, Google Fonts, or tracking beacons. All dependencies (including Pyodide WebAssembly binaries and the Python wheel) are vendored locally in `site/vendor/`.
- **Strict Content Security Policy (CSP):**
  ```text
  default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' ws:; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none';
  ```
- **Web Worker Concurrency:** Python extraction runs in a dedicated background thread (`site/worker.js`), ensuring the main UI thread stays 100% fluid and responsive at 60 FPS during file parsing and image decompression.

---

## 2. Review of Existing Architecture & Assets

An audit of the repository establishes what exists and must be strictly preserved:

1. **`site/worker.js` (Web Worker Engine):**
   - Pure headless worker managing Pyodide v0.26.4.
   - Loads `sdocx2obsidian-*.whl` into Pyodide.
   - Handles message protocol: `init`, `start_session`, `convert_note`, `finish_session`, and `abort_session`.
   - Returns structured JSON responses and final vault ZIP `ArrayBuffer`.
   - **Constraint:** Must not be broken or rewritten. The frontend connects to this existing, verified protocol.
2. **`src/sdocx2obsidian/web/adapter.py`:**
   - Python-side session manager (`ConversionSession`) called by Pyodide.
   - Accumulates converted note Markdown, structures Obsidian asset folders, and builds `obsidian_vault.zip`.
3. **`site/vendor/pyodide/`:**
   - Self-contained local distribution of Pyodide WebAssembly runtime (`pyodide.js`, `pyodide.asm.wasm`, etc.).
4. **Current Frontend Status:**
   - Cleared and reset in commit `77c926e`.
   - `site/index.html`, `site/styles.css`, and `site/app.js` are currently clean baseline stubs ready for the new implementation.

---

## 3. Proposed Frontend File & Module Structure

The redesigned frontend structure organizes concerns into discrete, testable ES modules:

```text
site/
├── index.html                  # Accessible semantic HTML skeleton with 4 state views
├── styles.css                  # Purple-black design system tokens, themes & layout
├── app.js                      # Application orchestrator & DOM event wiring
├── worker.js                   # [Preserved] Pyodide Web Worker conversion engine
├── vendor/                     # [Preserved] Pyodide WASM runtime & wheel assets
└── js/
    ├── state_machine.js        # Deterministic FSM state manager & event pub/sub
    ├── worker_client.js        # Promise-based message client communicating with worker.js
    ├── validation.js           # File format, size caps (WEB_LIMITS), and duplicate checks
    ├── modal.js                # Accessible Large File Advisory dialog with focus trap
    ├── preview.js              # Safe textContent Markdown inspection (MD-3)
    ├── theme.js                # Light/Dark theme toggle & localStorage persistence
    └── issue_link.js           # Content-free GitHub issue report link builder (MD-6)
```

### 3.1 Module Responsibilities

| Module | Core Responsibility | Key Exports |
|---|---|---|
| `state_machine.js` | Maintains current application state (`IDLE`, `FILES_SELECTED`, `CONFIRMING_LARGE_FILES`, `LOADING_RUNTIME`, `CONVERTING`, `DONE`, `CANCELLED`, `FATAL_ERROR`). Notifies UI subscribers on transition. | `createStateMachine()`, `State` enum |
| `worker_client.js` | Wraps `new Worker('worker.js')` with type-safe async methods. Manages request/response message correlation and error timeouts. | `initEngine()`, `startSession()`, `convertNote()`, `finishSession()`, `abortSession()` |
| `validation.js` | Enforces `WEB_LIMITS` (50 MB per file, 100 MB session, max 5 files, `.sdocx` extension). Formats bytes into human-readable strings (`MB`, `KB`). | `validateFiles()`, `formatBytes()` |
| `modal.js` | Manages the Large File Confirmation Modal. Handles backdrop click, keyboard focus trapping, and `Escape` key dismissal. | `openLargeFileModal()`, `closeLargeFileModal()` |
| `preview.js` | Renders plain-text Markdown inspection using `element.textContent = markdown` (zero HTML injection). Manages note switching and clipboard copy. | `renderMarkdownPreview()`, `copyPreviewToClipboard()` |
| `theme.js` | Reads stored theme preference from `localStorage` or `prefers-color-scheme`. Toggles `data-theme="dark"` / `data-theme="light"` on `document.documentElement`. | `initTheme()`, `toggleTheme()` |
| `issue_link.js` | Generates safe GitHub issue URLs pre-filling error diagnostics without any user filenames or note text. | `buildSafeIssueUrl()` |

---

## 4. Web Worker Integration Protocol

The frontend communicates with `site/worker.js` via the established asynchronous protocol:

```
[ Frontend (app.js / worker_client.js) ]           [ Web Worker (worker.js) ]
                   │                                          │
                   ├─────────── { type: "init" } ────────────►│
                   │                                          │ (Loads WASM & Wheel)
                   │◄─────── { type: "init_success" } ────────┤
                   │                                          │
                   ├─────── { type: "start_session" } ───────►│
                   │◄────── { type: "session_started" } ──────┤
                   │                                          │
                   ├─ { type: "convert_note", data, name } ──►│
                   │                                          │ (Pyodide parses .sdocx)
                   │◄── { type: "note_progress", step: ... } ─┤
                   │◄── { type: "note_success", name, md } ───┤
                   │                                          │
                   ├────── { type: "finish_session" } ───────►│
                   │                                          │ (Builds vault ZIP)
                   │◄── { type: "session_finished", zip } ────┤
                   │                                          │
```

### 4.1 Error & Cancellation Handling in Worker Client
- If the user clicks `[ Cancel Conversion ]`, `worker_client.js` immediately posts `{ type: "abort_session" }`.
- If Pyodide crashes or throws an unhandled WASM exception, the worker catches it, returns `{ type: "error", error: message }`, and `worker_client.js` safely rejects the corresponding note promise.
- If the worker thread becomes unresponsive for $> 60\text{ seconds}$, `worker_client.js` terminates the worker instance (`worker.terminate()`), reinstantiates a clean worker, and alerts the user.

---

## 5. Phased Implementation Roadmap

Implementation must proceed in logical, verified stages:

### Phase 1: Semantic HTML Skeleton & Design System Tokens
- Build `site/index.html` with semantic landmark regions (`<header>`, `<main>`, `<section>`, `<footer>`, `<dialog>`, and visually hidden `#a11y-announcer`).
- Implement `site/styles.css` with CSS custom properties for Purple-Black Dark and Light themes.
- Implement layout containers: centered tool container (`768px`), dropzone, staged list, progress view, results view, and accordion information sections.

### Phase 2: Core State Machine, Validation & Theme Management
- Implement `site/js/state_machine.js` with verified FSM transitions.
- Implement `site/js/theme.js` with instant switching and `localStorage` persistence.
- Implement `site/js/validation.js` with strict enforcement of `WEB_LIMITS` (50MB / 100MB / 5 files / `.sdocx` extension).
- Wire State 1 (Idle / Drop Zone) and State 2 (Staged Review) with drag-and-drop feedback.

### Phase 3: Large File Advisory Modal & Accessibility
- Implement `site/js/modal.js` with accessible `<dialog>` or `role="dialog"` modal.
- Implement keyboard focus trapping inside the modal.
- Wire `[ Convert ]` button to evaluate staged file sizes: if $\ge 1$ note is $\ge 25\text{ MB}$, open confirmation modal before progressing; otherwise progress directly.

### Phase 4: Worker Client & Live Conversion Pipeline
- Implement `site/js/worker_client.js` with complete request correlation.
- Wire State 3 (Active Conversion):
  - Global progress bar animation.
  - Per-note status chips (`Waiting`, `Converting`, `Converted`, `Failed`).
  - Active note ticker text.
  - `[ Cancel Conversion ]` abort flow.

### Phase 5: Results View, Vault Export & Integrated Preview
- Wire State 4 (Results):
  - Success banner with note & asset tally.
  - One-click primary `[ Download Obsidian Vault (.zip) ]` button creating and revoking Object URL.
  - Implement `site/js/preview.js`: integrated code container rendering raw text via `textContent` (MD-3), note selector dropdown, and `[ Copy Markdown ]` button.
  - Wire partial failure rows with safe GitHub issue report links (`site/js/issue_link.js`).
  - `[ Convert More Notes ]` session reset.

### Phase 6: Edge Cases, Responsive Optimization & Testing
- Implement mobile layout optimizations (sticky bottom action bar on viewports $\le 640\text{px}$, touch target sizing $\ge 44\text{px}$).
- Verify high-contrast dark and light themes against WCAG 2.2 AA.
- Write automated unit tests in `site/tests/` using Node.js test runner covering `state_machine.js`, `validation.js`, `issue_link.js`, and `preview.js`.

---

## 6. Verification Strategy & Gate Requirements

Before completing any frontend implementation phase, the following verification gates must pass:

1. **Frontend Unit Tests:**
   ```bash
   npm --prefix site test
   ```
   Must pass all tests without failures.
2. **Repository Verification Gate (AGENTS.md):**
   ```bash
   pytest
   mypy --strict src tests
   ruff check src tests
   python scripts/check.py
   ```
   All 4 commands must pass with zero errors, zero warnings, and 0 architecture boundary violations.
3. **Manual Browser Verification:**
   - Test converting standard `.sdocx` notes in both dark and light modes.
   - Test note $\ge 25\text{ MB}$ to verify Large File Advisory modal triggers and behaves properly.
   - Test invalid/corrupt file to verify graceful failure handling and content-free issue link.
   - Test mobile viewport ($375\text{px}$ width) to verify touch targets and sticky action button.
