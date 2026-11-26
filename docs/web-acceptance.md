# Web Deployment Acceptance & Operations Manual

This document details the production hosting configuration, privacy verification audit, maintainer acceptance checklist, emergency shutoff procedure, and Lighthouse audit guidelines for the `sdocx2obsidian` browser-based web utility.

---

## 1. Static Hosting Configuration

The web application is hosted as a static asset deployment on **Cloudflare Workers** (`https://sdocx2obsidian.abhay-gugale153.workers.dev/`) with zero server-side runtime code.

### Configuration (`site/wrangler.jsonc` & `site/public/_headers`)
- **Root Directory:** `site`
- **Build Command:** `pnpm run build` (runs `tsc && vite build && node ../scripts/prerender.js`)
- **Deploy Command:** `npx wrangler deploy`
- **Static Assets Directory (`site/wrangler.jsonc`):** `./dist` with `"not_found_handling": "404-page"` (serves prerendered route HTML files and `404.html`)
- **Security Headers (`site/public/_headers`):**
  - `Content-Security-Policy`: `default-src 'none'; script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self' ws: https://cloudflareinsights.com; img-src 'self' data:; font-src 'self'; manifest-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none';`
  - `X-Content-Type-Options`: `nosniff`
  - `X-Frame-Options`: `DENY`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=(), browsing-topics=()`
- **MIME Types (`site/public/_headers`):**
  - `application/wasm` for `/vendor/pyodide/*.wasm`
  - `application/octet-stream` for `/vendor/*.whl`
  - `application/manifest+json` for `/site.webmanifest`
  - `image/svg+xml` for `/favicon.svg`
  - `text/plain` for `/robots.txt`
  - `application/xml` for `/sitemap.xml`
- **Caching Strategy (`site/public/_headers`):**
  - Hashed Vite assets (`/assets/*`) and pinned vendor runtime (`/vendor/pyodide/*`, `/vendor/*.whl`): `public, max-age=31536000, immutable`
  - Metadata files (`/site.webmanifest`, `/favicon.svg`, `/robots.txt`, `/sitemap.xml`): `public, max-age=86400`

---

## 2. Pinned Runtime & Update Procedure

### Pinned Versions
- **Pyodide Runtime:** `v0.26.4` (CPython 3.12.1 WebAssembly)
  - Files vendored in `site/vendor/pyodide/`:
    - `pyodide.js`, `pyodide.mjs`, `pyodide.asm.js`, `pyodide.asm.wasm`
    - `python_stdlib.zip`, `pyodide-lock.json`, `package.json`
- **Core Library Wheel:** `sdocx2obsidian-0.1.0-py3-none-any.whl`
  - Built pure-Python wheel vendored in `site/vendor/`

### Wheel Rebuild Procedure
Whenever Python source files in `src/sdocx2obsidian/` change:
1. Run the standalone builder:
   ```bash
   python scripts/build_wheel.py
   ```
2. Copy the resulting wheel from `dist/` to `site/vendor/`:
   ```bash
   cp dist/sdocx2obsidian-0.1.0-py3-none-any.whl site/vendor/
   ```
3. Run the integration test suite:
   ```bash
   cd site && pnpm run build && pnpm test
   ```

### Pyodide Update Procedure
To upgrade the Pyodide runtime in the future:
1. Download official Pyodide release artifacts for the target version into a temporary folder.
2. Replace files under `site/vendor/pyodide/`.
3. Verify that `python_stdlib.zip` and WASM binaries match official release checksums.
4. Execute `cd site && pnpm test` to verify Node/WASM integration passes.

---

## 3. Privacy Statement Verification & Network Trace Audit

### Privacy Guarantee
> "The page converts notes entirely in the browser; files are never uploaded; nothing is stored; closing or refreshing the tab discards everything; the code is open source."

### Network Audit Protocol
During conversion in the browser:
1. **Initial Page Load:**
   - `GET /` (prerendered `index.html`)
   - `GET /assets/index-*.css` and `GET /assets/index-*.js`
   - `GET /worker.js`
   - `GET /vendor/pyodide/pyodide.js`
   - `GET /vendor/pyodide/pyodide.asm.js`
   - `GET /vendor/pyodide/pyodide.asm.wasm`
   - `GET /vendor/pyodide/python_stdlib.zip`
   - `GET /vendor/sdocx2obsidian-0.1.0-py3-none-any.whl`
   *All conversion assets are same-origin HTTP GETs. Optional Cloudflare Web Analytics beacon only loads if `VITE_CF_ANALYTICS_TOKEN` is configured at build time.*
2. **During & After File Conversion:**
   - **Zero note-data HTTP requests** are dispatched.
   - File data remains strictly in `ArrayBuffer` objects in JavaScript memory and the WASM heap.
   - Web Worker transfers memory buffers via `postMessage`.
   - Resulting ZIP file is generated in-memory and downloaded via a local `blob:` Object URL.
   - The `blob:` URL is revoked shortly after the user triggers download.
   - Closing or reloading the tab immediately garbage-collects all buffers.

---

## 4. Maintainer Acceptance Checklist (Web Tool Functionality)

Perform these verification checks on the deployment:

- [ ] **Cross-Browser Execution (Chrome, Firefox, Safari, Edge):** Convert valid `.sdocx` notes; verify WebAssembly loads and produces a valid downloadable Obsidian vault ZIP.
- [ ] **Mobile Device Execution:** Verify files can be selected and converted cleanly without memory crashes.
- [ ] **Cancellation Check:** Trigger a conversion and cancel mid-process; verify worker terminates/aborts cleanly.
- [ ] **Fault Tolerance Check:** Pass corrupted `.sdocx` archives alongside valid notes; verify valid notes succeed, corrupted notes report `Failed` with sanitized issue link, and session completes safely.
- [ ] **Privacy Verification:** Verify zero note data leaves the browser during and after load; verify issue link contains zero private note data.
- [ ] **Obsidian Vault Verification:** Unpack downloaded ZIP into an empty Obsidian vault directory; verify note renders text and embeds images/audio clips seamlessly.

---

## 5. Emergency Shutoff Procedure ("Turn It Off")

If the web tool needs to be taken offline immediately:

1. **Option A: Cloudflare Workers Dashboard (Instant)**
   - Open the Cloudflare dashboard → **Workers & Pages** → select **`sdocx2obsidian`**.
   - Under **Settings** → **Domains & Routes**, disable the `workers.dev` route (or custom routes), or delete the Worker under **Manage** → **Delete**.
2. **Option B: Cloudflare Access / Route Protection**
   - Restrict access via **Cloudflare Zero Trust / Access** policy on the deployed route so public traffic is blocked while maintainers retain access.
3. **Option C: CLI Teardown**
   - Run `npx wrangler delete` inside `site/` to remove the Worker deployment immediately.

---

## 6. Lighthouse Audit Guidelines

Target score: **≥ 90** across Performance, Accessibility, Best Practices, and SEO.

### Audit Steps (in Google Chrome DevTools)
1. Open `https://sdocx2obsidian.abhay-gugale153.workers.dev/` in an Incognito window (disabling extensions).
2. Open Chrome DevTools (`F12`) and select the **Lighthouse** tab.
3. Configure settings:
   - Mode: Navigation
   - Device: Desktop & Mobile (run both)
   - Categories: Performance, Accessibility, Best Practices, SEO
4. Click **Analyze page load**.
5. Verify prerendered routes, semantic landmarks, contrast ratios, CSP headers, canonical URLs, and `sitemap.xml`.
