# Product Brief — sdocx2obsidian Web Frontend

**Document:** `docs/frontend/PRODUCT_BRIEF.md`  
**Status:** Living Design Specification  
**Authority:** Aligned with `docs/srs.md`, `docs/dds.md`, and `docs/web-implementation-brief.md`

---

## 1. Product Overview

`sdocx2obsidian` is an open-source, client-side utility that converts modern Samsung Notes (`.sdocx`) files into an Obsidian-compatible Markdown vault. The web application provides a zero-install, zero-upload tool experience where notes are converted entirely inside the visitor's web browser using WebAssembly (Pyodide).

### 1.1 Core Value Proposition
- **Absolute Privacy (Zero Data Egress):** Notes, typed text, images, and voice recordings never leave the user's computer or phone. Processing runs 100% locally in browser memory.
- **Document Reading Order:** Unlike simplistic ZIP extractors, `sdocx2obsidian` parses the binary Samsung Note format (`note.note`) to interleave text, embedded photos, and audio recordings in their exact original visual reading sequence.
- **Obsidian Native Wikilinks:** Automatically formats embeds using Obsidian's Wikilink syntax (`![[<NoteName>_Assets/<Filename>]]`) with cross-platform forward slashes.
- **Voice Memo Preservation:** Recognizes embedded voice recordings and places them at the top of the note.
- **Clean Vault Standard:** Text-only notes produce zero empty asset subfolders.
- **Instant Unified Export:** Packages the converted notes and asset directories into a single `.zip` file ready to be unpacked directly into an Obsidian vault folder.

---

## 2. Target Users & Personas

### 2.1 The Samsung to Obsidian Migrator
- **Profile:** Students, researchers, and professionals who take quick notes on Samsung Galaxy phones or tablets and want to build a long-term Personal Knowledge Management (PKM) vault in Obsidian.
- **Needs:** Fast batch conversion of multiple exported `.sdocx` notes; zero loss of embedded whiteboard photos or lecture recordings; seamless wikilink resolution in Obsidian.
- **Pain Points with Existing Tools:** Legacy tools either miss media, lose reading order, or require command-line Python installations that casual users find daunting.

### 2.2 The Privacy-Conscious Knowledge Worker
- **Profile:** Users with private journals, medical notes, or proprietary meeting minutes.
- **Needs:** Ironclad guarantees that files are not uploaded to a cloud server, third-party backend, or AI training pipeline.
- **Expectations:** Transparent privacy policy, open-source verification, and offline-capable conversion.

### 2.3 The Mobile Exporter
- **Profile:** Galaxy phone and tablet users exporting directly from the Samsung Notes app share sheet to the browser.
- **Needs:** Mobile-friendly interface, clear warnings regarding memory-heavy notes, and a simple download button that saves the vault `.zip` directly to mobile device storage.

---

## 3. High-Level User Journey (iLovePDF Inspiration)

Inspired by the direct, task-focused workflow of single-purpose web utilities like iLovePDF, the user journey is structured as a linear, distraction-free flow:

```
[ 1. Land / Tool Hero ]
         │
         ▼
[ 2. Select or Drop .sdocx Files ]
         │
         ▼
[ 3. Review & Manage Staged Files ]
         │
         ├─► [ (If File ≥ 25 MB) Memory Confirmation Advisory ]
         │
         ▼
[ 4. Convert (Live Progress & Per-Note Feedback) ]
         │
         ▼
[ 5. Download Vault ZIP & Integrated Markdown Preview ]
         │
         ▼
[ 6. Convert More Notes / Reset ]
```

1. **Discovery & Intent:** The user lands directly on the tool. The primary action ("Select .sdocx files") is immediate and prominent.
2. **Staging & Validation:** User drops or chooses files. The tool displays the staged notes, individual sizes, and cumulative session size. Files can be added or removed before starting.
3. **Pre-Flight Safety Check:** If any note is $\ge 25\text{ MB}$, a confirmation dialog warns mobile/low-RAM users about browser memory pressure before heavy conversion starts.
4. **Active Conversion:** The Web Worker starts the Pyodide WebAssembly runtime and processes notes sequentially. The user sees a real-time progress bar and individual note status chips (`Waiting`, `Converting...`, `Converted`).
5. **Output & Verification:** The user downloads the generated vault `.zip` with one click. An integrated Markdown preview allows them to inspect converted notes before opening Obsidian.

---

## 4. Implemented Functionality vs. Proposed Frontend Improvements

To ensure accuracy, the following table distinguishes what is **already implemented** in the project's backend and Web Worker from what is **proposed** for this frontend redesign:

| Feature Area | Current Implementation (Codebase & Engine) | Proposed Frontend Redesign |
|---|---|---|
| **Conversion Engine** | Pure-Python package compiled to wheel; executed in Pyodide v0.26.4 inside `site/worker.js`. | **Preserved:** Driven via identical asynchronous `postMessage` protocol without engine changes. |
| **Visual Identity** | Minimal baseline stylesheet; previously Deep Teal (`#0B7A75`). | **Proposed Improvement:** Modern **purple-black** theme evoking Obsidian's dark palette, with high-contrast dark and light modes. |
| **Workspace Layout** | Basic centered card with prompt text. | **Proposed Improvement:** Tool-centric, iLovePDF-inspired layout with focused staging workspace, progress tracking, and collapsible info cards. |
| **Markdown Preview** | Pop-up modal dialog rendering raw text via `textContent` (`preview.js`). | **Proposed Improvement:** **Integrated preview** embedded directly within the results view, allowing fluid note inspection alongside the download button. |
| **Mobile Experience** | Static warning banner at the top of the page. | **Proposed Improvement:** Conditional confirmation modal for notes $\ge 25\text{ MB}$, plus sticky bottom action bar on mobile viewports ($\le 640\text{ px}$). |
| **File Staging** | Immediate conversion on drop/select. | **Proposed Improvement:** Dedicated "Files Chosen" stage allowing review, deletion of accidental files, and adding more files before converting. |
| **Issue Reporting** | Content-free GitHub issue link generator (`issue_link.js`). | **Preserved:** Integrated cleanly into failed note rows with zero private note data in the URL. |

---

## 5. Non-Functional & Technical Constraints

1. **Modern React + TypeScript Architecture:** Built with React 18, TypeScript 5, Vite, and `react-router-dom` for component-based modularity, type safety, and clean client-side routing (`/`, `/features`, `/how-it-works`, `/preview`, `/limitations`).
2. **Content Security Policy (CSP):** The site must strictly comply with:
   ```text
   default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' ws:; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none';
   ```
3. **Safety Caps (`WEB_LIMITS`):**
   - Maximum upload size per file: 50 MB
   - Maximum total session input: 100 MB
   - Maximum file count per session: 5 notes
4. **Plain-Text Preview Rule (MD-3):** All note previews must use secure `textContent` assignment. No HTML parsing or DOMPurify, and note images/audio are never rendered in the preview.
5. **Static SPA Hosting:** Deployed via Vercel (`outputDirectory: "site/dist"`) with security headers, long-lived vendor caching, and SPA rewrites for direct subpage access configured in `vercel.json`.
