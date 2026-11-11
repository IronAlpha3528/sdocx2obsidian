# Implementation Plan — sdocx2obsidian

Authority: `docs/dds.md` (design) and `docs/srs.md` (requirements). This plan sequences the work into phases P0 to P12 (same numbering as DDS milestones M0 to M12). Each phase is one agent session ending at a gate where the agent stops and waits for the maintainer.

## Progress tracker (the agent ticks boxes; it edits no other part of this file)
- [x] P0 Tooling smoke test
- [x] P1 DDS approval and open questions
- [x] P2 Format spike confirmation
- [x] P3 Domain layer
- [x] P4 Test helpers
- [x] P5 Core: reader and records
- [x] P6 Core: media and text
- [ ] P7 Core: parser and renderer
- [ ] P8 Infrastructure: scanner and extractor
- [ ] P9 Infrastructure: storage
- [ ] P10 Application service
- [ ] P11 CLI and composition
- [ ] P12 Acceptance, packaging, release readiness

## Working protocol for every phase
**Start of session**
1. Read `AGENTS.md`, the rules, this phase, and the DDS sections it cites.
2. State a plan in at most 10 lines: files to create or edit, tests to write first, assumptions. Ask about anything ambiguous before coding.

**During the session**
3. Write tests first from the tables below; run them and confirm they fail for the right reason.
4. Implement the smallest code that satisfies the DDS contract; keep functions within 35 lines.
5. After every file created or changed run the gate: `pytest`, `mypy --strict src tests`, `ruff check src tests`, `python scripts/check.py`.
6. Do not edit DDS, SRS, rules, or interfaces. If something must change, stop and propose it.

**End of session**
7. Report: files changed, tests added (count and names), requirement ids covered, full gate output, assumptions made, open questions.
8. Tick the tracker, commit locally to Git with the message form `P<n>: <phase title>`, and STOP. Do not start the next phase until the maintainer says so. Never push (`git push`) to GitHub or any remote repository; pushing is strictly reserved for the maintainer or requires their explicit instruction.

**Git & Remote Policy**: All commits must strictly remain local (`git commit`). Never run `git push`.

**Stop-and-ask triggers**: a DDS contract seems wrong or incomplete; a real sample disagrees with the DDS; a new dependency seems needed; a test cannot be made to pass without weakening it; a rule seems to conflict with the task.

---

## P0 — Tooling smoke test
**Goal**: prove the toolchain works on the empty skeleton.
**Read**: DDS 3.2, 11.
**Deliverables**
- A virtual environment with the project installed in editable mode with dev dependencies.
- `src/sdocx2obsidian/__init__.py` exposing a version string.
- `.pre-commit-config.yaml` running ruff, mypy, and `scripts/check.py`.
- One smoke test `tests/unit/test_package.py`: the package imports and exposes a non-empty version string.
**Tests**: the smoke test; deliberately introduce a forbidden import in a throwaway file to confirm `scripts/check.py` fails, then delete it.
**Gate**: all four commands pass.

> **Note — CI/GitHub Actions is SKIPPED**: The `.github/` directory and its CI workflow (`ci.yml`) have been deliberately removed from the codebase. CI must **not** be re-created or referenced until the maintainer gives explicit instruction to do so. The gate for every phase is the four local commands only: `pytest`, `mypy --strict src tests`, `ruff check src tests`, `python scripts/check.py`.

## P1 — DDS approval and open questions (maintainer gate)
**Goal**: freeze the design.
**Read**: DDS 1.3, 2, 13.
**Work**: the agent summarizes decisions D-01 to D-15 and open questions O-01 to O-06, and asks the maintainer for answers. Only on explicit approval does it apply amendments to `docs/dds.md`; it updates `docs/srs.md` only if the maintainer says so.
**Deliverables**: approved DDS (with decisions recorded), list of answered questions.
**Gate**: maintainer writes "DDS approved".

## P2 — Format spike confirmation
**Goal**: confirm DDS section 6 on real files before building the parser.
**Prerequisite**: maintainer places the two sample notes (S1, S2) and any additional samples in `samples/` (gitignored).
**Read**: DDS 6; `docs/format.md`; skill `spike`.
**Work**: using throwaway analysis outside the repository, confirm for each sample: entry list; media names and indexes; GUID markers; title and body found with the region-bounded rule (6.10); placeholder offsets; object kinds, media indexes, audio titles, durations, and tail offsets; voice recording as unreferenced audio. Analyze any additional samples (reordered insertion, empty title, empty body, media-only, emoji, formatted text) and record results.
**Deliverables**: updated `docs/format.md` (evidence table with VERIFIED or UNVERIFIED per item and per sample) and a short list of proposed DDS changes, if any.
**Tests**: none in the repository.
**Gate**: maintainer approves the evidence; DDS amended if needed.

## P3 — Domain layer
**Goal**: models, exceptions, protocols, naming policy.
**Read**: DDS 4, 5, 7.1.
**Deliverables**: `domain/models.py`, `exceptions.py`, `protocols.py`, `naming.py` with matching tests.
**Tests**
| File | Cases |
|---|---|
| `tests/unit/domain/test_models.py` | every dataclass is frozen and slotted (assignment fails); defaults and field types; BatchResult counts relation; ParsedNote invariants helper behavior if provided |
| `tests/unit/domain/test_exceptions.py` | hierarchy matches DDS 4.3; messages preserved; cause chaining; every exception catchable via the base |
| `tests/unit/domain/test_naming.py` | illegal characters; link-only characters; trimming; reserved Windows names; empty result uses fallback; length limits keep the extension; prefix removal (`0@`, `12@`, no prefix, only digits and `@`); extension classification for every listed extension in mixed case; asset folder name; versioned stem; idempotence of sanitizing |
**Gate**: four commands pass; `scripts/check.py` confirms the domain imports only the allowed modules.

## P4 — Test helpers
**Goal**: build the tools every later phase depends on.
**Read**: DDS 10.2, 10.3, 6.
**Deliverables**: `tests/helpers/builder.py`, `tests/helpers/fakes.py`; register the `real_samples` marker (and skip logic when `samples/` is empty) in test configuration.
**Tests**
| File | Cases |
|---|---|
| `tests/unit/helpers/test_builder.py` | produces a valid ZIP with the required entries; entry names and media naming follow 6.2; text records carry length and count; GUID markers present and well-formed; image and audio signatures present with indexes; body record length spans objects; every corruption mode produces the intended defect; deterministic output |
| `tests/unit/helpers/test_fakes.py` | each fake records calls in order; configured failure per file name raises the configured exception; reporter fake stores outcomes |
| `tests/integration/test_real_samples.py` (skeleton) | skipped cleanly when samples are absent |
**Gate**: four commands pass; builder output for S1-like and S2-like inputs is documented as the reference for P5.

## P5 — Core: reader and records
**Goal**: decode structure from note bytes.
**Read**: DDS 6.3 to 6.10, 7.2, 7.3.
**Deliverables**: `core/reader.py`, `core/records.py` and tests.
**Tests**
| File | Cases |
|---|---|
| `tests/unit/core/test_reader.py` | u16 and u32 little-endian reads; position and remaining; seek; peek; string by unit count; out-of-range reads raise MalformedNoteError with the offset; odd lengths; zero-length strings; lone surrogates replaced |
| `tests/unit/core/test_records.py` | GUID finder accepts valid markers and rejects wrong length or shape; fewer than two markers raises; title and body located in S1-like and S2-like synthetic notes; empty title region gives empty title; empty body region gives empty body; padding-only region gives no candidate (guards the N of at least 1 rule); ambiguity raises MalformedNoteError; placeholders: none, adjacent, first, last; object splitter regions; image object index; audio object index, title, duration, tail offset; unsupported object; two signatures in one region raises; truncated region; body length larger than file is clipped with a warning |
| `tests/integration/test_real_samples.py` | S1: title "Hello world", two placeholders, objects image 0 and audio 1; S2: title "Yolo", three placeholders, objects image 0, image 1, audio 2 (marked real_samples) |
**Gate**: four commands pass; real-sample tests pass when samples are present.

## P6 — Core: media and text
**Goal**: media catalog and text normalization.
**Read**: DDS 7.4, 7.5, 4.4.
**Deliverables**: `core/media.py`, `core/text.py` and tests.
**Tests**
| File | Cases |
|---|---|
| `tests/unit/core/test_media.py` | index parsed from entry names; entries without `@` skipped with a warning; image and audio classification; unsupported extension skipped with a warning; uppercase extensions; output names for the real sample names (`files_261028_230722_161.jpg`, `_261028_230754_224.m4a`, `6ae232fb_b55e6.m4a`); illegal characters sanitized; empty stem uses the fallback; duplicate names after stripping get index suffixes in index order; catalog keyed by index |
| `tests/unit/core/test_text.py` | CRLF and CR normalized; control characters removed except newline and tab; trailing spaces and tabs stripped per line; runs of three or more newlines become two; leading and trailing newlines trimmed; whitespace-only segments dropped; single newlines preserved; Unicode preserved; the real S1 and S2 body segments produce the expected clean text |
**Gate**: four commands pass.

## P7 — Core: parser and renderer
**Goal**: end-to-end conversion of bytes to Markdown text.
**Read**: DDS 7.6, 7.7, 8.
**Deliverables**: `core/parser.py`, `core/renderer.py` and tests.
**Tests**
| File | Cases |
|---|---|
| `tests/unit/core/test_parser.py` | T-01 text, image, text, audio in order; T-05 voice recordings first and ordered by index; T-06 adjacent placeholders; T-07 more placeholders than objects (extras dropped, warning); T-08 more objects than placeholders (appended, warning); T-09 unsupported object consumes a slot; T-10 duplicate output names; T-15 empty body and no media gives zero blocks; unreferenced image warns and is not exported; duplicate media reference warns; audio offset mismatch warns; assets map matches media blocks exactly; empty or too-short note bytes raise MalformedNoteError; determinism |
| `tests/unit/core/test_renderer.py` | AC-1 shape; embeds use the passed folder name including `(1)` variants; blocks separated by one blank line; one trailing newline; zero blocks gives one newline; invalid characters in names raise RenderError; no backslashes ever appear |
| `tests/integration/test_real_samples.py` | S1 and S2 parser plus renderer output equals the golden outputs of DDS 8.4 byte for byte (T-18) |
**Gate**: four commands pass; golden outputs match.

## P8 — Infrastructure: scanner and extractor
**Goal**: read sources safely.
**Read**: DDS 7.8, 7.9, 9.3; skill `archive`.
**Deliverables**: `infrastructure/scanner.py`, `infrastructure/extractor.py` and tests.
**Tests**
| File | Cases |
|---|---|
| `tests/unit/infrastructure/test_scanner.py` | only `.sdocx` files returned; uppercase extension; subfolders ignored; hidden files skipped; sorted order; empty folder; missing path; path is a file; unreadable folder where supported |
| `tests/unit/infrastructure/test_extractor.py` | valid archive returns note bytes and media keyed relative to `media/`; `mediaInfo.dat` and other entries excluded; not a ZIP; empty file; truncated archive; missing `note.note` raises MissingEntryError; unsafe names (absolute, drive, backslash, parent segment, empty); duplicate names; entry count limit; oversize entry with patched small limit; total size limit; compression ratio limit (T-16); source file bytes and modification time unchanged (part of T-17); source name equals the stem |
**Gate**: four commands pass.

## P9 — Infrastructure: storage
**Goal**: collision-safe, atomic output.
**Read**: DDS 7.10, 8.2; skill `storage`.
**Deliverables**: `infrastructure/storage.py` and tests.
**Tests**
| File | Cases |
|---|---|
| `tests/unit/infrastructure/test_storage_prepare.py` | creates missing nested directory; existing directory accepted; path is a file raises DestinationError; unwritable directory where supported; probe file removed |
| `tests/unit/infrastructure/test_storage_resolve.py` | free name unchanged; `.md` exists gives `(1)`; folder only exists gives `(1)` (T-12); `(1)` taken gives `(2)`; case-only difference counts as a collision; sanitized names; reserved Windows names; long names; nothing created on disk |
| `tests/unit/infrastructure/test_storage_persist.py` | T-02 text only creates no asset folder; with assets creates folder and files; file contents byte exact; UTF-8 with `\n` newlines; target appeared after resolve raises PersistError and removes everything; failure injected while writing assets leaves destination unchanged (T-13); failure injected at the second move rolls back the first; staging directory always removed; existing files never overwritten |
**Gate**: four commands pass.

## P10 — Application service
**Goal**: orchestration with fakes.
**Read**: DDS 3.3 to 3.5, 7.11.
**Deliverables**: `application/service.py` and tests.
**Tests** (`tests/unit/application/test_service.py`)
| Case |
|---|
| Per-note call order is extract, parse, resolve, render, persist |
| The folder name passed to render equals the resolved folder name |
| Success outcome carries warnings and asset count |
| T-04 two valid and one corrupt file: two successes, one failure, batch continues, counts correct |
| Failure at each stage (extract, parse, resolve, render, persist) yields a failed outcome with a clear message and no later stage runs |
| Unexpected exception caught by the last-resort handler and labeled as an internal error with the exception type |
| Reporter receives the total first and an outcome after each file, in order |
| SourceError and DestinationError propagate from the batch (fatal) |
| Zero source files returns an empty batch result |
| Service imports only domain (verified by the checker) |
**Gate**: four commands pass.

## P11 — CLI and composition
**Goal**: the user-facing tool.
**Read**: DDS 7.12; skill `guard`.
**Deliverables**: `cli.py`, `__main__.py`, Rich-based reporter, and tests.
**Tests** (`tests/unit/test_cli.py` using Typer's test runner)
| Case |
|---|
| Missing `--source` or `--dest` gives a usage error with exit code 2 |
| Source missing or not a folder gives a friendly message and exit code 2 |
| Destination that is a file gives a friendly message and exit code 1 |
| `--help` and `--version` work |
| Successful run prints a summary with processed, succeeded, failed counts; exit code 0 |
| Run with one corrupted file prints the file name and reason, shows counts, exits 0 |
| Warnings are displayed with the file name |
| No `.sdocx` files prints a notice, exit 0 |
| Output is readable without color |
| Only `cli.py` imports Typer and Rich (checker) |
**Gate**: four commands pass; manual run on a temporary folder with synthetic notes.

## P12 — Acceptance, packaging, release readiness
**Goal**: prove the SRS and prepare to use the tool.
**Read**: DDS 10, 11; workflow `accept`.
**Deliverables**
- `tests/integration/test_acceptance.py` with named tests `test_ac1_...` to `test_ac4_...` using real implementations, `tmp_path`, and the builder; plus T-03, T-14 (links use `/` under Windows-style paths), T-17 (source untouched), T-18 (real samples).
- Coverage threshold configured: whole package at least 90 percent, `core/` and `application/` at least 95 percent branch coverage.
- A short `README.md` with installation, usage, behavior notes (voice recordings first, naming rules, warnings), and known limitations.
- Clean-environment install check: install the package in a fresh environment and run the command's `--help`.
**Gate**: all tests pass locally; maintainer runs the tool on a copy of real notes and checks them in Obsidian (links resolve, audio and images display). CI is out of scope until explicitly instructed.

## Maintainer acceptance checklist (after P12)
1. Notes with text only, with images, with attached audio, and with voice recordings convert correctly.
2. Running twice creates `(1)` versions without overwriting.
3. A corrupted file is skipped with a clear message.
4. Original `.sdocx` files are unchanged.
5. No empty `_Assets` folders and no hidden staging leftovers.
6. Open questions O-01 to O-06 are closed or consciously deferred.
