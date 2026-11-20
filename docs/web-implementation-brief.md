# Web Deployment Implementation Brief — sdocx2obsidian (browser-first)

**For:** the Antigravity agent. **From:** the maintainer.
**Goal:** ship `sdocx2obsidian` as a small public web tool that converts notes **entirely in the visitor's browser**, hosted as a static site, while the CLI keeps working unchanged.

You have already produced `docs/web-audit-report.md`. This brief turns it into work. Treat that report as **evidence, not authority**: section 1 lists where it is wrong, unverified, or inconsistent, and you must correct those before building on them.

---

## 0. Protocol

1. **One phase per session** (P13 to P17, section 5). At the end of each phase, stop and wait for the maintainer.
2. **Same working protocol as `docs/plan.md`:** read the rules and the cited sections; state a plan in at most 10 lines (files, tests first, assumptions, any proposed dev dependency with exact name and version); ask before coding if anything is ambiguous; write tests first; run the gate after every file; report; tick the tracker; commit locally as `P<n>: <phase title>`; stop.
3. **Never run `git push`. CI stays out of scope.**
4. **Gates.** Python: `pytest`, `mypy --strict src tests`, `ruff check src tests`, `python scripts/check.py`. Once the site exists (P16): also one command, `npm run check` inside `site/`, that runs the type check, lint, unit tests, and the Pyodide-in-Node integration test.
5. **CLI must not change behavior.** All existing tests stay green without modification, the golden outputs (DDS 8.4) stay byte for byte, and desktop limits stay exactly as in DDS 7.9 unless a web profile is explicitly passed in.
6. **Amendments.** You may edit only the documents and sections listed in section 7. Any other change to the DDS, SRS, rules, protocols, or interfaces: stop and propose it.
7. **Stop and ask** if: a measurement contradicts this brief; something fails in the browser runtime; the minimum content security policy turns out weaker than section 5 P16 requires; a dependency not named here seems necessary; a rule conflicts with a task.
8. **Scope reminder.** This is a small public tool with few users. Prefer the least machinery that is still safe. Anything that only matters at scale is out of scope.

---

## 1. Corrections to the audit report (do these first)

| # | Report claim | Problem | What you must do |
|---|---|---|---|
| R-1 | Q-01, Q-02: the core "runs completely unchanged in Pyodide" (PASS) | The report's measurements were taken on native Python 3.11 on Windows. Nothing was actually run in Pyodide, so this PASS is reasoning, not evidence | P13 is a mandatory feasibility spike. Nothing else starts until it passes |
| R-2 | B-02 / Top risk 1: a forged archive header can make `zf.read()` decompress gigabytes before the size check | Python's ZIP reader limits reading to the size declared in the header and then verifies the checksum, so a header that understates the size should not cause unbounded decompression. The claim is probably wrong, or at most overstated | Reproduce the forged-header case first, on native Python and in Pyodide, and report what really happens. Keep the streamed, capped read as **hardening** (lower transient memory, a hard byte budget), classify it honestly as Medium or Low, and do not call it a vulnerability unless your reproduction shows one |
| R-3 | Limits appear twice with different numbers: entry count 100 vs 500, parser objects 10,000 vs 2,500, placeholders 50,000 vs 20,000 | Inconsistent | Use the single table in section 4. Validate each value against P13 measurements in the browser runtime and propose changes if needed |
| R-4 | Q-05: "about 60 MB in the WASM heap for a 20 MB note" | A hand estimate. In a browser the same bytes can exist several times: the page's buffer, the copy into the runtime, the extracted media, the staged file, the output ZIP, and the copy handed back. The runtime's memory also does not shrink once grown | Measure real peak memory in the runtime for S1, S2, S5, and a synthetic 50 MB note. Report a per-copy breakdown and the multiplier. Lower the limits in section 4 if the multiplier makes them unsafe for phones |
| R-5 | Section 5.2: the web layer "may import `application` and `domain`" | A composition root has to build the concrete scanner, extractor, parser, renderer, and storage, so it must import `core` and `infrastructure` as well, as `cli.py` does | The new web package is a second composition root: it may import every project layer except Typer and Rich, and no other layer may import it. Encode that in `scripts/check.py` |
| R-6 | Decision 3 recommends a DOMPurify-sanitized Markdown preview | Adds a dependency that must be pinned, self-hosted, and kept patched, and a rendering path that exists only to be defended | The preview is **plain text only**, set through text assignment, never through HTML parsing. No Markdown or HTML rendering and no media preview of note content |
| R-7 | Decision 5: the issue link carries a "sanitized title" | The note title is note content and may be personal | The prefilled issue contains only: tool version, runtime version, error class, a coarse file-size bucket, and the browser family. No title, no file name, no text, no media |
| R-8 | Many starred items (G-01, H-01, F-01, F-02, L-01, and others) are Option A (server) items | Not needed in the browser-only design | Out of scope. Do not build FastAPI, Docker, CORS, rate limiting, or Railway configuration. Record them in one short "deferred, Option A only" note in `docs/plan.md` and nothing more |
| R-9 | P15 mentions COOP/COEP headers | Cross-origin isolation is not required for this design and can break loading if misconfigured | Do not add them unless you can show a concrete need |
| R-10 | Section 9: first-load size (about 6.5 MB), 3G load time, and iOS memory behavior are stated as facts | Unmeasured | Measure transfer size of every runtime file as the static host will serve it, or label the number "unverified". The maintainer will test a real phone in P17 |
| R-11 | T-WEB-03 expects the adapter to raise, T-WEB-05 expects it to return a structured failure | Contradictory | The adapter never raises for a per-note problem; it returns a failed outcome like the existing service does. It raises only for programming or configuration errors |

---

## 2. Maintainer decisions (locked unless the maintainer overrides before a phase starts)

| ID | Decision |
|---|---|
| MD-1 | **Architecture:** browser-only (Option B), static hosting on Vercel. Option A is out of scope |
| MD-2 | **Limits:** starting values in section 4, validated in P13 and P14 |
| MD-3 | **Preview:** plain text only (see R-6) |
| MD-4 | **Frontend:** a minimal static site, no UI framework and no runtime JavaScript dependencies other than the self-hosted Pyodide runtime. Build tooling may be dev-only and must be pinned. Frontend lives in a new top-level `site/` directory (not inside the Python package) |
| MD-5 | **Batch output:** one combined ZIP per session, with every converted note and its `_Assets` folder at the top level so it unpacks straight into a vault |
| MD-6 | **Issue reporting:** the content-free prefilled issue link in R-7 |
| MD-7 | **Packaging:** `typer` and `rich` move into an optional `cli` extra; core installs with no third-party runtime dependencies |
| MD-8 | **Hosting:** Vercel static project connected to the repository, no server functions. Vercel Hobby is non-commercial; the page must carry no ads or payments. Alternatives (GitHub Pages, Cloudflare Pages, Netlify) are documented only after you check their current terms |
| MD-9 | **Needs maintainer input before P17:** repository URL, license name, and contact method for the issue link. Ask; do not invent |

---

## 3. Definition of done for the whole effort

1. A visitor drops one or several `.sdocx` files on a static page, sees progress, sees per-file results and warnings, and downloads one ZIP that opens correctly in Obsidian (links resolve, images and audio work).
2. After the page and runtime have loaded, **no network request leaves the page** during conversion. This is verified, not assumed.
3. Hostile or broken files end in a clear message, never a frozen tab; a running conversion can be cancelled.
4. The CLI is unchanged in behavior, and `pip install` of the core no longer pulls Typer or Rich.
5. All gates pass; the privacy statement on the page is true; the maintainer has tested on a real phone.

---

## 4. Web limits profile (starting values)

Limits must be a single immutable profile object that is passed in when the extractor and parser are built, so the CLI keeps its desktop defaults and the web layer passes the web profile. No protocol changes.

| Parameter | Desktop (unchanged, DDS 7.9) | Web (start) | Notes |
|---|---|---|---|
| Files per session | unlimited | 5 | enforced before any file is read |
| Size of one uploaded file | unlimited | 50 MB | per-file, checked before reading |
| Total input per session | unlimited | 100 MB | files are converted one at a time and freed between files |
| Single kept archive entry, uncompressed | 512 MiB | 50 MiB | |
| Total kept entries, uncompressed | 1 GiB | 100 MiB | |
| Entries inspected | 5,000 | 500 | real notes have well under 50 |
| Compression ratio (entries over 1 MiB) | 200:1 | 50:1 | |
| Inline objects per note | unlimited | 2,500 | adjust after WASM timing |
| Placeholders per note | unlimited | 20,000 | adjust after WASM timing |
| Wall-clock time per conversion | none | 60 s | enforced by terminating the background worker, not by the Python code |

If P13 shows the browser memory multiplier makes 50 MB unsafe on phones, propose a lower mobile cap rather than silently keeping the number.

---

## 5. Phases

### P13 — Pyodide feasibility spike (maintainer gate; use the `spike` workflow)

**Goal:** prove or disprove, with evidence, that the existing package runs unchanged in the WebAssembly Python runtime.
**Read:** DDS 3.1, 7.9, 7.10, 9.4, 11; the audit report.
**Work (throwaway analysis; do not modify `src/` or `tests/`):**
1. Pick one Pyodide version, pin it, and state it with its Python version and the date you checked.
2. Build a wheel of the current package and install it in the runtime under Node. Report whether it installs with no network dependencies, and what happens with Typer and Rich missing.
3. Run the full existing service end to end in the runtime on S1 to S5 (skip any missing sample) and compare outputs with the golden outputs and `format.md` evidence. Record, per sample: pass or fail, wall time, peak memory, and a per-copy memory breakdown (R-4).
4. Exercise every file-system behavior the storage layer relies on: nested directory creation, the writability probe, hidden staging directory, moves and rollback, case-insensitive collision checks, and removal of staging. List any difference from native behavior.
5. Run the hostile cases from the audit (5,000 objects, 100,000 placeholders) and a synthetic 50 MB note in the runtime; record time and memory.
6. Reproduce the forged-header case (R-2) natively and in the runtime.
7. Measure the transfer size of every runtime file needed (runtime, standard-library bundle, wheel) as compressed by a static host.
**Deliverable:** one new file, `docs/web-spike.md`, with a table of results, a list of incompatibilities (if any), measured limits, and a verdict: PASS, PASS WITH CONDITIONS, or FAIL.
**Gate:** maintainer approves the evidence. On FAIL or on any incompatibility that needs a core change, stop and propose; do not continue.

### P14 — Packaging, limits profile, extractor and naming hardening

**Goal:** make the core installable in the browser runtime and safe for the web profile, without changing CLI behavior.
**Read:** DDS 4.4, 7.3, 7.6, 7.9, 11; skill `archive`; the P13 results.
**Deliverables:**
- **Packaging (MD-7):** core installs with no third-party runtime dependencies; `cli` extra carries Typer and Rich; development installs include the `cli` extra so existing tests run. If the console command is run without the extra, it prints one clear sentence saying how to install it instead of a traceback. Confirm the built wheel is pure Python and installs in the runtime.
- **Limits profile (section 4):** an immutable profile in `domain`, with the desktop defaults equal to today's constants; the extractor and parser take it at construction; the CLI passes nothing and behaves as before.
- **Extractor read path:** read each kept entry in bounded chunks with a running byte count against the profile limit, preserving checksum verification and the existing error mapping (R-2). Keep the declared-size checks.
- **Parser caps:** objects and placeholders caps from the profile, failing with the existing malformed-note error and a clear message.
- **Naming:** names stripped of direction-override and similar invisible direction controls (the range around U+202A to U+202E, U+2066 to U+2069, and the direction marks). **Do not strip** zero-width joiners, non-joiners, or variation selectors, because emoji in note names depend on them. Sanitizing stays idempotent.
**Tests (write first):**
| File | Cases |
|---|---|
| `tests/unit/domain/test_limits.py` | profile is frozen; desktop defaults equal the old constants; web profile matches section 4 |
| `tests/unit/infrastructure/test_extractor_limits.py` | each limit trips with the web profile and not with desktop defaults; forged-header archive behaves as measured in P13; checksum failure still maps to a corrupt-archive error; a chunked read yields identical bytes; high-ratio archive; entry count cap; total size cap |
| `tests/unit/core/test_parser_caps.py` | objects cap and placeholders cap trip with a clear message; just-under caps pass |
| `tests/unit/domain/test_naming.py` (extend) | direction controls removed; ZWJ, ZWNJ, and variation selectors preserved; idempotence |
| packaging test | installing the core without the extra imports the whole non-CLI package; running the command without the extra prints the install hint |
| existing suite | unchanged and green; golden outputs unchanged |
**Gate:** four commands pass; wheel installs in the runtime without Typer or Rich.

### P15 — Browser adapter and in-memory packaging

**Goal:** a single clean entry point the page can call, producing the ZIP.
**Read:** DDS 3.3 to 3.5, 5, 7.10, 7.11, 8; the P13 results.
**Deliverables:**
- New package `src/sdocx2obsidian/web/` as the second composition root (R-5). Keep the name distinct from the top-level `site/` directory.
- A small session-style interface: start a session with a limits profile (fresh, empty, session-private directory in the runtime's in-memory file system); convert one note from a file name and its bytes; finish the session and receive the ZIP bytes and a summary; abort at any time, which removes everything. The session reuses the existing service, scanner-free path, and storage collision logic so name collisions between files in one session resolve exactly as FR-06 describes.
- Per-note result: status, stable error code, the user-facing message from the table below, warnings, asset count, and a conversion id. Never raises for a per-note problem (R-11).
- Session limits (file count, total bytes) enforced before reading data. Memory freed between notes; avoid extra copies of the uploaded bytes.
- ZIP rules: media stored uncompressed, text compressed, fixed timestamps, entries in sorted order, forward slashes, UTF-8 names, note and `_Assets` folder at the top level, deterministic output.
- `scripts/check.py` updated: web may import every project layer except Typer and Rich; nothing else may import web; the 35-line limit applies to the new code.

| Domain exception | User-facing message |
|---|---|
| Corrupt archive | "This file is not a valid or complete Samsung Notes .sdocx archive." |
| Unsafe archive | "This file exceeds the safety limits of this tool or contains invalid paths." |
| Missing entry | "This does not look like a supported modern Samsung Notes file." |
| Malformed note | "The note could not be read. It may come from an unsupported Samsung Notes version." |
| Render error | "Could not create valid links for this note." |
| Unexpected error | "Something unexpected went wrong with this note." (details never shown to the visitor) |

**Tests (write first):**
| File | Cases |
|---|---|
| `tests/unit/web/test_session.py` | S4 and S5 produce the expected ZIP layout; text-only note creates no `_Assets` folder; two notes with the same name give `Name.md` and `Name (1).md` with matching asset folders; corrupt bytes give a failed result, not an exception; over-limit file rejected before reading; abort removes all session data; finish twice or convert after finish is a programming error |
| `tests/unit/web/test_zip_output.py` | byte-identical output on repeated runs (S1 twice); media entries stored; names sorted; no backslashes; non-ASCII names; no traversal segments |
| `tests/unit/web/test_messages.py` | every domain exception maps to exactly one code and message; no exception text or path reaches the visitor |
| `tests/unit/test_check_script.py` or equivalent | the layer rules accept web as designed and fail when core, domain, application, or infrastructure import web, or when web imports Typer or Rich |
| `tests/integration/test_real_samples.py` (extend) | S1 to S5 through the session interface match golden or evidence outputs |
**Gate:** four commands pass; coverage thresholds from the DDS still met.

### P16 — Frontend and background worker (`site/`)

**Goal:** the static page.
**Read:** the P13 and P15 results; MD-3, MD-4, MD-6.
**Deliverables:**
- A minimal static page with drag and drop and a file picker; client-side pre-checks for extension and size (convenience only; the adapter enforces the real limits).
- A background worker that loads the self-hosted runtime and the wheel built from this repository, then runs the session interface. File data is handed to the worker without copying where the browser allows it. Cancelling terminates the worker, discards the session, and lets the next run start a fresh worker.
- State machine with clear visible states: idle, loading runtime, converting, done, error, cancelled. A progress display and a polite live announcement of results for screen readers.
- Results list per file with status, warnings, and message; one download button for the combined ZIP; download link released after use.
- Plain-text preview of the Markdown (MD-3) through text assignment only; the note's own media is never rendered.
- A three-step guide (export from Samsung Notes, drop here, download), the privacy statement (below), a footer disclaimer (unofficial; not affiliated with Samsung or Obsidian; the format is reverse-engineered and may break), the note about Obsidian interpreting `[[...]]` and `![[...]]` text, and the content-free issue link (R-7).
- Everything self-hosted and pinned: runtime files, wheel, fonts (or system fonts). No analytics, no third-party scripts, styles, or fonts.
- **Content security policy:** determine, in a real browser, the **smallest** working policy: same-origin only for scripts, styles, workers, images, and requests; no framing; no objects; no base-URI or form targets; plus only the WebAssembly allowance the runtime needs. If the runtime needs general script evaluation, stop and report before continuing (stop trigger 7).
- `npm run check` as defined in section 0.

Privacy statement (use verbatim, but only if verification below passes): the page converts notes entirely in the browser; files are never uploaded; nothing is stored; closing or refreshing the tab discards everything; the code is open source.

**Tests:**
| Area | Cases |
|---|---|
| Node integration with the runtime | S1 to S5 convert and match expected outputs; limits trip as in P14; cancel path leaves nothing behind |
| State machine unit tests | every legal and illegal transition; cancel during load and during conversion |
| Issue link unit tests | contains only the allowed fields; never contains a title, file name, or text; length stays within what URLs allow |
| Preview | hostile note text (HTML, script tags, event attributes) appears as inert text; no element other than a text node is created from note content |
| Manual browser list (you write it; the maintainer runs it) | desktop Chrome, Firefox, and Safari if available; mobile Chrome and Safari; 20 MB note; cancel; refresh; offline after first load |
**Gate:** `npm run check` and the four Python commands pass; you have measured and reported runtime memory, load time, and transfer sizes; the minimal policy is documented.

### P17 — Hosting, documentation, acceptance

**Goal:** a live static deployment and honest documentation.
**Read:** MD-8, MD-9; `docs/plan.md` acceptance checklist style.
**Deliverables:**
- Static-hosting configuration: security headers (the minimal policy, content-type sniffing protection, framing protection, referrer policy, strict transport security), correct types for the runtime files, long-lived caching for pinned runtime files and short for the page, no server functions, and a reproducible build that places the runtime files, wheel, and page into the output directory. State the pinned versions and how to update them.
- Verification of the privacy statement: a recorded network log of a full session showing that, after load, every request is same-origin static content and no request carries note data; zero third-party requests overall.
- README additions: web tool section, limits, privacy statement, known limitations from SRS 1.3 (formatting, ink, drawings, PDFs skipped), how to install the CLI with its extra, how to self-host the static site.
- Maintainer acceptance checklist for the web tool, plus a "turn it off" procedure for the static host.
- Lighthouse accessibility and performance results, reported as numbers (target at least 90; explain any shortfall).
- Ask the maintainer for MD-9 inputs before filling in repository, license, and contact details.
**Gate:** maintainer opens the live site on a desktop and on a real phone, converts real notes, and opens the ZIP in Obsidian.

---

## 6. Things to watch while implementing

- Memory and timing numbers in the browser, not native Python, decide the limits.
- A conversion that hangs can only be stopped by ending the worker; design every state around that.
- Keep the object URL and the session lifetime short; free large buffers promptly.
- Names from uploaded files are untrusted everywhere: ZIP entries, page text (set as text, never as markup), logs, and the issue link.
- The page must work with a pinned runtime that is **not** loaded from a third party.
- Do not add features: no accounts, no storage, no server, no analytics, no sharing links.

---

## 7. Amendments you are authorized to make (and nothing else)

| Document | Section | Change |
|---|---|---|
| `docs/dds.md` | 2 (decisions) | Add D-16 browser-first deployment as a second product mode; D-17 plain-text preview; D-18 limits profile injected at construction; D-19 no server component in this release |
| `docs/dds.md` | 3.1 and 3.2 | Add the web composition root and the `site/` directory; update the dependency-rule table |
| `docs/dds.md` | 4.2 and 4.4 | Add the limits profile model; extend the naming policy with direction-control removal |
| `docs/dds.md` | 7.9 | Add 7.9.1 (web limits profile) and the chunked read; add the parser caps where the parser is described |
| `docs/dds.md` | 11 | Split dependencies into core (none) and the `cli` extra |
| `docs/srs.md` | 1.1 and requirements | Add the browser product mode and requirements for limits, privacy, and ZIP download, leaving FR-01 to FR-07 and AC-1 to AC-4 intact for the CLI |
| `docs/plan.md` | new phases | Append P13 to P17 with this brief's goals, deliverables, tests, and gates, and the one-paragraph "deferred, Option A only" note. Tick boxes only as phases finish |
| `README.md` | usage | Web section, privacy statement, install instructions with the `cli` extra |
| `docs/format.md` | (none) | Not touched |

Edit each document only in the phase that needs it, and list the exact changes in that phase's report.

---

## 8. End-of-session report (every phase)

Files changed; tests added (count and names); requirement and report-item ids covered (for example R-2, B-02, Q-03); full output of every gate command; measurements (when the phase has any) with the machine and runtime version; assumptions; open questions for the maintainer; anything you could not verify and what would verify it. Then tick the tracker, commit locally, and **stop**.
