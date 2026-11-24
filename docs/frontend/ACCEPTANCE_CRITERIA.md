# Frontend Acceptance Criteria — sdocx2obsidian

**Document:** `docs/frontend/ACCEPTANCE_CRITERIA.md`  
**Status:** Living Verification Specification  
**Authority:** Aligned with `docs/frontend/PRODUCT_BRIEF.md`, `docs/frontend/UI_UX_SPEC.md`, `docs/frontend/DESIGN_SYSTEM.md`, and `docs/web-acceptance.md`

---

## 1. Overview

This document specifies the exact, testable criteria required for accepting the redesigned `sdocx2obsidian` web frontend. Every criterion is phrased as a verifiable condition that an automated test suite or manual QA auditor can validate.

---

## 2. Functional Acceptance Criteria

### 2.1 File Ingestion & Drag-and-Drop (State 1: Idle)
- [ ] **AC-F1.1:** Dragging a file over the drop zone adds visual drag-over styling (accent purple solid border and tinted background). Dragging out restores normal styling.
- [ ] **AC-F1.2:** Dropping or selecting 1 to 5 valid `.sdocx` files transitions the application immediately to State 2 (Staging Review).
- [ ] **AC-F1.3:** Attempting to drop or select a non-`.sdocx` file rejects the file and displays an immediate user warning (*"Only .sdocx files supported"*).
- [ ] **AC-F1.4:** Attempting to select more than 5 files rejects the excess files and warns the user of the 5-file batch limit.
- [ ] **AC-F1.5:** Attempting to add a file exceeding 50 MB rejects the file with a clear limit advisory.
- [ ] **AC-F1.6:** Attempting to add files causing the cumulative batch size to exceed 100 MB rejects the overflowing files with a size advisory.

### 2.2 Staging & Pre-Flight Review (State 2: Staged Files)
- [ ] **AC-F2.1:** Each staged file displays its full filename (or ellipsis-truncated label with full tooltip), human-readable file size (e.g., `4.2 MB`), and a delete button.
- [ ] **AC-F2.2:** Clicking the remove button (`[×]`) removes that specific file and dynamically updates the aggregate file count and total size tally.
- [ ] **AC-F2.3:** Removing all staged files returns the application cleanly to State 1 (Idle).
- [ ] **AC-F2.4:** The `[+ Add More Files]` action allows appending additional `.sdocx` files up to the 5-file limit.
- [ ] **AC-F2.5:** The primary `[ Convert X Notes to Obsidian ]` button displays the exact number of staged notes.

### 2.3 Large File Confirmation Advisory
- [ ] **AC-F3.1:** If any staged file is $\ge 25\text{ MB}$, clicking `[ Convert ... ]` intercepts the flow and opens the Large File Confirmation Modal.
- [ ] **AC-F3.2:** The modal lists the specific large file(s) and explains potential memory pressure on mobile devices.
- [ ] **AC-F3.3:** Clicking `[ Cancel / Review ]` or pressing the `Escape` key closes the modal and keeps the files in State 2 without starting conversion.
- [ ] **AC-F3.4:** Clicking `[ Continue Conversion ]` closes the modal and immediately proceeds to conversion (State 3).
- [ ] **AC-F3.5:** If no staged files are $\ge 25\text{ MB}$, conversion proceeds directly to State 3 without displaying the modal.

### 2.4 Conversion Progress & Worker Communication (State 3: In Progress)
- [ ] **AC-F4.1:** The global progress bar smoothly updates from 0% to 100% based on worker progress events.
- [ ] **AC-F4.2:** Active note ticker text accurately reflects current operations (e.g., *"Starting Python engine..."*, *"Converting note 2 of 3..."*, *"Packaging vault..."*).
- [ ] **AC-F4.3:** Note list displays live status chips: `Waiting` (pending), `Converting...` (active), `Converted` (success), `Failed` (error).
- [ ] **AC-F4.4:** Clicking `[ Cancel Conversion ]` sends `abort_session` to the Web Worker, halts processing, and resets safely to an idle or cancelled state without unhandled promise rejections.

### 2.5 Results, Export & Integrated Markdown Preview (State 4: Done)
- [ ] **AC-F5.1:** On completion, the primary `[ Download Obsidian Vault (.zip) ]` button is prominently displayed with the final ZIP file size.
- [ ] **AC-F5.2:** Clicking the download button triggers a browser download of `obsidian_vault.zip` containing the converted `.md` files and asset directories.
- [ ] **AC-F5.3:** Text-only notes in the vault ZIP produce zero empty asset subfolders.
- [ ] **AC-F5.4:** The integrated preview panel displays the converted Markdown of the first note directly inside the results view.
- [ ] **AC-F5.5:** For multi-note batches, a clean dropdown selector allows the user to switch between previewed notes without reloading or opening modals.
- [ ] **AC-F5.6:** Clicking `[ Copy Markdown ]` copies the current previewed Markdown text to the clipboard and gives brief visual confirmation (*"Copied!"*).
- [ ] **AC-F5.7:** Clicking `[ Convert More Notes ]` revokes the ZIP blob URL and resets the application cleanly to State 1.

### 2.6 Error Resilience & Safe Issue Reporting
- [ ] **AC-F6.1:** If a corrupt `.sdocx` file fails conversion, that note is marked `Failed` with an informative error message, while valid notes in the batch convert successfully.
- [ ] **AC-F6.2:** A failed note displays a `[ Report Issue on GitHub ]` button.
- [ ] **AC-F6.3:** The generated issue URL pre-fills environment data and error classifications, but contains **zero private user note text, titles, or filenames** (MD-6).

---

## 3. Visual & Design System Criteria

- [ ] **AC-V1:** The default visual identity uses the **Purple-Black** theme with canvas `#0c0a12`, surface `#14111d`, and accent purple `#7c3aed` / `#a855f7`.
- [ ] **AC-V2:** A theme toggle allows instant switching between Dark and Light themes. The selected theme persists in `localStorage`.
- [ ] **AC-V3:** Contrast ratios meet or exceed WCAG 2.2 AA standards:
  - Normal text vs background $\ge 4.5:1$ in both themes.
  - Large text and interactive borders $\ge 3:1$ in both themes.
- [ ] **AC-V4:** Visual hierarchy is border-driven (1px solid borders) without heavy drop-shadows, glow filters, or glassmorphism blurs.
- [ ] **AC-V5:** Micro-interactions (hover, active, focus) complete within 120ms–200ms using smooth standard easings.
- [ ] **AC-V6:** When `prefers-reduced-motion: reduce` is active in the OS, all transitions and animations are disabled or reduced to $\le 0.01\text{ms}$.

---

## 4. Responsive & Layout Criteria

- [ ] **AC-R1 (Desktop $\ge 1024\text{px}$):** Converter tool container is centered horizontally with a max width of `768px`.
- [ ] **AC-R2 (Tablet $640\text{px} - 1023\text{px}$):** Tool container scales with `24px` page margins. Integrated preview max-height is constrained to `360px` with vertical scrolling.
- [ ] **AC-R3 (Mobile $< 640\text{px}$):** Tool container spans full viewport width (`margin: 0 12px`).
- [ ] **AC-R4 (Mobile Sticky Bar):** On mobile viewports, the primary action button (`[ Convert ... ]` or `[ Download ... ]`) pins to a sticky bottom bar if the user scrolls.
- [ ] **AC-R5 (Touch Targets):** All interactive buttons, remove icons, and dropdown toggles have a minimum tap area of $44\text{px} \times 44\text{px}$.

---

## 5. Accessibility Criteria (WCAG 2.2 AA)

- [ ] **AC-A1 (Keyboard Navigation):** All interactive controls can be navigated using `Tab` and `Shift+Tab`, activated using `Enter` or `Space`, and dismissed using `Escape`.
- [ ] **AC-A2 (Focus Indicator):** Every focused element displays a high-visibility focus ring (`2px solid var(--border-focus)` with `2px` offset).
- [ ] **AC-A3 (Modal Focus Trap):** When the Large File Confirmation Modal opens, keyboard focus is trapped within the dialog. Pressing `Escape` closes the modal and returns focus to the trigger button.
- [ ] **AC-A4 (Screen Reader Announcer):** An invisible `aria-live="polite"` region announces key state changes (file staging, conversion start, note completions, and final vault readiness).
- [ ] **AC-A5 (Semantic Markup):** Landmarks `<header>`, `<main>`, `<section>`, `<footer>`, and `<dialog>` are correctly structured with appropriate headings (`<h1>`, `<h2>`, `<h3>`).

---

## 6. Technical & Security Boundaries

- [ ] **AC-T1 (Strict CSP):** All assets load and function properly under the declared Content Security Policy:
  ```text
  default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' ws:; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none';
  ```
- [ ] **AC-T2 (Zero External Requests):** Network monitoring confirms zero HTTP requests to external origins during page load, conversion, preview, and download.
- [ ] **AC-T3 (React SPA Architecture):** Frontend is built with React 18, TypeScript 5, Vite, and `react-router-dom` using HTML5 History API path routing (`/`, `/features`, `/how-it-works`, `/preview`, `/limitations`).
- [ ] **AC-T4 (Safe Markdown Inspection - MD-3):** Converted Markdown preview strictly uses `element.textContent = markdown` inside `<pre><code>`. No `innerHTML` or HTML parsing is permitted.
- [ ] **AC-T5 (Worker Preservation):** The existing `site/worker.js` and Pyodide v0.26.4 runtime integration is preserved without modification to the core engine.
- [ ] **AC-T6 (Test Suite Passing):** All tests pass via `npm --prefix site test` and repository verification gate (`pytest`, `mypy --strict src tests`, `ruff check src tests`, `python scripts/check.py`).
