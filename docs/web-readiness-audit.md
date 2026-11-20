# Web Deployment Readiness Audit — sdocx2obsidian

**Purpose:** Hand this file to the Antigravity agent. The agent audits the finished local CLI and reports every change needed to run it as a safe, efficient, public web tool (frontend on Vercel, backend on Railway, free tiers).

**This is an audit, not an implementation.** The agent reads, measures, and reports. It changes nothing in the codebase.

---

## 0. Rules of engagement (read first)

1. **Read-only.** Do not edit, create, or delete any file in `src/`, `tests/`, `scripts/`, `docs/srs.md`, `docs/dds.md`, `docs/format.md`, `docs/plan.md`, rules, skills, or workflows. The only file you may create is the report named in section 9.
2. **Authority.** `docs/dds.md` and `docs/srs.md` remain authoritative. Where a web deployment needs something they do not allow or do not cover, list it as a **proposed amendment** with the exact section affected. Do not apply it.
3. **No new dependencies.** If you think one is needed, name it, state why, state the lighter alternative, and list it under maintainer decisions.
4. **Measure, do not guess.** Wherever a section says "measure", run the existing code on the real samples (S1, S2, S5 in `samples/`) and the synthetic builder, then report numbers. If a measurement is impossible, say so and mark the item UNKNOWN.
5. **Evidence for every finding.** Cite the file, module, and function (or DDS section) behind each finding. A finding with no evidence is not accepted.
6. **Git and CI.** Never run `git push`. CI/GitHub Actions stays out of scope; any recommendation that would normally run in CI must be phrased as a local command or script.
7. **Stop and ask** if a DDS contract appears wrong, a sample disagrees with the DDS, or an item below conflicts with a rule.
8. **Platform facts change.** The platform limits in section 2 were checked in November 2026. Re-verify them against the providers' current documentation before relying on them, and state the date you checked.

---

## 1. What is being deployed

A public web tool where a visitor uploads one Samsung Notes `.sdocx` file (possibly a few) and downloads a ZIP containing the Obsidian note and its media folder. No accounts, no stored data.

Facts from the project documents the audit must account for:

| Fact | Source | Why it matters for the web |
|---|---|---|
| Real samples are 2 KB to about 21 MB; the big ones are dominated by one long audio file | `format.md` §1 | Upload limits and memory budgets must fit real notes, not toy files |
| Whole note and media are held in memory | DDS D-10, 9.4 | Memory is the scarcest resource on a free tier |
| Extractor limits: 512 MiB per entry, 1 GiB total, ratio 200:1 over 1 MiB, 5,000 entries | DDS 7.9 | Tuned for a trusted desktop, probably too generous for a public server |
| Processing is strictly sequential | D-08 | No concurrency model exists yet |
| Text locator scans byte regions for valid candidates | DDS 6.10, R-01 | A scanner fed hostile bytes is a denial-of-service candidate |
| Output text is not escaped | D-13, R-06 | Matters if the website ever renders a preview |
| Collision handling (`(1)` suffixes) works against a destination folder | FR-06, DDS 7.10 | A web request has no persistent destination; batch-internal collisions still exist |
| Only `cli.py` may import Typer and Rich; layers enforced by `scripts/check.py` | DDS 3.1, 11 | A web layer is a new composition root and needs a checker rule |
| Failures are per-file and non-fatal; exit codes are CLI-specific | D-11, 7.12 | The web equivalent is HTTP status codes and a per-file result list |
| Runtime dependencies today: Typer and Rich only | DDS 11 | Any web framework is a new dependency |

---

## 1.1 Scope and proportionality (applies to the whole audit)

This is a **small public tool with few expected users**: a hobby project shared with a limited audience, not a service with a traffic or uptime commitment. It is public, so strangers can and will upload hostile or broken files, and personal notes are sensitive. But it does not need production-scale operations.

How to apply this:

1. **Keep full rigor on what protects visitors and the maintainer regardless of traffic:** hostile-archive handling, parser denial-of-service, size and time limits, content-free logging, no stored data, safe file naming, XSS and header basics, pinned and self-hosted dependencies, an honest privacy statement, and a way to switch the site off quickly.
2. **Scale down what only matters at volume:** distributed rate limiting, bot-challenge services, metrics dashboards, load and soak campaigns, multi-environment pipelines, custom domains, and capacity planning. For each, recommend the **lightest adequate measure** (for example a simple per-visitor limit, one cheap alert, one manual load test) or mark it "not needed at this scale" with a one-line reason. Do not recommend heavy infrastructure for its own sake.
3. **Prefer fewer moving parts.** If two designs are both safe, recommend the one with less to maintain, fewer dependencies, and lower cost. This favors the browser-only route (section 3.1) and, for the fallback, a single small backend instance.
4. **Re-label priorities accordingly.** In the report, a check that is a blocker at scale but only "Could" here must be marked "Could" with that reason. A check that protects visitors' data or exposes the maintainer to cost or liability stays "Blocker" or "Should".
5. **Cost stays small and predictable.** Any recommendation that can create an open-ended bill (backend usage, storage, third-party services) must come with a hard cap or be rejected.
6. **Maintenance burden counts.** The maintainer is one student maintaining this alongside other work. Prefer designs that need no routine attention, and say what ongoing attention each recommendation would require (for example "re-check after each Samsung Notes update", "renew nothing").

---

## 2. Platform constraints to design around (verify before use)

| Platform | Constraint (as checked November 2026) | Consequence |
|---|---|---|
| Vercel Functions | Request and response bodies are capped at 4.5 MB (413 above that) | A 20 MB `.sdocx` cannot pass through a Vercel function. Uploads must go from the browser directly to the backend, or the work must happen in the browser |
| Vercel Hobby | Function duration defaults to 10 s, maximum 60 s | Do not put conversion in a Vercel function |
| Vercel Hobby | Plan is intended for non-commercial use | Check the current terms if the site will carry ads, donations, or paid features |
| Railway | New accounts get a 30-day trial with a one-time $5 credit; afterwards the Free plan gives about $1 of usage credit per month. Hobby is $5 per month with $5 usage included | There is no permanent always-on free backend. Plan for the trial ending and decide the fallback |
| Railway Free plan | Up to about 1 vCPU and 0.5 GB RAM per service, 0.5 GB volume, 1 project, 3 services | The current 1 GiB in-memory limits cannot be used as they are |
| Railway billing | Usage-based, per second; spend limits and alerts exist | Configure a hard spend limit so abuse cannot create a bill |

---

## 3. Architecture options to evaluate

Evaluate all three. Recommend one, with reasons, and list what each would require.

| Option | Shape | Questions the agent must answer |
|---|---|---|
| **A. Static frontend on Vercel, API on Railway** | Browser uploads directly to the Railway service; Vercel serves only static files | Direct-upload CORS and abuse surface; how much RAM and CPU one conversion needs (measure); realistic capacity of 0.5 GB; behavior after the trial ends |
| **B. Everything in the browser** | The existing Python core runs client-side in a WebAssembly Python runtime; the file never leaves the visitor's machine; Vercel serves static files only; no Railway at all | Does the code run unchanged in such a runtime? Everything except `cli.py` uses only the standard library, and the extractor and storage work on a virtual file system, so check this concretely. Startup download size; browser memory for a 20 MB note; large-file behavior on phones; how the ZIP download is produced; privacy and cost advantages; what is lost (server-side limits, logging) |
| **C. Single Railway service serving page and API** | One origin, no CORS | Simplicity versus losing Vercel's CDN; same capacity limits as A |

For option B in particular, answer section 4Q first, then state whether it removes the need for items in sections 4F, 4G, 4H, 4I, and 4P, and which items still apply (frontend security, packaging, limits, abuse of the page itself).

For options A and C, state whether the web layer should reuse the existing service with a per-request temporary directory and then ZIP the result, or add a new storage adapter that writes straight into a ZIP. Compare them on memory, disk use, atomicity, and how much of the DDS they touch.

### 3.1 Maintainer's preferred direction (assess this first)

The maintainer's preferred starting point is **Option B, in the browser**, hosted as a purely static site on Vercel, with no Railway service. The Vercel-plus-Railway design (Option A) is the fallback if Option B fails the feasibility checks in section 4Q. Treat this as a hypothesis to test, not a conclusion: if the evidence says Option B does not work, say so plainly and recommend the fallback.

Intended shape of the preferred deployment:

| Part | Intended choice |
|---|---|
| Where the conversion runs | In the visitor's browser, inside a background worker so the page stays responsive on large notes |
| How Python runs there | A WebAssembly build of Python, with the existing package installed from a wheel built from this repository |
| How files move | The uploaded `.sdocx` is placed in the runtime's in-memory file system as the source folder; the existing batch service converts into an in-memory destination folder; that folder is zipped and offered as a download |
| Dependencies in the browser | Only what the converter needs. Typer and Rich are CLI-only and must not be installed there; assess whether the packaging can separate them (extras or install without dependencies) |
| Hosting | Static files only on Vercel, no server functions, connected to the Git repository for automatic deploys. Vercel Hobby is intended for non-commercial use, so re-check the terms if ads or payments are ever added. Name one or two equivalent static hosts as alternatives, after checking their current terms |
| Third-party requests | None. The runtime files, the wheel, and fonts are self-hosted with pinned versions, so a strict content security policy and the claim "your file never leaves your device" both hold |
| CLI | Remains a normal installable package for people who want to run it locally; the web version never replaces it |

Known trade-offs to quantify rather than assume: first-visit download size of the runtime, browser memory on a 20 MB note plus its output ZIP (especially on phones), loss of server-side logs and limits, and how the maintainer learns about format breakage after a Samsung Notes update (a visible "report a failing note" route that does not require uploading the note is the likely answer; propose one).

Fallback deployment (Option A), if needed: static page on Vercel; uploads go from the browser **directly** to the backend (never through a Vercel function); backend on Railway's Hobby plan, since the free plan after the trial is too small for the current memory limits; one worker, a low concurrency cap, a separate web profile of extractor limits, cross-origin access restricted to the Vercel domain, and a hard spend limit.

---

## 4. Audit checklist

For every row: give a **status** (PASS, GAP, N/A, UNKNOWN), **evidence**, **risk** (High, Medium, Low), **recommended change**, and **effort** (S, M, L). Rows marked ★ are expected launch blockers; confirm or downgrade with evidence.

### 4A. Upload intake and limits

| ID | Check |
|---|---|
| A-01 ★ | Is there a hard maximum upload size, enforced while the body is being read rather than trusted from the declared length? Propose a number based on measured memory (offer a recommendation and the reasoning; the maintainer decides) |
| A-02 ★ | Is the number of files per request bounded, and the total size across files? How should a multi-file request be processed given memory limits |
| A-03 | Is the file type checked by content (ZIP signature) and not only by name or declared content type |
| A-04 | Is the upload spooled to bounded memory or a temporary file, and is that temporary data always removed, including on error, timeout, and client disconnect |
| A-05 | Is the user-supplied file name treated as untrusted everywhere it is used: as the note stem, in the download header, in logs, in the UI. Check the naming policy (DDS 4.4) against path tricks, very long names, empty names, reserved names, and invisible or direction-changing Unicode characters |
| A-06 | Are timeouts set for slow uploads (slow-body attacks) and for total request duration |

### 4B. Archive safety (`infrastructure/extractor.py`)

| ID | Check |
|---|---|
| B-01 ★ | Are the extractor limits (DDS 7.9) acceptable for a public server with the chosen RAM? Propose a separate, lower **web profile** of limits without changing CLI defaults; state how it would be injected |
| B-02 ★ | Are size limits enforced against bytes actually read, not only the sizes declared in the archive headers? Test with a forged header |
| B-03 | Is the compression ratio rule sufficient: per-entry only, or is there also an overall ratio and a cap on total decompressed bytes across all kept entries |
| B-04 | Behavior with many small entries, nested or overlapping ZIP structures, ZIP64, encrypted entries, and unsupported compression methods: clean `ArchiveError` or crash |
| B-05 | Confirm entries are never written to disk by name (no path traversal possible) and that duplicate or oddly encoded names cannot reach output paths |
| B-06 | Does error reporting avoid leaking server paths, library versions, or stack traces to the visitor (DDS 9.1 says no traces; verify the real behavior for every error type) |

### 4C. Parser robustness and denial of service (`core/`)

| ID | Check |
|---|---|
| C-01 ★ | Worst-case running time of the region-bounded text locator (DDS 6.10) and the GUID marker finder on hostile input: very large note files, huge counts of GUID-shaped strings, long runs of almost-valid candidates, huge placeholder counts. **Measure** with crafted inputs from the builder and report seconds against size |
| C-02 ★ | Is there any bound on the number of markers, objects, placeholders, or blocks? What happens at a million placeholders |
| C-03 | Maximum size of the note record the parser accepts; maximum text length |
| C-04 | Can any input make the parser loop, recurse deeply, or allocate far more than the input size. Describe the amplification factor (input bytes to peak memory) |
| C-05 | Fuzz-style pass: truncated files, random byte flips in S1, S2, S5, and each sample's `note.note`. Every outcome must be a domain exception, never an unexpected one. Report counts per outcome |
| C-06 | The service's last-resort catch labels unexpected errors "internal error" with the exception type. Is that text safe to show a stranger, and is the real exception logged server-side only |
| C-07 | A conversion must be stoppable. Describe how a time limit would be enforced on pure-Python CPU work (the process cannot be interrupted from within a normal thread), and what that implies for worker design |

### 4D. Memory and efficiency

| ID | Check |
|---|---|
| D-01 ★ | **Measure** peak memory and wall time for S1, S2, S5, and the smallest samples, through the real service. Report upload size, peak resident memory, and the ratio. Identify where copies of the same bytes are held at once (upload buffer, extracted media, staging write, ZIP output) |
| D-02 | From D-01, compute how many simultaneous conversions fit in 0.5 GB with headroom, and recommend a concurrency cap |
| D-03 | Which copies can be removed without breaking the DDS contracts or purity rules (for example freeing the archive after parsing, building the output ZIP while writing, avoiding a second in-memory copy of media) |
| D-04 | Is already-compressed media (jpg, m4a, mp3) stored without recompression in the output ZIP, so CPU is not wasted |
| D-05 | Would streaming the output download (instead of building it fully first) help, and is it compatible with the atomicity guarantees |
| D-06 | Deterministic output: confirm the ZIP can be made byte-identical for identical input (fixed timestamps, ordered entries) so results are testable |
| D-07 | Startup time and idle footprint of the service on the smallest instance |

### 4E. Output delivery and naming

| ID | Check |
|---|---|
| E-01 ★ | Define the download format: one ZIP with the note and its `_Assets` folder at the top level, so it unpacks straight into a vault. Check what the existing storage and naming rules produce and what a ZIP writer would have to do |
| E-02 | Batch of several files in one request: ZIP layout, and how name collisions **between files in the same request** are resolved (FR-06 logic exists for a disk destination; define the web equivalent) |
| E-03 | Per-file failure inside a batch: how is it returned alongside the successes (summary list in the response, partial ZIP, or separate calls) so the visitor sees which file failed and why, matching FR-07 |
| E-04 | Warnings (DDS 8.3) must reach the visitor. Define how |
| E-05 | Download headers: attachment disposition with a safe encoded file name, correct content type, no content sniffing. Check for header injection through the note name |
| E-06 | Entry names inside the output ZIP: confirm they can never contain traversal segments, drive prefixes, or backslashes, and that they open correctly on Windows, macOS, and Linux unzip tools (including non-ASCII names) |

### 4F. Web API layer design

| ID | Check |
|---|---|
| F-01 ★ | Propose where the web layer lives (a new composition root beside `cli.py`), which existing modules it may import, and the rule additions needed in `scripts/check.py` so the web framework cannot leak into `domain/`, `core/`, `infrastructure/`, or `application/` |
| F-02 ★ | Propose the minimal API surface: convert, health, version. Nothing else. Justify each endpoint |
| F-03 | Statelessness: confirm no data survives a request. List every place data could persist (temp files, caches, logs, staging directories such as the hidden staging prefix in DDS 14.2) and how each is cleaned |
| F-04 | Sync versus async handling: the conversion is blocking CPU and file work; describe how it must be isolated so it does not freeze the server for other visitors |
| F-05 | Single process versus several: memory per worker against 0.5 GB; recommend a worker count |
| F-06 | Request queueing or "busy" responses when at capacity (reject fast with a clear message instead of queueing unbounded work) |
| F-07 | Mapping of the domain exception hierarchy (DDS 4.3) and the error catalogue (DDS 9.1) to HTTP status codes and visitor-facing messages. Provide the table |
| F-08 | Health check that does not itself consume significant resources, suitable for the host's health probing |
| F-09 | Graceful shutdown: in-flight conversions and temporary data when the container is restarted or redeployed |

### 4G. Abuse prevention and rate limiting

| ID | Check |
|---|---|
| G-01 ★ | Per-visitor rate limit on conversions and on bytes per period. Behind the host's reverse proxy, how is the real client address obtained safely (header spoofing is a known pitfall)? State what is trusted and why |
| G-02 | Global capacity ceiling so a flood cannot exhaust the free credit; interaction with the host's spend limit |
| G-03 | Optional bot protection on the upload form (a free challenge service). State the privacy and complexity cost and whether it is warranted at launch |
| G-04 | What stops the service being used as free general file storage or relay. Confirm nothing is retained and nothing is returned except converted output |
| G-05 | Alerting: how the maintainer learns about abuse or a sudden cost spike |

### 4H. Web security

| ID | Check |
|---|---|
| H-01 ★ | Cross-origin policy: only the frontend's origin is allowed, no wildcard, no credentials. List the exact allowed headers and methods |
| H-02 ★ | Transport: HTTPS only, HTTP redirect or rejection, and strict transport security on the frontend |
| H-03 | Security headers for the frontend and the API (content-type sniffing protection, framing protection, referrer policy, a strict content security policy). Provide the policy intent in prose; the frontend should need no inline scripts or third-party scripts |
| H-04 ★ | Any preview of converted content in the page: if Markdown or media is rendered, hostile note text (raw HTML, script, event handlers, dangerous links) and hostile media (a file named `.jpg` with other content) are an XSS risk. Recommend no rendering, or text-only display, unless a sanitizer is justified |
| H-05 | Obsidian-side effects of unescaped text (D-13): note text that contains wiki-link or embed syntax will be interpreted by Obsidian after import. Decide whether this needs a visible notice on the site (do not change D-13 without the maintainer) |
| H-06 | Unicode hygiene: direction-override and invisible characters in note titles and media names that could spoof file names in the UI or the ZIP listing |
| H-07 | Error pages and framework defaults: automatic documentation pages, debug mode, verbose errors, server banner. All disabled in production |
| H-08 | Server-side request forgery and similar classes: confirm the backend makes no outbound requests based on input (it should make none) |
| H-09 | Secrets: list every secret or configuration value the deployment needs. The goal is none beyond environment settings such as the allowed origin and limits |
| H-10 | Authentication: confirm deliberately none, and state which abuse controls replace it |

### 4I. Privacy and data lifecycle

| ID | Check |
|---|---|
| I-01 ★ | Notes are personal data. Confirm and document: content processed in memory or a request-scoped temporary location only, deleted after the response, never logged, never sent to third parties |
| I-02 ★ | Logging policy: what is logged (request id, size, duration, outcome, error class) and what is never logged (file names, note text, media, visitor addresses beyond what rate limiting needs). Check the existing warning and error strings for embedded file names or content |
| I-03 | Host-level data: Railway log retention, Vercel analytics defaults, and any third-party scripts, fonts, or analytics on the page. List them and recommend none or privacy-friendly only |
| I-04 | A short, honest privacy statement for the site (what happens to an uploaded file; for option B, "never leaves your device"). Provide its bullet points in the report |
| I-05 | Temporary data on a crash: can partial uploads or staging folders survive a process kill, and is there a startup sweep |

### 4J. Observability

| ID | Check |
|---|---|
| J-01 | Structured, content-free logs with a per-request id that is also returned to the visitor for support |
| J-02 | Minimal metrics worth having on a free tier: request count, failures by class, duration, peak memory, rejections for size and rate |
| J-03 | Uptime check and what the visitor sees during a cold start or when the free credit is exhausted |

### 4K. Frontend (Vercel)

| ID | Check |
|---|---|
| K-01 | Smallest viable frontend: a static page with drag-and-drop, file picker, progress, results list, download. Justify any framework |
| K-02 | Client-side pre-checks (extension, size) as convenience only; the server enforces everything again |
| K-03 | Upload progress, cancel, clear error messages mapped from section F-07, retry guidance, and a friendly message when the backend is asleep or over capacity |
| K-04 | Mobile behavior: many users will export notes from a phone. Large uploads on mobile networks, and downloading ZIPs on phones |
| K-05 | Accessibility basics (keyboard use, labels, contrast, screen reader announcements for results) |
| K-06 | Short usage guide on the page: how to export `.sdocx` from Samsung Notes, what is converted, and the known limitations from SRS 1.3 (formatting, ink, drawings, PDFs are skipped) |
| K-07 | Configuration of the backend address per environment without code changes |

### 4L. Packaging and deployment

| ID | Check |
|---|---|
| L-01 ★ | Container or build definition for Railway: Python version (3.11 or newer per DDS 11), minimal image, non-root user, no dev tools in the runtime image, pinned versions |
| L-02 | Environment-driven configuration for every limit (upload size, extractor profile, rate limits, concurrency, allowed origin, timeouts) with safe defaults. List each setting and its default |
| L-03 | Start command, port handling, health check path, restart policy, and resource limits suitable for the free plan |
| L-04 | Temporary directory location and size on the host, and what happens when the disk is full |
| L-05 | Separate preview and production environments, and a rollback path |
| L-06 | Domain and TLS: default host domains versus a custom domain; what changes for the allowed-origin setting |
| L-07 | Version string exposure (DDS 3.2 has a version in `__init__`): what the version endpoint reveals and whether it is acceptable |

### 4M. Dependencies and supply chain

| ID | Check |
|---|---|
| M-01 | Full list of new runtime dependencies the web layer requires, each with: purpose, size, maintenance status, and a lighter alternative. Nothing is added by the audit |
| M-02 | Typer and Rich must not be installed in the web runtime if they are CLI-only; check how packaging can separate CLI and web dependencies (extras or separate groups) |
| M-03 | Pinned and hashed dependency lockfile for the deployment, and a local vulnerability check command to run before each release (CI is out of scope) |
| M-04 | Frontend dependencies: ideally none; any that exist must be pinned and self-hosted |

### 4N. Tests and quality gates

| ID | Check |
|---|---|
| N-01 ★ | List the new tests required, in the DDS test-table style (file, cases). Cover at least: size limit enforcement mid-upload, forged archive headers, hostile archives from T-16, parser fuzz outcomes, timeout behavior, concurrency cap, rate limiting, CORS, error-to-status mapping, ZIP entry-name safety, content-free logging, cleanup after success and after failure, and determinism of the output ZIP |
| N-02 | Which existing tests must change, if any (for example anything assuming a disk destination chosen by the user) |
| N-03 | Changes `scripts/check.py` needs: new layer rule for the web package, banned-call list additions, and the 35-line function limit applied to the new code |
| N-04 | Coverage thresholds (whole package 90 percent, `core/` and `application/` 95 percent) and how the new layer is counted |
| N-05 | A local load and soak procedure (concurrent conversions of S1 and S5, hostile inputs) with pass criteria for memory, latency, and error rate |
| N-06 | Manual acceptance checklist for the public site, in the style of the maintainer acceptance checklist in `plan.md`, including opening a downloaded ZIP in Obsidian |
| N-07 | Proposed new phases for `plan.md` (P13 onward), each with goal, deliverables, tests, and gate. Do not edit `plan.md` |

### 4O. Documentation, legal, and operations

| ID | Check |
|---|---|
| O-01 | README additions: what the site does, limits, privacy statement, known limitations, how to self-host |
| O-02 | Disclaimer that this is an unofficial tool, not affiliated with Samsung or Obsidian; the format is reverse-engineered (`format.md`) and may break with app updates; how a visitor reports a note that fails |
| O-03 | Terms and usage limits wording appropriate for a free public tool |
| O-04 | A takedown and incident procedure for the maintainer: how to disable the service quickly if it is abused |
| O-05 | What the maintainer should check on each Samsung Notes update (the `format.md` evidence log and unverified items) |

### 4P. Cost and capacity

| ID | Check |
|---|---|
| P-01 ★ | Estimate monthly resource use for the expected small audience (say 10, 100, and 1,000 conversions per month at the measured memory and time per conversion) against the free credit, and say at which point the free plan stops being enough |
| P-02 | What happens when the trial or credit ends: does the site fail gracefully, and does the frontend say so |
| P-03 | Recommended hard spend limit and alert thresholds |
| P-04 | Cheaper or free alternatives for the backend if Railway's free plan is not enough, and whether option B makes the backend unnecessary |

### 4Q. Browser-only deployment feasibility (Option B)

Answer these before anything else; they decide whether sections 4F, 4G, 4H, 4I, and 4P apply.

| ID | Check |
|---|---|
| Q-01 ★ | **Runs unchanged?** Using the WebAssembly Python runtime, run the existing service (scanner, extractor, parser, renderer, storage, service) on S1, S2, and S5 and compare against the golden outputs (DDS 8.4) and the S5 evidence. List every module or call that fails or behaves differently (file system semantics, case sensitivity, hidden staging directory, atomic move, permission probes, temporary directories). If you cannot run it, say so and mark UNKNOWN with what would verify it |
| Q-02 ★ | **Python version match.** Does the runtime's Python version satisfy the project's minimum (DDS 11), and does `mypy --strict` typing or any syntax in the package depend on newer features than the runtime supports |
| Q-03 ★ | **Packaging.** How to build one wheel that installs in the runtime without Typer and Rich. State the exact packaging change needed (extras, separate dependency groups, or install without dependencies) and its effect on the CLI install and entry point. List it under proposed amendments; apply nothing |
| Q-04 | **Entry point for the page.** Propose the smallest new function or module that takes bytes in and returns ZIP bytes and a result list, and which layer it lives in, so the web page does not reach into internal modules. It must not touch `core/` or `domain/` |
| Q-05 | **Disk versus memory.** The service expects folders. Confirm that the runtime's in-memory file system is enough, and how much extra memory each copy costs (uploaded bytes, extracted media, staging, destination, ZIP output). Report peak browser memory for S1 and S5 |
| Q-06 ★ | **Size and device limits.** Practical maximum note size on a desktop browser and on a mid-range phone. Propose a client-side size limit and what the page says when a file is too big |
| Q-07 | **Responsiveness.** The conversion is CPU-bound Python. Confirm it can run in a background worker and that the page can show progress, per-file results, and warnings (DDS 8.3) while it runs. State how a user cancels |
| Q-08 | **First-visit cost.** Measure download size and time to first conversion on a slow connection; propose caching and a visible loading state |
| Q-09 | **ZIP creation.** Which standard-library or browser facility builds the ZIP with the note and its `_Assets` folder at the top level, with deterministic timestamps and stored (not recompressed) media. Name safety for non-ASCII file names on Windows, macOS, and Linux tools |
| Q-10 | **Multiple files.** Whether a batch of several notes in one session is supported, and how name collisions between files in the same batch are resolved (FR-06 works against a destination folder; the in-memory destination should behave the same) |
| Q-11 ★ | **Hostile input still matters.** Even though the visitor attacks only their own browser, a crafted file can freeze or crash the tab. Re-run C-01, C-02, and B-02 here and confirm the extractor limits apply in the browser, with a limits profile that fits a browser tab |
| Q-12 | **Self-hosting and supply chain.** Which runtime files must be hosted by the project, their pinned versions and sizes, and how the maintainer updates them. Confirm no third-party script, font, or analytics is loaded |
| Q-13 | **Static hosting fit.** Confirm the site needs no server function, which response headers must be configured (including the ones needed for the runtime and worker to function and for a strict content security policy), and how to set them on Vercel and on one alternative static host |
| Q-14 | **Failure reporting without a server.** Propose how the maintainer learns about notes that fail (for example a prefilled issue link carrying only the error class, the app version, and the format-evidence fields, never the note itself) |
| Q-15 | **Verdict.** State PASS, PASS WITH CONDITIONS, or FAIL for Option B, and if not PASS, which fallback (Option A or C) to take and which of the checks above caused the decision |

---

## 5. Compatibility with the existing architecture

The agent must confirm, with evidence, that the web deployment can be added **without changing** the following, or else list the exact amendment needed:

1. The layer rules and dependency directions in DDS 3.1.
2. The protocol contracts in DDS section 5 (scanner, extractor, parser, renderer, storage, reporter).
3. The pure, I/O-free status of `core/` and `domain/`.
4. The behavior documented in SRS FR-01 to FR-07 and acceptance criteria AC-1 to AC-4 for the CLI. The CLI must remain fully functional and its tests must stay green.
5. Golden outputs for S1 and S2 (DDS 8.4), byte for byte.

For each web need that does not fit, say whether it can be solved by a new adapter or composition code (preferred) or would require editing an existing contract.

---

## 6. Things to look for that are easy to miss

* Assumptions that the machine is the user's own: reading from a user-chosen folder, writing into the destination, relying on the working directory, case-insensitive collision checks that assume a local file system, console-only output of warnings.
* Any place where input size controls the amount of work quadratically.
* Any use of the upload's own file name beyond the sanitized note stem.
* Differences between the local operating system and a Linux container (paths, case sensitivity, temporary directory behavior, file permissions, clock and time zones).
* Behavior when two visitors upload files with identical names at the same moment.
* Behavior when the visitor disconnects mid-upload or mid-download.
* Cases in `format.md` section 4 and DDS 14.3 (formatted text, checklists, tables, attachments, older app versions) that a public audience will certainly upload. Confirm each ends in a clear message, not a crash or silent data loss.

---

## 7. Decisions the maintainer will need to make

The agent must end the report with a numbered list of decisions, each with the options, a recommendation, and the consequence of each. Expected topics: whether the section 1.1 scale-down choices are acceptable; confirming Option B (browser-only on static Vercel hosting) or taking the fallback; architecture option (A, B, or C); maximum upload size; maximum files per request; web profile of extractor limits; concurrency cap; rate limit values; whether to add bot protection; whether to show any preview; new dependencies; log retention; what to do when free credit ends; whether to apply the amendments in section 8 to the DDS and SRS.

---

## 8. Proposed amendments (list only, do not apply)

List every change to `docs/dds.md`, `docs/srs.md`, `docs/format.md`, `docs/plan.md`, and the agent rules that the web deployment would require, as a table: document, section, current text intent, proposed change, reason. Include whether the SRS scope (a CLI) needs a new product mode and which requirements would be added (for example upload limits, privacy, rate limiting, ZIP download).

---

## 9. Deliverable: `docs/web-audit-report.md` (the only file you may create)

Structure:

1. **Executive summary** (at most 15 lines): the verdict on the preferred browser-only deployment (section 3.1 and Q-15) and the recommended architecture and hosting, launch readiness verdict (READY, READY WITH CONDITIONS, NOT READY), the top five risks.
2. **Measurements**: table of sample, upload size, peak memory, time, and the hostile-input timing from C-01. State the machine used so numbers are comparable.
3. **Findings**: one table per section 4 group using the columns ID, status, risk, evidence, recommended change, effort, needs maintainer decision.
4. **Launch blockers**: every ★ item still open, in the order they should be fixed.
5. **Proposed design sketch** in prose and tables only (no code): modules, responsibilities, dependency directions, request flow, limits profile, error mapping table, configuration table.
6. **Proposed test list** (N-01) and **proposed phases** (N-07).
7. **Proposed amendments** (section 8).
8. **Maintainer decisions** (section 7).
9. **Assumptions and unknowns**: anything you could not verify and what would verify it.

Priorities for the change list, used across the report:

| Priority | Meaning |
|---|---|
| Blocker | Must be done before any public URL is shared (judged for a small public tool, see section 1.1) |
| Should | Do before announcing the tool widely |
| Could | Improves quality; can follow later |

**End of session:** state which items you could not assess, then stop and wait for the maintainer. Make no changes beyond the report file.
