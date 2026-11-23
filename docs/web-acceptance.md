# Web Deployment Acceptance & Operations Manual

This document details the production hosting configuration, privacy verification audit, maintainer acceptance checklist, emergency shutoff procedure, and Lighthouse audit guidelines for the `sdocx2obsidian` browser-based web utility.

---

## 1. Static Hosting Configuration

The web application is hosted as a completely static site on Vercel without serverless functions.

### Configuration (`vercel.json`)
- **Root Directory:** `site/` (or repository root pointing to `outputDirectory: "site"`)
- **Clean URLs:** Enabled (`cleanUrls: true`)
- **Security Headers:**
  - `Content-Security-Policy`: `default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; worker-src 'self' blob:; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none';`
  - `X-Content-Type-Options`: `nosniff`
  - `X-Frame-Options`: `DENY`
  - `Referrer-Policy`: `no-referrer`
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains`
- **MIME Types:**
  - `application/wasm` for `*.wasm`
  - `application/octet-stream` for `*.whl`
  - `application/zip` for `*.zip`
- **Caching Strategy:**
  - Pinned runtime vendor files (`/vendor/*`): `public, max-age=31536000, immutable`
  - HTML entry points (`index.html`): `public, max-age=0, must-revalidate`

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
   cd site && npm run check
   ```

### Pyodide Update Procedure
To upgrade the Pyodide runtime in the future:
1. Download official Pyodide release artifacts for the target version into a temporary folder.
2. Replace files under `site/vendor/pyodide/`.
3. Verify that `python_stdlib.zip` and WASM binaries match official release checksums.
4. Execute `cd site && npm run check` to verify Node/WASM integration passes.

---

## 3. Privacy Statement Verification & Network Trace Audit

### Privacy Guarantee
> "The page converts notes entirely in the browser; files are never uploaded; nothing is stored; closing or refreshing the tab discards everything; the code is open source."

### Network Audit Protocol
During conversion in the browser:
1. **Initial Page Load:**
   - `GET /` (`index.html`)
   - `GET /styles.css`
   - `GET /app.js` and ES modules in `/js/`
   - `GET /worker.js`
   - `GET /vendor/pyodide/pyodide.mjs`
   - `GET /vendor/pyodide/pyodide.asm.js`
   - `GET /vendor/pyodide/pyodide.asm.wasm`
   - `GET /vendor/pyodide/python_stdlib.zip`
   - `GET /vendor/sdocx2obsidian-0.1.0-py3-none-any.whl`
   *All requests are strictly same-origin HTTP GETs for static code.*
2. **During & After File Conversion:**
   - **Zero HTTP requests** are dispatched.
   - File data remains strictly in `ArrayBuffer` objects in JavaScript memory and the WASM heap.
   - Web Worker transfers memory buffers via `postMessage`.
   - Resulting ZIP file is generated in-memory and downloaded via a local `blob:` Object URL.
   - The `blob:` URL is revoked immediately after the user triggers download.
   - Closing or reloading the tab immediately garbage-collects all buffers.

---

## 4. Maintainer Acceptance Checklist (Web Tool Functionality)

> **Notice:** Specific visual UI layouts and styling details are governed by a separate frontend design document. This checklist verifies core functional behavior.

Perform these verification checks on the deployment:

- [ ] **Cross-Browser Execution (Chrome, Firefox, Safari, Edge):** Convert valid `.sdocx` notes; verify WebAssembly loads and produces a valid downloadable Obsidian vault ZIP.
- [ ] **Mobile Device Execution:** Verify files can be selected and converted cleanly without memory crashes.
- [ ] **Cancellation Check:** Trigger a conversion and cancel mid-process; verify worker terminates cleanly.
- [ ] **Fault Tolerance Check:** Pass corrupted `.sdocx` archives alongside valid notes; verify valid notes succeed, corrupted notes report clean errors, and process exits safely.
- [ ] **Privacy Verification:** Verify zero external network requests leave the browser during and after load; verify issue link contains zero private note data.
- [ ] **Obsidian Vault Verification:** Unpack downloaded ZIP into an empty Obsidian vault directory; verify note renders text and embeds images/audio clips seamlessly.

---

## 5. Emergency Shutoff Procedure ("Turn It Off")

If the web tool needs to be taken offline immediately:

1. **Option A: Vercel Dashboard (Instant)**
   - Navigate to **Project Settings** > **General**.
   - Scroll down to the **Danger Zone**.
   - Click **Pause Project** (or **Delete Project**).
   - The site will immediately stop serving requests with HTTP 404 or 402.

2. **Option B: Password Protection / Deployment Protection**
   - In Vercel Project Settings > **Deployment Protection**.
   - Enable **Vercel Authentication** or **Password Protection**.
   - Prevents public access instantly while keeping the project active for team review.

3. **Option C: DNS / Domain Disconnect**
   - In **Settings** > **Domains**, delete the custom domain or alias.

---

## 6. Lighthouse Audit Guidelines

Target score: **≥ 90** across Performance, Accessibility, Best Practices, and SEO.

### Audit Steps (in Google Chrome DevTools)
1. Open the deployed website in an Incognito window (disabling extensions).
2. Open Chrome DevTools (`F12`) and select the **Lighthouse** tab.
3. Configure settings:
   - Mode: Navigation
   - Device: Desktop & Mobile (run both)
   - Categories: Performance, Accessibility, Best Practices, SEO
4. Click **Analyze page load**.
5. Record scores and verify:
   - **Accessibility:** 100 (clean semantic markup, aria attributes, live announcer, sufficient contrast).
   - **Best Practices:** 100 (CSP, HTTPS, secure headers, no third-party trackers).
   - **SEO:** 100 (meta tags, viewport, descriptive title).
   - **Performance:** ≥ 90 (pure static assets, zero render-blocking frameworks, local fonts).
