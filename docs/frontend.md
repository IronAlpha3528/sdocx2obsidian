# Frontend Architecture & Specification — sdocx2obsidian

This document is the comprehensive authority for designing, building, and maintaining the web frontend for `sdocx2obsidian`. It details how the frontend connects to the underlying WebAssembly engine, the messaging contracts, runtime constraints, and serves as the living specification for the user interface.

---

## 1. Project Integration Architecture

The web interface lives in the [`site/`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/site/) directory. It operates as a modern React 18 + TypeScript single-page application (SPA) built with Vite and client-side routing via `react-router-dom`. It is hosted on Vercel as a static SPA deployment with zero server components and zero network data egress.

```
site/
├── index.html            # Clean HTML entry point for Vite
├── package.json          # Dependencies & build scripts (React 18, react-router-dom, Vite, Lucide)
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration with raw static middleware for Pyodide
├── vercel.json           # Vercel deployment config with SPA rewrites & security headers
├── worker.js             # Headless Web Worker executing Pyodide WebAssembly
├── src/
│   ├── main.tsx          # Application root with BrowserRouter
│   ├── App.tsx           # Route layout with Navbar, Routes, and Footer
│   ├── types/
│   │   └── index.ts      # TypeScript interfaces (NoteResult, StagedFile, ViewState, etc.)
│   ├── hooks/
│   │   ├── useConverter.ts # Custom hook for worker lifecycle, state machine & postMessage
│   │   └── useTheme.ts   # Dark/light theme state & toggle hook
│   ├── utils/
│   │   ├── validation.ts # File extension, batch limit, & size validation
│   │   └── issueLink.ts  # Content-free issue URL generator (MD-6)
│   ├── components/
│   │   ├── Navbar.tsx    # Responsive navigation bar with NavLinks & theme toggle
│   │   ├── Footer.tsx    # Product footer with internal links & repository details
│   │   ├── ScrollToTop.tsx # Route change window scroll reset
│   │   ├── HeroSection.tsx # Hero headline, value props, & quick actions
│   │   ├── ConverterWorkspace.tsx # Multi-file upload, drop zone & conversion engine UI
│   │   ├── StagedFileList.tsx # File list with size chips & removal actions
│   │   ├── BatchProgressBar.tsx # Conversion progress bar & per-note statuses
│   │   ├── ResultCard.tsx# Converted vault ZIP download & summary stats
│   │   ├── PreviewModal.tsx # Safe plain-text Markdown viewer (MD-3)
│   │   └── LargeFileModal.tsx # Mobile memory warning modal (≥25 MB notes)
│   └── pages/
│       ├── HomePage.tsx  # Full landing page with converter workspace & showcases
│       ├── FeaturesPage.tsx # In-depth features, WASM architecture, reading order
│       ├── HowItWorksPage.tsx # Visual 5-step conversion pipeline walkthrough
│       ├── PreviewPage.tsx # Interactive note & vault preview showcase
│       └── LimitationsPage.tsx # Format support matrix & Samsung stroke limitations
├── tests/
│   └── validation.test.js # Node native test suite for validation & issue link helpers
└── vendor/
    ├── pyodide/          # Pinned Pyodide v0.26.4 runtime & stdlib (WASM)
    └── sdocx2obsidian-*.whl # Pure-Python wheel compiled from src/
```

### 1.1 The Web Worker Bridge (`worker.js`)
The UI thread never executes Python code directly. All WebAssembly execution runs in a dedicated background Web Worker thread:
1. **Bootstrap:** The worker initializes Pyodide from `vendor/pyodide/pyodide.mjs`.
2. **Wheel Mount:** It unpacks the local `sdocx2obsidian` pure-Python wheel into Pyodide's in-memory filesystem (`/lib/python3.12/site-packages`) using standard Python `zipfile`.
3. **Session Management:** It interfaces with `sdocx2obsidian.web.adapter.ConversionSession`.

### 1.2 Client-Side Routing Architecture (`react-router-dom`)
The web application uses React Router v7 (`react-router-dom`) with HTML5 History API (`BrowserRouter`) to provide clean, natural URLs:
- `/` — Full-page landing page featuring the Hero, Interactive Converter Workspace, Feature highlights, Workflow walkthrough, Vault Preview showcase, Limitations overview, and Final CTA.
- `/features` — Dedicated deep-dive page detailing in-browser WebAssembly isolation, document sequential reading order, Wikilink embedding, Unicode fidelity, and clean vault rules.
- `/how-it-works` — Step-by-step visual walkthrough of the 5-phase conversion pipeline (Unpack, Validate, Extract, Format, Bundle).
- `/preview` — Interactive showcase comparing original Samsung Notes against converted Obsidian Markdown output and vault asset tree.
- `/limitations` — Comprehensive format support matrix, explaining what is preserved and why Samsung S-Pen vector strokes cannot be converted without rasterization.

All route transitions trigger an automatic scroll reset to top (`ScrollToTop.tsx`). For production deployment on Vercel or static hosts, SPA rewrites redirect subpage paths to `/index.html` while preserving raw static access to `/vendor/`, `/worker.js`, and `/assets/`.

---

## 2. Worker Protocol Contract (`postMessage`)

The UI communicates with `worker.js` via structured asynchronous messages:

### 2.1 UI → Worker (Commands)
| Message Type | Payload | Description |
|---|---|---|
| `start_session` | *(none)* | Initializes an in-memory session with `WEB_LIMITS`. |
| `convert_note` | `{ filename: string, data: ArrayBuffer }` | Passes raw `.sdocx` archive buffer into Python memory. |
| `finish_session` | *(none)* | Instructs Python to bundle all converted notes and media folders into a vault ZIP. |
| `abort_session` | *(none)* | Aborts conversion and cleans up in-memory staging directories. |

### 2.2 Worker → UI (Events)
| Event Type | Payload | Description |
|---|---|---|
| `session_started` | *(none)* | Runtime is ready; UI may begin dispatching `convert_note`. |
| `note_result` | `{ result: NoteResult }` | Per-file result containing status (`success`/`failed`), `markdown_name`, `markdown_text`, `asset_count`, `warnings`, `error_code`, and `message`. |
| `session_finished` | `{ zipBytes: ArrayBuffer, outcome }` | Vault ZIP bytes returned as an ArrayBuffer for instant client-side download. |
| `error` | `{ error: string }` | Unhandled runtime or WebAssembly error. |

---

## 3. Mandatory Non-Functional & Security Constraints

Every frontend implementation must strictly comply with these rules:

1. **Zero Data Egress:** After initial page load, **zero network requests** may leave the browser. Notes, text, and media remain strictly in client memory.
2. **Strict Content Security Policy (CSP):**
   ```text
   default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; worker-src 'self' blob:; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none';
   ```
   - No external CDNs, fonts, analytics, or trackers.
   - All assets, icons, and scripts must be self-hosted.
3. **Plain-Text Preview Rule (MD-3):** Markdown previews must be rendered using `textContent` assignment only. No HTML parsing, sanitizers, or DOM rendering of note content.
4. **Sanitized Issue Reporting (MD-6):** Issue links generated for failed notes must contain strictly: tool version, runtime version, error code, coarse file-size bucket, and browser family. **Never** include note titles, filenames, or note text.
5. **Safety Limits (`WEB_LIMITS`):**
   - Max file size: 50 MB per `.sdocx` archive.
   - Max session budget: 100 MB total.
   - Max batch count: 5 files per session.
6. **Mobile Memory Advisory:** Large files ($\ge 25\text{ MB}$) place heavy demand on mobile browser memory. The frontend must advise users accordingly.

---

## 4. Frontend Features & User Capabilities

The frontend provides the following set of user-facing capabilities:

### 4.1 Batch File Selection & Staging
- **Dual Input Methods:** Select files via native file picker dialog or drag-and-drop directly onto an interactive drop zone.
- **Multi-File Batching:** Select and convert multiple notes simultaneously (up to 5 notes per session).
- **Pre-Conversion Review:** Inspect selected file list with note names, individual human-readable file sizes (e.g. `14.2 MB`), and total batch size tally before conversion starts.
- **Interactive File Management:** Remove individual files from the staged list or append additional files.
- **Client-Side Pre-Validation:** Validates `.sdocx` extension, alerts on non-supported formats, caps batches at 5 files, and flags files exceeding the 50 MB per-file safety limit.

### 4.2 In-Browser WebAssembly Conversion
- **100% Client-Side Processing:** Conversion executes entirely inside the browser using Pyodide (Python 3.12 WebAssembly) running in a background Web Worker, ensuring zero server compute and a fully responsive UI.
- **Document Reading Order:** Preserves the exact inline sequential order of typed paragraphs, raster images (PNG, JPG, GIF, WebP), and attached audio clips (M4A, AMR, MP3, WAV, OGG).
- **Voice Recording Anchoring:** Unreferenced voice recordings captured inside Samsung Notes are automatically recognized and anchored at the top of the note.
- **Native Obsidian Wikilinks:** Embeds all media using `![[<NoteName>_Assets/<Filename>]]` with forward slashes for cross-platform vault compatibility.
- **Clean Vault Rule:** Notes containing only typed text produce zero empty `_Assets` subdirectories.
- **Unicode & Emoji Fidelity:** Full preservation of multi-codepoint emojis (including Zero Width Joiner `\u200D` sequences), symbols, and international character sets.

### 4.3 Memory Safety & Large File Confirmation Advisory
- **Large Note Detection:** Automatically checks selected archives against the $25\text{ MB}$ memory threshold.
- **Interactive Confirmation Dialog:** If any file in the batch is $\ge 25\text{ MB}$, a confirmation modal prompts the user before conversion begins, explaining WebAssembly memory usage on mobile/low-RAM devices.
- **User Choice:** The user can explicitly choose to **Continue Conversion** or **Cancel** to abort safely without tab slowdowns or crashes.

### 4.4 Real-Time Progress & Fault Tolerance
- **Progress Tracking:** Live visual progress bar with percentage indicator and item counter (`X of Y notes`).
- **Per-Note Status Chips:** Granular status for each note: `Waiting`, `Converting...`, `Converted`, `Converted with notes` (non-fatal warnings), or `Could not convert`.
- **Fault-Tolerant Batching:** Corrupted or malformed notes fail individually with clean diagnostic messages; valid notes in the batch continue converting to completion.
- **Screen Reader Accessibility:** Live polite region (`aria-live="polite"`) announcing state changes, progress milestones, and completion for assistive technology.

### 4.5 User Control & Immediate Cancellation
- **Instant Cancel:** Users can cancel conversion at any point during runtime loading or active conversion via background worker termination (`worker.terminate()`).
- **Selection Preservation on Cancel:** Cancelling returns users to their staged file list so selections are not lost.

### 4.6 Obsidian Vault Export & Safe Preview
- **Single Vault ZIP Download:** One-click download of a unified `.zip` archive containing all generated Markdown notes and asset folders at the root level, ready to extract directly into an Obsidian vault.
- **In-Memory Deterministic Packaging:** Output ZIP is generated entirely in browser memory with uncompressed media (`ZIP_STORED`), compressed text, and fixed timestamps.
- **Safe Plain-Text Preview (MD-3):** View generated Markdown output directly in the browser using safe `textContent` assignment (zero HTML parsing; note media is never rendered).
- **Copy to Clipboard:** Quick "Copy text" action in the preview modal with instant visual feedback.

### 4.7 Privacy & Sanitized Issue Reporting
- **Absolute Privacy (Zero Data Egress):** Files, notes, and media never leave the user's browser or touch external servers.
- **Content-Free Issue Reporting (MD-6):** Generates pre-filled GitHub issue links for failed notes containing only environment metadata (tool version, error code, coarse size bucket, browser) with zero note titles, filenames, or private note text.
- **Clean Session Reset:** "Convert more notes" / Start over action that terminates workers, revokes object URLs, and resets the interface cleanly back to idle.

---

## 5. Design Specifications & Document Package

The complete frontend design specifications, UX workflows, visual design tokens, and technical requirements have been established and documented across seven detailed specifications in the [`docs/frontend/`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/docs/frontend/) directory:

1. **[`PRODUCT_BRIEF.md`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/docs/frontend/PRODUCT_BRIEF.md)**: Product overview, target users, core goals, user journey, and technical constraints.
2. **[`UI_UX_SPEC.md`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/docs/frontend/UI_UX_SPEC.md)**: Page structure, information hierarchy, multi-route navigation, converter workspace, responsive breakpoints, and accessibility.
3. **[`DESIGN_SYSTEM.md`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/docs/frontend/DESIGN_SYSTEM.md)**: Professional blue, cool-grey, and off-white color tokens (inspired by MDView), typography scales, spacing tokens, dark/light themes, and component styling.
4. **[`USER_FLOW_AND_STATES.md`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/docs/frontend/USER_FLOW_AND_STATES.md)**: Session lifecycle, application state transitions (IDLE, READY, CONVERTING, FINISHED, ERROR), edge cases, and error recovery.
5. **[`FRONTEND_IMPLEMENTATION_PLAN.md`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/docs/frontend/FRONTEND_IMPLEMENTATION_PLAN.md)**: React 18 + TypeScript + Vite + `react-router-dom` architecture, component breakdown, Web Worker communication hook (`useConverter`), and Vercel routing configuration.
6. **[`VISUAL_REFERENCES.md`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/docs/frontend/VISUAL_REFERENCES.md)**: Design inspiration analysis (MDView aesthetics and iLovePDF conversion usability), layout patterns, and explicit anti-patterns.
7. **[`ACCEPTANCE_CRITERIA.md`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/docs/frontend/ACCEPTANCE_CRITERIA.md)**: Verifiable functional, visual, responsive, accessibility, and technical acceptance criteria.

### 5.1 Visual Identity Summary
- **Color Palette:** Professional blue (`#2563eb`), cool slate neutrals (`#f8fafc`, `#f1f5f9`), and dark slate backgrounds (`#090d16`, `#0f172a`).
- **Typography:** Modern clean sans-serif system stack (`Inter`, system-ui, -apple-system, sans-serif) for prose and navigation; monospace (`ui-monospace`, `SFMono-Regular`, `Consolas`) for code, tokens, and Markdown previews.
- **Theme Support:** First-class dark and light themes with automatic system preference detection and explicit manual toggling with local storage persistence.
- **Component Design:** Clean borders, subtle elevation, and actionable buttons inspired by MDView and iLovePDF, avoiding heavy glassmorphism, saturated neon gradients, or decorative clutter.
