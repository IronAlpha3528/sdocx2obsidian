# Frontend Architecture & Specification — sdocx2obsidian

This document describes the current architecture of the `sdocx2obsidian` web frontend in [`site/`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/site/), how it connects to the WebAssembly conversion engine, its build-time prerendering pipeline, and its runtime constraints.

---

## 1. Project Integration Architecture

The web interface lives in [`site/`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/site/). It is a React 18 + TypeScript application built with Vite, routed with `react-router-dom` v7, and statically prerendered at build time via [`scripts/prerender.js`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/scripts/prerender.js). It is hosted as static assets on Cloudflare Workers (`https://sdocx2obsidian.abhay-gugale153.workers.dev/`) using [`site/wrangler.jsonc`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/site/wrangler.jsonc) and [`site/public/_headers`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/site/public/_headers).

```text
site/
├── index.html                  # HTML entry point for Vite
├── package.json                # Dependencies & scripts (React 18, react-router-dom, Vite, TypeScript)
├── tsconfig.json               # TypeScript configuration (strict mode)
├── vite.config.ts              # Vite config + rawStaticServe() for /vendor/ & /worker.js
├── wrangler.jsonc              # Cloudflare Workers static assets config (./dist, 404-page)
├── worker.js                   # Web Worker running Pyodide v0.26.4 & sdocx2obsidian wheel
├── public/
│   ├── _headers                # Cloudflare CSP, security headers, MIME types & caching
│   ├── robots.txt              # Sitemap pointer for workers.dev
│   ├── site.webmanifest        # PWA manifest & app icons
│   └── *.png / favicon.svg     # Generated branding and OG assets
├── src/
│   ├── main.tsx                # Client hydration / mount root with BrowserRouter
│   ├── entry-server.tsx        # SSR StaticRouter render entry used by scripts/prerender.js
│   ├── App.tsx                 # Route layout, conversion orchestration, title sync, JSON-LD
│   ├── site-meta.json          # Single source of truth for SITE_URL & all route metadata
│   ├── seo-config.ts           # Typed SITE_URL, ROUTES_META, and getRouteMeta()
│   ├── styles/theme.css        # Dark-first & light CSS variable design system
│   ├── types/index.ts          # AppState, StagedFile, SessionOutcome, NoteResultPayload
│   ├── hooks/
│   │   ├── useConversionWorker.ts # Web Worker lifecycle, postMessage correlation & abort
│   │   └── useTheme.ts         # Dark/light theme state & localStorage persistence
│   ├── utils/
│   │   ├── validation.ts       # Extension, batch (5), file (50 MB), session (100 MB) checks
│   │   ├── preview.ts          # Safe plain-text preview truncation helper (MD-3)
│   │   └── issueLink.ts        # Content-free GitHub issue URL generator (MD-6)
│   ├── components/
│   │   ├── Navbar.tsx          # Top navigation bar & theme toggle
│   │   ├── Footer.tsx          # Footer links (/faq, /privacy, /about, GitHub, Issues)
│   │   ├── ScrollToTop.tsx     # Scroll reset on route transitions
│   │   ├── ErrorBoundary.tsx   # React render error boundary
│   │   ├── Hero.tsx            # Landing title and zero-upload summary
│   │   ├── ConverterWorkspace.tsx # State-driven workbench container
│   │   ├── DropZone.tsx        # Drag-and-drop & file picker zone
│   │   ├── StagedFiles.tsx     # Staged note list, size totals, ≥25 MB badge, actions
│   │   ├── ConvertingProgress.tsx # Live progress bar, per-note status chips & cancel
│   │   ├── ResultsView.tsx     # Download vault ZIP, per-note outcomes & issue links
│   │   ├── IntegratedPreview.tsx # Safe <pre><code> plain-text Markdown viewer & copy
│   │   └── LargeFileModal.tsx  # Memory advisory modal for ≥25 MB notes
│   └── pages/
│       ├── HomePage.tsx        # / — Hero + ConverterWorkspace
│       ├── FeaturesPage.tsx    # /features — Architecture & capabilities
│       ├── HowItWorksPage.tsx  # /how-it-works — 5-step export & conversion guide
│       ├── PreviewPage.tsx     # /preview — Vault directory tree & Wikilink showcase
│       ├── LimitationsPage.tsx # /limitations — Support matrix & S-Pen ink limitations
│       ├── FAQPage.tsx         # /faq — Export & troubleshooting Q&A + FAQPage JSON-LD
│       ├── PrivacyPage.tsx     # /privacy — Client-side processing & privacy policy
│       ├── AboutPage.tsx       # /about — Version, MIT license & disclaimer
│       └── NotFoundPage.tsx    # /404 — Prerendered 404 page
├── tests/
│   ├── cloudflare_config.test.js # Validates wrangler.jsonc and public/_headers
│   ├── seo_config.test.js      # Validates SITE_URL, ROUTES_META, and getRouteMeta()
│   ├── prerender_output.test.js # Validates prerendered HTML, canonicals, sitemap & assets
│   ├── validation.test.js      # Tests src/utils/validation.ts
│   ├── issue_link.test.js      # Tests src/utils/issueLink.ts
│   ├── preview.test.js         # Tests src/utils/preview.ts
│   └── node_integration.test.js # End-to-end Pyodide + wheel conversion (success & corrupt)
└── vendor/
    ├── pyodide/                # Pinned Pyodide v0.26.4 runtime & stdlib (WASM)
    └── sdocx2obsidian-*.whl    # Pure-Python wheel compiled from src/sdocx2obsidian/
```

### 1.1 The Web Worker Bridge (`worker.js`)
The UI thread never executes Python code directly. All WebAssembly execution runs in a dedicated background Web Worker thread (`site/worker.js`):
1. **Bootstrap:** `importScripts("vendor/pyodide/pyodide.js")` and `loadPyodide({ indexURL: "vendor/pyodide/" })`.
2. **Wheel Mount:** Fetches `vendor/sdocx2obsidian-0.1.0-py3-none-any.whl` and unpacks it into `/lib/python3.12/site-packages` via Python `zipfile`.
3. **Session Management:** Interfaces with `sdocx2obsidian.web.adapter.ConversionSession`.

### 1.2 Routing & Build-Time Prerendering
Routes are defined in [`site/src/App.tsx`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/site/src/App.tsx) and paired with metadata in [`site/src/site-meta.json`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/site/src/site-meta.json):
- `/`, `/features`, `/how-it-works`, `/preview`, `/limitations`, `/faq`, `/privacy`, `/about`, and `/404`.
- During `pnpm run build`, Vite builds the client bundle into `site/dist/`, then [`scripts/prerender.js`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/scripts/prerender.js) builds `src/entry-server.tsx` into `site/dist-ssr/` and generates static HTML files (`dist/index.html`, `dist/<route>/index.html`, `dist/404.html`) plus `dist/sitemap.xml` with canonical and Open Graph tags.

---

## 2. Worker Protocol Contract (`postMessage`)

### 2.1 UI → Worker (Commands)
| Message Type | Payload | Description |
|---|---|---|
| `init` | *(none)* | Boots Pyodide and extracts the `sdocx2obsidian` wheel. |
| `start_session` | *(none)* | Initializes `ConversionSession()` with `WEB_LIMITS`. |
| `convert_note` | `{ filename: string, data: ArrayBuffer }` | Converts raw `.sdocx` archive bytes in Python memory. |
| `finish_session` | *(none)* | Builds `obsidian_vault.zip` bytes and returns session totals. |
| `abort_session` | *(none)* | Calls `session.abort()` to discard temporary in-memory files. |

### 2.2 Worker → UI (Events)
| Event Type | Payload | Description |
|---|---|---|
| `init_done` | `{ id }` | Runtime and wheel ready. |
| `session_started` | `{ id }` | Session initialized. |
| `note_result` | `{ id, result: NoteResultPayload }` | Per-file result (`status`: `"success"` or `"failed"`, `markdown_name`, `markdown_text`, `asset_count`, `warnings`, `error_code`, `message`). |
| `session_finished` | `{ id, zipBytes: ArrayBuffer, outcome }` | Transferred vault ZIP buffer and session summary (`total`, `succeeded`, `failed`, `zip_size`). |
| `session_aborted` | `{ id }` | Session aborted cleanly. |
| `error` | `{ id, error: string }` | Unhandled worker or WebAssembly error. |

---

## 3. Non-Functional & Security Constraints

1. **Zero Note Data Egress:** After static assets load, zero note bytes or metadata leave the browser. (Optional Cloudflare Web Analytics only injects a beacon if `VITE_CF_ANALYTICS_TOKEN` is set at build time.)
2. **Strict Content Security Policy (`site/public/_headers`):**
   ```text
   default-src 'none'; script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' ws: https://cloudflareinsights.com; img-src 'self' data:; font-src 'self'; manifest-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none';
   ```
3. **Plain-Text Preview Rule (MD-3):** Markdown previews render inside `<pre><code>` via React text interpolation / `formatPlainTextPreview()` with zero HTML parsing.
4. **Sanitized Issue Reporting (MD-6):** Issue links generated by [`site/src/utils/issueLink.ts`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/site/src/utils/issueLink.ts) include only tool version, runtime version, error code, coarse file-size bucket, and browser family—never filenames, note titles, or note content.
5. **Safety Limits (`WEB_LIMITS` & `validation.ts`):**
   - Max file size: `50 MB` per `.sdocx` archive (`≥ 25 MB` triggers `LargeFileModal`).
   - Max session budget: `100 MB` total.
   - Max batch count: `5` files per session.

---

## 4. Visual Identity Summary

- **Design System (`site/src/styles/theme.css`):** `mdview.io`-inspired dark-first palette (`#0d1117` canvas, `#191e26` elevated surfaces, `#58a6ff` cobalt accent, `#f0f4f8` headings, `#e6edf3` body) paired with a full light theme (`#f6f7f9` canvas, `#ffffff` surfaces, `#2a6df4` accent, `#e2e4e9` borders).
- **Typography (Self-Hosted):** Bundled via `@fontsource-variable/inter` (`Inter Variable`) for UI/body copy and `@fontsource-variable/source-serif-4` (`Source Serif 4 Variable`) for editorial headings and hero display, plus system monospace stacks for filenames, size metrics, and Markdown previews—served strictly from `'self'` with zero external font CDNs.
- **Layout & Chrome:** `56px` sticky flat navbar with a custom folded-note + Obsidian-crystal SVG logo mark and wordmark, centered dot-grid hero section framing the `760px` Converter Workbench card inside a `1024px` container, and a clean bordered footer.
- **Theme Persistence:** Defaults to `dark` mode on first visit and persists manual toggles in `localStorage` via [`useTheme.ts`](file:///d:/github_repos/CurrentProjects/sdocx2obsidian/site/src/hooks/useTheme.ts).
