# Design Document (DDS) — sdocx2obsidian

| Field | Value |
|---|---|
| Document version | 1.0.0 (draft for approval) |
| Companion documents | `docs/srs.md` (requirements), `docs/format.md` (format evidence log) |
| Audience | The Antigravity agent and the maintainer |
| Contains code? | No. This document specifies structure, contracts, and algorithms in prose and tables only |

Status legend used for format facts: **VERIFIED** (confirmed on real samples S1 and S2), **ASSUMED** (reasoned or partly observed, to be confirmed).

---

## 1. Introduction

### 1.1 Purpose
Define the complete design needed to implement `sdocx2obsidian`, a CLI that converts Samsung Notes `.sdocx` files into Obsidian Markdown with inline media, so that an agent can generate the code module by module without further design decisions.

### 1.2 Scope
Everything in SRS section 1.3 In-Scope. The design resolves four gaps found while analyzing real files:
1. The `.sdocx` internals are binary, not XML.
2. Media files are not hashed; they are named `<index>@<original name>`.
3. Voice recordings have no inline position in the text.
4. Exported file names carry a timestamp suffix (for example `Yolo_261029_130712.sdocx`).

### 1.3 Approved SRS amendments
The maintainer has approved incorporating the following amendments into the design:
| SRS item | Observed reality | Design decision |
|---|---|---|
| FR-05 "retain hashed filenames" | Names look like `0@files_261028_230722_161.jpg` | Keep the original name but strip the `<index>@` prefix; resolve duplicates deterministically (D-04) |
| FR-03 inline order | Voice recordings have no inline marker; inline media placed at placeholders | Voice recordings are placed at the start of the note (D-05); inline media strictly follow the sequence and relative position of placeholders in text (D-03) |
| FR-06 note naming | Stem includes an export timestamp | Follow the SRS: note name equals the source stem (D-09) |
| FR-04 example names | `<HashedFileName.ext>` | Embed uses the stripped media file name |

### 1.4 Glossary
| Term | Meaning |
|---|---|
| Note | One `.sdocx` file |
| Body | The typed text of the note, including object placeholders |
| Placeholder | The character U+FFFC in the body marking where an inline object sits |
| Inline object | An image or an attached audio file anchored at a placeholder |
| Voice recording | An audio file recorded inside Samsung Notes; has a media file but no placeholder |
| Media catalog | The set of media entries of one note, keyed by media index |
| Asset folder | `<NoteStem>_Assets/` beside the Markdown file |
| Target paths | The collision-resolved Markdown path and asset folder of one note |
| Outcome | The per-file result record returned by the service |

---

## 2. Design Decisions

| Id | Decision | Rationale |
|---|---|---|
| D-01 | Parse `note.note` as a binary file with standard-library tools; no XML | Verified binary format |
| D-02 | The extractor returns raw entry bytes; the parser interprets them | Keeps zip I/O out of `core/` |
| D-03 | Inline objects are linked to placeholders by document position order: Nth placeholder in the body text anchors the Nth inline object, strictly preserving the sequence and relative position with respect to the text | Verified consistent on S1 and S2; maintainer decision for O-01 confirms strict preservation of document sequence and relative position with text |
| D-04 | Output media name is the entry name without the `<digits>@` prefix, sanitized; duplicates after stripping keep the first name and get an index suffix on later ones | SRS-style stable names, no data loss |
| D-05 | Audio media not referenced by any inline object are voice recordings, placed at the start, ordered by media index | Matches S1, keeps content, user decision |
| D-06 | Media referenced by objects without a matching placeholder are appended at the end with a warning; placeholders without a usable object are dropped with a warning | Never lose content silently |
| D-07 | Media files not classifiable as image or audio, and unreferenced images, are not exported; a warning is recorded | SRS scope limits |
| D-08 | Processing is strictly sequential | Makes target resolution stateless and simple |
| D-09 | Note name is the source file stem, sanitized | SRS FR-06 |
| D-10 | Whole archive content that matters is held in memory (note file and media) with explicit size limits | Simple protocols; large media streaming is a future extension |
| D-11 | Per-file failure never aborts the batch; process exit code is 0 when the batch completes, non-zero only for fatal setup errors | SRS AC-4 "exits cleanly"; maintainer to confirm |
| D-12 | Reporting uses a progress-reporter protocol implemented in the CLI | Lower layers cannot print |
| D-13 | Text is emitted as plain text without Markdown escaping | SRS FR-02; risk R-06 |
| D-14 | Shared pure naming policy lives in `domain/naming.py` | Both `core` and `infrastructure` need it and cannot import each other |
| D-15 | The core is split into small modules (reader, records, media, text, parser, renderer) | 35-line function limit |

---

## 3. Architecture

### 3.1 Layers and dependency rules
| Layer | Package | Responsibility | May depend on |
|---|---|---|---|
| Presentation and composition | `cli.py`, `__main__.py` | Arguments, wiring, console output, exit codes | everything |
| Application | `application/` | Per-file workflow, batch loop, outcomes | `domain` |
| Core | `core/` | Pure parsing and rendering | `domain` |
| Infrastructure | `infrastructure/` | Zip I/O, directory scanning, disk persistence | `domain` |
| Domain | `domain/` | Models, protocols, exceptions, naming policy | stdlib only |

`scripts/check.py` enforces these rules mechanically.

### 3.2 Project layout
```text
src/sdocx2obsidian/
  __init__.py            version string only
  __main__.py            runs the CLI
  cli.py                 composition root and presentation
  domain/    models.py  protocols.py  exceptions.py  naming.py
  core/      reader.py  records.py  media.py  text.py  parser.py  renderer.py
  infrastructure/  scanner.py  extractor.py  storage.py
  application/     service.py
tests/
  unit/{domain,core,infrastructure,application}/
  integration/  test_acceptance.py  test_real_samples.py
  helpers/      builder.py  fakes.py
docs/  srs.md  dds.md  format.md
```

### 3.3 Runtime flow for one note
1. Scanner supplies the list of `.sdocx` paths (once per batch).
2. Extractor opens the archive and returns an archive value holding the note file and media entries.
3. Parser decodes the archive into a parsed note: ordered blocks, an asset map, warnings.
4. Storage resolves collision-free target paths from the source stem.
5. Renderer produces the Markdown text using the resolved asset folder name.
6. Storage persists Markdown and assets atomically.
7. Service returns a success outcome (with warnings) or a failed outcome (with a message).
Order 4-before-5 is mandatory so embeds carry the final folder name.

### 3.4 Batch flow
Destination is prepared once (created if missing, writable check). Files are processed in case-insensitive name order. After each file the progress reporter is notified. After the loop a batch result with counts is returned. The CLI prints the summary and sets the exit code.

### 3.5 Error flow
Low-level exceptions are converted to domain exceptions at the layer that sees them (infrastructure for I/O, core for malformed data). The service converts domain exceptions to failed outcomes. One documented last-resort catch at the per-file boundary converts any unexpected exception into a failed outcome labeled as an internal error. Fatal setup errors (source missing, destination unusable) abort before the loop and surface through the CLI.

### 3.6 Requirement traceability
| Requirement | Realized by |
|---|---|
| FR-01 CLI, batch, dest creation, read-only source | `cli`, `scanner`, `storage.prepare`, `extractor` (read-only) |
| FR-02 plain text | `records`, `text`, `parser` |
| FR-03 inline order | `records` (placeholders, objects), `parser` assembly |
| FR-04 embed syntax | `renderer` |
| FR-05 asset folder and names, clean vault | `media`, `domain/naming`, `storage.persist` |
| FR-06 naming and collisions | `storage.resolve`, service ordering |
| FR-07 non-blocking errors and summary | `service`, `cli` reporter |
| AC-1 .. AC-4 | `tests/integration/test_acceptance.py` |

---

## 4. Domain Layer Design (`domain/`)

All dataclasses are frozen with slots. Sequences are tuples. Mappings are treated as read-only by convention. Only stdlib imports.

### 4.1 Enumerations
| Name | Members | Meaning |
|---|---|---|
| MediaKind | IMAGE, AUDIO | Category of an exported media file |
| OutcomeStatus | SUCCEEDED, FAILED | Result of one file |

### 4.2 Models
**SdocxArchive** — raw content read from one `.sdocx`
| Field | Type | Meaning |
|---|---|---|
| source_name | str | Source file stem (used for the note name) |
| note_bytes | bytes | Content of the entry `note.note` |
| media | Mapping[str, bytes] | Entry name relative to the `media/` folder to bytes; excludes `mediaInfo.dat` |

**TextBlock** — field `text` (str): plain text, already normalized, never empty.

**MediaBlock** — fields `filename` (str: final output file name, no path separators) and `kind` (MediaKind).

**ContentBlock** — alias meaning TextBlock or MediaBlock.

**ParsedNote**
| Field | Type | Meaning |
|---|---|---|
| title | str | In-note title; informational only |
| blocks | tuple[ContentBlock, ...] | Final ordered content, voice recordings first |
| assets | Mapping[str, bytes] | Output file name to bytes, only for files referenced by blocks |
| warnings | tuple[str, ...] | Non-fatal findings |
Invariants: every MediaBlock filename is a key of assets; every asset key appears in exactly one MediaBlock; no two blocks of text are adjacent without media between them.

**TargetPaths**
| Field | Type | Meaning |
|---|---|---|
| note_stem | str | Final stem, possibly with ` (n)` suffix |
| md_path | Path | Full path of the Markdown file |
| assets_dir | Path | Full path of the asset folder |
| assets_dir_name | str | `<note_stem>_Assets`, used inside links |

**ConversionOutcome**
| Field | Type | Meaning |
|---|---|---|
| source | Path | Source file |
| status | OutcomeStatus | Result |
| markdown_path | Path or None | Created note; None when failed |
| asset_count | int | Media files written |
| warnings | tuple[str, ...] | Parser and storage warnings |
| error | str or None | Human-readable failure reason; None on success |

**BatchResult** — `outcomes` (tuple of ConversionOutcome), `total`, `succeeded`, `failed` (ints; total equals succeeded plus failed).

### 4.3 Exception hierarchy
Base: **Sdocx2ObsidianError**. Each carries a short human-readable message suitable for display and a chained cause when available.
| Exception | Parent | Raised when |
|---|---|---|
| SourceError | base | Source directory missing, not a directory, unreadable |
| ArchiveError | base | Any archive-level problem |
| CorruptArchiveError | ArchiveError | Not a valid ZIP, truncated, bad CRC, decompression failure |
| UnsafeArchiveError | ArchiveError | Unsafe entry names, duplicate entries, limit exceeded |
| MissingEntryError | ArchiveError | Required entry `note.note` absent |
| ParseError | base | Any decoding problem |
| MalformedNoteError | ParseError | Lengths inconsistent, text not decodable, records not found |
| RenderError | base | Block data would produce an invalid link (should not happen after parsing) |
| StorageError | base | Any destination problem |
| DestinationError | StorageError | Destination cannot be created or written |
| PersistError | StorageError | Staging, commit, or rollback failure; target appeared meanwhile |

### 4.4 Naming policy (`domain/naming.py`, pure functions and constants)
| Concern | Rule |
|---|---|
| Characters replaced by underscore | `\ / : * ? " < > |` and control characters (all names); additionally `# ^ [ ]` (names used in links) |
| Trim | Leading/trailing spaces; trailing dots |
| Windows reserved stems | CON, PRN, AUX, NUL, COM1-9, LPT1-9 (case-insensitive) get a trailing underscore |
| Empty result | Replaced by a fallback supplied by the caller |
| Maximum length | Note stem 120 characters; media file stem 100 characters; extension preserved |
| Extension handling | Lower-cased copy used for classification; original extension case kept in the output name |
| Media prefix removal | Remove a leading run of decimal digits followed by `@` |
| Asset folder name | Note stem plus the literal suffix `_Assets` |
| Versioned stem | Base stem plus a space and `(n)` with n starting at 1 |
Classification sets: image extensions `png jpg jpeg gif webp`; audio extensions `m4a amr mp3 wav ogg` (case-insensitive).

---

## 5. Protocol Contracts (`domain/protocols.py`)

Each protocol is a structural interface implemented by one concrete class. Contracts state inputs, outputs, errors, and guarantees.

### 5.1 ISourceScanner
- `list_sources(source_dir: Path) -> Sequence[Path]`
- Returns regular files whose extension is `.sdocx` (case-insensitive), non-recursive, sorted by name casefolded.
- Raises SourceError if the directory is missing, not a directory, or unreadable.
- Never modifies anything.

### 5.2 IArchiveExtractor
- `extract(source: Path) -> SdocxArchive`
- Returns the note bytes and media entries; ignores all other entries.
- Raises CorruptArchiveError, UnsafeArchiveError, MissingEntryError.
- Read-only on the source; releases the file before returning.

### 5.3 INoteParser
- `parse(archive: SdocxArchive) -> ParsedNote`
- Pure; no I/O. Raises MalformedNoteError. Warnings for recoverable anomalies.
- Deterministic for identical input.

### 5.4 IMarkdownRenderer
- `render(note: ParsedNote, assets_dir_name: str) -> str`
- Pure. Returns the full Markdown text ending with exactly one newline. Raises RenderError for names that would break a link.

### 5.5 IStorageRepository
- `prepare(dest_dir: Path) -> None` — creates the directory and parents if absent; verifies it is a writable directory. Raises DestinationError.
- `resolve_target_paths(dest_dir: Path, note_name: str) -> TargetPaths` — sanitizes the name, finds the smallest version number such that neither `<stem>.md` nor `<stem>_Assets` exists (case-insensitive comparison). Creates nothing. Stateless.
- `persist(paths: TargetPaths, markdown: str, assets: Mapping[str, bytes]) -> None` — atomic write per section 7.9. Creates the asset folder only if assets is non-empty. Raises PersistError.

### 5.6 IProgressReporter
- `started(total: int) -> None`
- `finished(outcome: ConversionOutcome) -> None`
- Called by the service; implemented by the CLI (live display) and by test fakes. Must not raise.

---

## 6. `.sdocx` Binary Format Specification (as used by the parser)

All integers are little-endian. "UTF-16" means UTF-16LE without byte-order mark. Evidence: samples S1 and S2 (see `docs/format.md`).

### 6.1 Container (VERIFIED)
ZIP archive, deflate. Entries seen: `note.note`, `end_tag.bin`, `pageIdInfo.dat`, one `<GUID>.page` per page (pen data, 3-4 seen), `media/mediaInfo.dat`, and media files `media/<index>@<name>`. The parser needs only `note.note` and the media files. Everything else is ignored by the extractor.

### 6.2 Media entries (VERIFIED)
- Entry name: decimal media index, the character `@`, then the original file name with extension.
- Index: zero-based, unique per note; observed in creation order (S1: image 0, attached audio 1, voice 2; S2: image 0, image 1, audio 2).
- Original name shapes seen: images `files_<yymmdd>_<hhmmss>_<n>.jpg`; attached audio `_<yymmdd>_<hhmmss>_<n>.m4a`; voice `<8 hex>_<hex>.m4a`.
- Extension `.m4a` does not guarantee a specific codec (AAC and E-AC-3 seen); the tool copies bytes unchanged.
- `mediaInfo.dat` (VERIFIED, not required by the parser): header of a u32 and a u16 count, then per-media records holding the index, name, and a 64-character hex SHA-256 of the media bytes, ending with the ASCII marker `EOFX`. Record order is not index order. Version 1 does not read it; a future integrity check may.

### 6.3 `note.note` overall layout
Sections appear in this order (VERIFIED order on S1 and S2):
1. File header (ignored).
2. A record introduced by an object GUID marker, followed by the **title record**.
3. A second GUID marker, followed by the **body record**.
4. Inside the body record after the text: paragraph/attribute records (ignored), then the **object records** (one per inline object).
5. After the body record: voice-recording entries (informational) and a trailing footer (ignored).

### 6.4 GUID marker (VERIFIED, 9 of 9)
A u16 with value 36 followed by 36 ASCII characters shaped like a GUID (8-4-4-4-12 hex groups). Counts: S1 has 4 markers (title, body, image, audio); S2 has 5 (title, body, image, image, audio). Markers located after the body text start identify object records.

### 6.5 Text records (VERIFIED, 4 of 4)
Layout: u32 record length, u32 character count N, then N UTF-16 code units of text.
- Title: S1 count 11 ("Hello world"), S2 count 4 ("Yolo").
- Body: S1 count 293, S2 count 31. The declared length of the body record extends through the object records (S1 2186 bytes, S2 1779 bytes), so it is larger than the text.
- Body content: `\n` separates paragraphs; blank lines appear as repeated `\n`; U+FFFC marks each inline object. No other control characters were observed. Surrogate pairs (emoji) are expected but unverified.
- Trailing spaces occur at line ends in typed text (S1 "Hello " and "Hi Ola ").

### 6.6 Object records
Each starts at a GUID marker located after the body text and extends to the next marker (or to the end of the body record).

**Image object (VERIFIED, 3 of 3)** contains the byte sequence 06 00 3E 00 00 00 02 00 followed by a u16 media index. S1 image index 0; S2 indexes 0 and 1.

**Attached audio object (VERIFIED, 2 of 2)** contains the byte pair 1F 03 followed by: u32 media index; u16 title length T; T UTF-16 units of display title (for example "Over_the_Horizon"); u16 duration length D; D UTF-16 units of text shaped `HH:MM:SS`. The record's tail also stores a u32 equal to the placeholder's character offset in the body (S1 119, S2 21). The display title differs from the media file name and is not used for naming.

**Other object kinds (UNKNOWN)**: records matching neither signature are treated as unsupported objects.

### 6.7 Placeholder-to-object linking (D-03)
- The Nth U+FFFC in the body corresponds to the Nth object record in file order (VERIFIED consistent in S1: image then audio; S2: image, image, audio — three adjacent placeholders).
- Supporting evidence (ASSUMED interpretation): the header field just before an object record repeats the text offset of the previous object (S1 audio header 64 equals the image offset 64; S2 headers 19 and 20 equal the preceding objects' offsets), which suggests records are stored in document order.
- Cross-check rule: for attached audio objects the stored text offset must equal the placeholder offset; a mismatch produces a warning, not a failure.
- Remaining uncertainty: both samples were built in position order. A sample with objects inserted out of creation order would confirm the rule (open question O-01).

### 6.8 Voice recordings (VERIFIED on S1)
A voice recording has a media file (S1 index 2) and an entry after the body record holding index, title ("Voice 001") and duration. It has no GUID marker and no placeholder. Version 1 does not parse these entries; it identifies voice recordings as audio media files not referenced by any object (D-05).

### 6.9 Ignored content
Pen strokes (`.page`), `pageIdInfo.dat`, `end_tag.bin` (ends with the text "Document for S-Pen SDK"), attribute/paragraph records, and the footer.

### 6.10 Locating the text records (technical risk R-01)
Because record framing between the header and the body is only partly decoded, the parser finds text records by validated, region-bounded scanning:
1. Find all GUID markers in order. At least two are required (title and body); fewer raises MalformedNoteError.
2. **Title region**: from the end of the first marker to the start of the second. **Body region**: from the end of the second marker to the start of the third marker, or to the end of the file when there is no third marker (a note without objects).
3. In each region take the first offset that satisfies all checks: character count N is at least 1; the declared record length is at least 4 plus twice N; the N UTF-16 units fit inside the file; every unit is printable, `\n`, tab, or U+FFFC; no NUL unit. That candidate is the region's text. A region without a candidate means empty text (empty title or empty body).
4. If more than one structurally different candidate could start at the same earliest offset, or the body candidate overlaps the next marker, raise MalformedNoteError rather than guess.
Lesson from analysis: allowing N equal to 0 makes the scan match zero padding everywhere, so the check N of at least 1 is mandatory.
A throwaway prototype of this procedure, run on S1 and S2, produced the titles "Hello world" and "Yolo", the placeholder offsets (S1: 64 and 119; S2: 19, 20, 21), the object lists (S1: image 0, audio 1; S2: image 0, image 1, audio 2), and exactly the golden outputs of 8.4. Milestone M2 repeats this check formally.

---

## 7. Module Designs

For each module: responsibility, inputs and outputs, collaborators, algorithm, edge cases, errors, tests. Helper functions must stay within 35 lines.

### 7.1 `domain/models.py`, `exceptions.py`, `protocols.py`, `naming.py`
Implement exactly sections 4 and 5. `naming.py` holds only pure functions: sanitize a name for files and links with a caller-supplied fallback and maximum length; strip the media index prefix; classify an extension as image, audio, or neither; build the asset folder name; build the versioned stem. Tests: table-driven cases for every rule in 4.4 including reserved names, length limits, empty results, repeated underscores not collapsed (keep predictable), and extension handling.

### 7.2 `core/reader.py` — binary cursor
Responsibility: safe little-endian reads over a bytes object with bounds checking.
- Capabilities: read u16, u32, fixed number of bytes, UTF-16 string by unit count; peek; seek; remaining length; position.
- Every out-of-range read raises MalformedNoteError with the offset.
- Immutable input; no I/O.
Tests: boundaries, truncation, odd lengths, invalid UTF-16 (lone surrogates are replaced, not fatal; document), zero-length strings.

### 7.3 `core/records.py` — locating records
Responsibility: from the note bytes, produce a structured read of the note: title text, body text, list of placeholder offsets, list of object descriptors.
Components:
- **GUID marker finder**: yields marker offsets by validating length 36 and GUID shape (section 6.4).
- **Text record locator**: implements the region-bounded scan of 6.10; returns title and body text with their start offsets (empty text when a region has no candidate).
- **Placeholder scanner**: returns the offsets of U+FFFC in the body text.
- **Object region splitter**: from the end of the body text to the body record end, splits regions at GUID markers located after the body text.
- **Object classifier**: per region, detect image signature (6.6) and read the index; detect attached-audio signature, read index, title, duration, and tail text offset; otherwise mark unsupported.
Outputs (internal immutable values): title, body text, placeholder offsets, ordered object descriptors (kind: image, audio, unsupported; media index when known; optional offset).
Edge cases: no objects; objects without placeholders; placeholders without objects; truncated regions; multiple signatures inside one region (treat as malformed); body length field exceeding the file (clip with a warning).
Tests: synthetic notes from the builder plus both real samples (expected: S1 two placeholders, objects image 0 and audio 1; S2 three placeholders, objects image 0, image 1, audio 2).

### 7.4 `core/media.py` — media catalog and naming
Responsibility: build the catalog from `SdocxArchive.media` and derive output names.
Algorithm:
1. For each entry, parse the leading decimal index before `@`; entries without the pattern are skipped with a warning.
2. Classify by extension; unclassifiable entries are skipped with a warning.
3. Derive the output name: strip the prefix, sanitize (naming policy) with the fallback `media-<index>.<ext>`.
4. Resolve duplicate output names in index order: the first keeps the name; later ones get `_<index>` inserted before the extension.
5. Result: mapping from index to a descriptor (entry name, output name, kind, bytes).
Tests: S1 and S2 names (`files_261028_230722_161.jpg`, `_261028_230754_224.m4a`, `6ae232fb_b55e6.m4a`), duplicates, illegal characters, missing index, unsupported extension, uppercase extension.

### 7.5 `core/text.py` — text normalization
Responsibility: convert raw body segments into clean plain text blocks.
Rules, applied to each text segment between placeholders:
1. Normalize `\r\n` and `\r` to `\n`.
2. Remove other control characters except `\n` and tab.
3. Strip trailing spaces and tabs on every line (prevents accidental Markdown hard breaks).
4. Collapse runs of three or more `\n` into exactly two.
5. Trim leading and trailing newlines of the segment.
6. Drop segments that are empty after trimming.
7. Replace unrecognised emojis or invalid/unpaired surrogate code units with the designated Unicode replacement character  (`U+FFFD`) per maintainer selection (O-02).
Single `\n` inside a paragraph is preserved (Obsidian shows it as a line break).
Tests: S1 and S2 body text segments, mixed newlines, only whitespace, very long runs, Unicode text.

### 7.6 `core/parser.py` — orchestration (implements INoteParser)
Algorithm:
1. Raise MalformedNoteError if the note bytes are empty or too short for the header.
2. Build the media catalog (7.4).
3. Read records (7.3): title, body, placeholder offsets, objects.
4. Pair placeholders and objects by order (D-03). Pair N placeholders with M objects up to min(N, M).
5. For each paired object that has a resolvable catalog entry of the matching kind, create a media slot; otherwise warn and drop the placeholder (D-06). Unsupported objects consume their slot and are dropped with a warning (D-07).
6. Cross-check audio offsets (6.7); mismatch adds a warning.
7. Split the body at placeholders; normalize text segments (7.5); interleave text blocks and media slots in original order.
8. Extra objects without placeholders: their media is appended after the final block with a warning (D-06).
9. Voice recordings: audio catalog entries not referenced by any object, ordered by media index, become media blocks placed before all other blocks (D-05). Unreferenced images produce a warning only (D-07).
10. Build the asset map for every media block; assemble the parsed note with title and warnings.
Edge cases: no body text and no media gives a note with zero blocks (renders as an empty Markdown file with a single newline); duplicate references to the same media index (second reference warns and is dropped).
Tests: acceptance-level scenarios from the builder; golden outputs for S1 and S2 (section 8.4); mismatch combinations; determinism.

### 7.7 `core/renderer.py` — implements IMarkdownRenderer
Algorithm: validate the asset folder name and each media filename contain no `\ / | # ^ [ ]` and no line breaks (else RenderError); render each text block as is and each media block as the embed `![[<assets_dir_name>/<filename>]]`; join blocks with one blank line; append one trailing newline; zero blocks gives a single newline. No path library use. Tests: AC-1 shape, forward slashes with collision-resolved folder names, adjacent media, zero blocks, invalid names.

### 7.8 `infrastructure/scanner.py` — implements ISourceScanner
Algorithm: verify the path exists and is a directory; list immediate children; keep regular files (not directories; symbolic links to regular files allowed) whose suffix lowercased equals `.sdocx`; sort by casefolded name then exact name; return paths. Hidden files starting with a dot are skipped. Errors map to SourceError with the OS reason. Tests: mixed extensions, uppercase extension, subfolders ignored, empty folder, missing folder, file instead of folder, permission denied where the platform allows.

### 7.9 `infrastructure/extractor.py` — implements IArchiveExtractor
Named limits (constants in the module, tunable):
| Limit | Value |
|---|---|
| Maximum entries inspected | 5,000 |
| Maximum uncompressed size of one kept entry | 512 MiB |
| Maximum total uncompressed size of kept entries | 1 GiB |
| Maximum compression ratio for entries over 1 MiB | 200 to 1 |
Algorithm:
1. Open the file read-only as a ZIP inside a context manager.
2. Check the entry count; for each entry validate the name: reject absolute paths, drive prefixes, backslashes, `..` segments, empty names, NUL characters; reject duplicate names; ignore directory entries.
3. Select entries: exactly `note.note` and those under `media/` except `media/mediaInfo.dat`.
4. For selected entries enforce size and ratio limits using the declared sizes, then read bytes (checking the actual length against the declaration).
5. Require `note.note`; its absence raises MissingEntryError.
6. Return the archive value with the source stem as source_name and media keys relative to `media/`.
Error mapping: bad ZIP, CRC failure, unsupported compression, truncated read, `zlib` errors map to CorruptArchiveError; OS errors map to CorruptArchiveError with the OS reason; limit and name violations map to UnsafeArchiveError. Source file is never written.
Tests: valid minimal archive, not a zip, empty file, truncated archive, missing note, unsafe names, duplicate names, oversize with patched limits, high ratio, extra entries ignored.

### 7.10 `infrastructure/storage.py` — implements IStorageRepository
**prepare**: create directory and parents; verify it is a directory and writable by creating and removing a hidden probe file; errors map to DestinationError.

**resolve_target_paths**: sanitize the note name with the naming policy (fallback `Untitled`); compute candidates from version 0 upward; a candidate is free when no directory entry equals `<stem>.md` or `<stem>_Assets` ignoring case; return the first free candidate. Creates nothing. Because processing is sequential, no reservation state is kept.

**persist** (atomic write protocol):
1. Create a hidden staging directory inside the destination with a recognizable prefix and unique suffix.
2. If assets are non-empty: create `assets` inside staging and write each file.
3. Write the Markdown file to staging as UTF-8 bytes with `\n` newlines.
4. Verify the final md path and asset folder are still free; otherwise raise PersistError.
5. Move the asset folder (if any) to its final path, then move the Markdown file to its final path. If the second move fails, remove the moved asset folder.
6. In all cases remove the staging directory.
7. Convert OS errors to PersistError with a clear message; never leave partial output.
Ordering guarantees: a visible Markdown file implies all its assets exist. Existing files are never overwritten. Tests: text-only produces no folder; with assets; collisions (none, 1, 1 and 2, folder only, case differences); concurrent appearance of the target; failure injected during asset write, during moves; staging removed always; long names; Windows reserved names.

### 7.11 `application/service.py` — ConversionService
Constructor receives: scanner, extractor, parser, renderer, storage, progress reporter (all protocol types).
Public operations:
- **convert_batch(source_dir, dest_dir) -> BatchResult**: calls scanner (SourceError propagates as fatal), calls storage prepare (DestinationError propagates as fatal), notifies reporter with the total, converts each source via convert_one in order, notifies the reporter after each, builds the batch result.
- **convert_one(source, dest_dir) -> ConversionOutcome**: runs the per-note flow of 3.3. Catches Sdocx2ObsidianError and produces a failed outcome with the exception's message; has one documented last-resort catch of Exception producing a failed outcome labeled "unexpected internal error" plus the exception type name. Success outcome carries warnings from the parsed note and the asset count.
Never raises for a per-file problem. Never touches the filesystem directly.
Tests with fakes: AC-4 batch (2 valid, 1 corrupt), call order (extract, parse, resolve, render, persist), the asset folder name passed to render equals the resolved one, failure at each stage, last-resort catch, reporter notifications, fatal errors propagate.

### 7.12 `cli.py` and `__main__.py`
Presentation and composition root. Only place using `typer` and `rich`.
Interface: one command with required `--source/-s` and `--dest/-d`, plus `--help` and `--version`. No other options (scope guard).
Behavior:
1. Validate arguments (existence and type checks produce friendly messages and exit code 2).
2. Build concrete scanner, extractor, parser, renderer, storage, a Rich-based reporter, and the service.
3. Run the batch. The reporter shows live progress and, as each file finishes, prints failures and warnings with the source file name.
4. After the batch print a summary: total processed, succeeded, failed (skipped files are counted as failed), followed by a list of failed files with reasons and a count of warnings.
5. Exit code: 0 when the batch completed (even with failed files); 2 for usage errors; 1 for fatal setup errors (SourceError, DestinationError) and unexpected crashes.
6. If no `.sdocx` files are found print a notice and exit 0.
Output text must be readable on narrow consoles and plain-text terminals; no color-only signals.
Tests: Typer test runner for argument errors, summary text, exit codes, AC-4 end to end with real implementations on `tmp_path`.

---

## 8. Output Specification

### 8.1 Markdown file
- Encoding UTF-8, `\n` newlines, exactly one trailing newline.
- Blocks separated by one blank line.
- Order: voice recordings (by media index), then the body in original order, then any appended media (D-06).
- Embed form: `![[<NoteStem>_Assets/<MediaFileName>]]` for images and audio, forward slashes only.
- No frontmatter, no headings added, no escaping of text (D-13).

### 8.2 Folder result
- `<NoteStem>.md` in the destination directory.
- `<NoteStem>_Assets/` beside it only when the note has at least one media file.
- On collisions both names receive the same ` (n)` suffix before `_Assets`: `Lecture (1).md` and `Lecture (1)_Assets/`.

### 8.3 Warnings (non-fatal), message templates
Each warning is one sentence identifying the item. Kinds: unsupported object skipped; placeholder without object dropped; object without placeholder appended; media without recognizable index or type skipped; unreferenced image not exported; audio offset mismatch; duplicate media reference; body length clipped.

### 8.4 Golden examples from the real samples
Note names below follow the file stems (D-09).

Sample S1 (`Hello_world_261028_230938`) expected Markdown:
```text
![[Hello_world_261028_230938_Assets/6ae232fb_b55e6.m4a]]

This would be normal text inthe notes with images between them

![[Hello_world_261028_230938_Assets/files_261028_230722_161.jpg]]

The above is a random image, and this is a test note

![[Hello_world_261028_230938_Assets/_261028_230754_224.m4a]]

This is a test audio file.

Hello
Hi Ola

This is sample text in a sample note

Hsiw hwid

Husis s
Ysudisv
Odyssey
Usidbsiiss
Sister
Isus9
Using
20th October 2026:
```
Sample S2 (`Yolo_261029_130712`) expected Markdown:
```text
Hdidjsbo
Isisbsuow

![[Yolo_261029_130712_Assets/files_261029_130656_907.jpg]]

![[Yolo_261029_130712_Assets/files_261029_130656_922.jpg]]

![[Yolo_261029_130712_Assets/_261029_130708_202.m4a]]
```
Both samples must reproduce these outputs byte for byte (assets copied unchanged).

---

## 9. Cross-Cutting Concerns

### 9.1 Error catalogue
| Condition | Exception | Message intent | Batch effect |
|---|---|---|---|
| Source folder missing or not a folder | SourceError | Say which path and why | Fatal, exit 1 |
| Destination cannot be created or written | DestinationError | Say which path and why | Fatal, exit 1 |
| Not a valid zip, truncated, CRC failure | CorruptArchiveError | File is corrupted or not a Samsung Notes file | File failed |
| Unsafe names, limits exceeded | UnsafeArchiveError | File rejected for safety, name the limit | File failed |
| `note.note` absent | MissingEntryError | Not a supported modern note | File failed |
| Text records not found, lengths inconsistent | MalformedNoteError | Note content could not be read | File failed |
| Link-breaking name reached the renderer | RenderError | Internal naming problem | File failed |
| Staging or commit failure | PersistError | Could not write output; nothing was left behind | File failed |
| Anything else | (unexpected) | Unexpected internal error plus type name | File failed |
Messages never include stack traces and always include the source file name when shown by the CLI.

### 9.2 Reporting
Lower layers return data. The service informs the reporter; the CLI formats. Warnings travel inside outcomes.

### 9.3 Security
Archive content is untrusted: entry names are validated even though entries are never extracted to disk; media output names are sanitized so no path separators exist; size and ratio limits bound memory; the staging area is hidden inside the destination so moves stay on one filesystem; nothing is executed from input.

### 9.4 Performance and memory
Files are processed one at a time; peak memory is roughly the note's media size plus one copy during staging writes. Typical notes with long audio are tens of MiB. Streaming of huge media is a documented future extension; the limits in 7.9 protect against abuse.

### 9.5 Cross-platform
Paths via `pathlib`; embeds from strings; case-insensitive collision checks; Windows reserved names and illegal characters sanitized; hidden staging directory prefix is a dot; console output avoids platform-specific control sequences beyond what Rich handles.

### 9.6 Determinism
Same input and destination state yield the same output: ordered scanning, ordered media handling, no timestamps, no randomness in output (staging names are random but never visible in results).

### 9.7 Encoding
Body text UTF-16 decoded with replacement character `\uFFFD` () for invalid sequences or unrecognized emojis, with a warning; Markdown written as UTF-8.

---

## 10. Test Plan

### 10.1 Pyramid
| Level | Scope | Tools |
|---|---|---|
| Unit | One module with fakes or in-memory data | pytest |
| Integration | Real implementations on `tmp_path`, synthetic archives | pytest |
| Real samples | S1 and S2 golden outputs; skipped when files are absent | pytest marker |
| Static | Types, lint, architecture, function length | mypy, ruff, `scripts/check.py` |

### 10.2 Synthetic archive builder (`tests/helpers/builder.py`)
Purpose: create `.sdocx` archives in memory that follow the verified layouts of section 6.
Capabilities (all configurable): note title; body text with placeholders; ordered list of objects (image with index, attached audio with index, title, duration, text offset); extra media entries with arbitrary names and bytes; voice recordings as media without objects; presence or absence of `mediaInfo.dat`; filler entries (`.page`, `pageIdInfo.dat`, `end_tag.bin`); corruption modes (truncated zip, wrong note bytes, missing `note.note`, unsafe entry names, duplicate names, oversize declarations).
The builder reproduces the framing observed in the samples: GUID markers, text records with length and count, the image signature, the audio signature with tail offset, and a body record length that spans the objects. Its output for S1-like and S2-like inputs must parse to the same structures as the real samples; this equivalence is itself a test.

### 10.3 Fakes (`tests/helpers/fakes.py`)
One recording fake per protocol with configurable failures per file name and a call log; the progress-reporter fake stores outcomes.

### 10.4 Scenario catalogue
| Id | Scenario | Expectation |
|---|---|---|
| T-01 | AC-1 text, image, text, audio | exact interleaving and files copied |
| T-02 | AC-2 text only | md created, no asset folder |
| T-03 | AC-3 collision | `(1)` for md and asset folder; embeds use `(1)` folder |
| T-04 | AC-4 two valid, one corrupt | two notes, one failed outcome, no leftovers, exit 0 |
| T-05 | Voice recording | block placed first |
| T-06 | Adjacent placeholders | consecutive embeds, one blank line apart |
| T-07 | More placeholders than objects | extras dropped with warning |
| T-08 | More objects than placeholders | extras appended with warning |
| T-09 | Unsupported object | dropped, slot consumed, warning |
| T-10 | Duplicate output names after prefix stripping | suffixed deterministically |
| T-11 | Illegal characters in names | sanitized, links valid |
| T-12 | Collision with folder only, and case-only difference | version suffix applied |
| T-13 | Failure mid-persist | destination unchanged, staging removed |
| T-14 | Windows-style paths in fakes | embeds still use `/` |
| T-15 | Empty body and no media | single-newline Markdown |
| T-16 | Zip-slip names, duplicates, oversize, high ratio | UnsafeArchiveError |
| T-17 | Read-only source | source bytes and timestamps unchanged after run |
| T-18 | Real samples S1, S2 | golden outputs of 8.4 |

### 10.5 Quality targets
Branch coverage of `core/` and `application/` above 95 percent; whole package above 90 percent. Every SRS acceptance criterion has a named test (`test_ac1_...` through `test_ac4_...`).

---

## 11. Tooling and Quality Gates

| Item | Definition |
|---|---|
| Package layout | `src` layout, built with hatchling, entry point `sdocx2obsidian` |
| Python | 3.11 or newer |
| Runtime dependencies | typer, rich |
| Dev dependencies | pytest, pytest-cov, mypy, ruff, pre-commit |
| Types | `mypy --strict` over `src` and `tests` |
| Lint | `ruff check` with the rule set in `pyproject.toml` |
| Architecture and function length | `python scripts/check.py` enforces layer imports, banned calls, frozen slots dataclasses in `domain/models.py`, and the 35-line limit |
| CI | **SKIPPED — not incorporated yet.** A GitHub Actions workflow (Linux + Windows jobs running ruff, mypy, the checker, and pytest) is planned but has been deliberately omitted from the codebase. It must only be created on explicit maintainer instruction. |
| Git remote policy | **Local commits only.** Never push to GitHub or any remote repository (`git push`). Remote pushes are strictly reserved for the maintainer or require explicit instruction. |
| Gate | All four commands pass before any milestone is considered done |
Note: the checker restricts `domain/` imports to `dataclasses, pathlib, typing, collections, enum, __future__`; the naming module must respect this.

---

## 12. Implementation Plan for the Agent

Each milestone is one agent session using the `module` workflow unless stated. The agent reads the cited DDS sections and writes tests first.

| # | Milestone | DDS sections | Done when |
|---|---|---|---|
| M0 | Tooling smoke test on the empty skeleton | 11 | All four gate commands pass |
| M1 | Approve this DDS; resolve open questions | 13 | Maintainer sign-off |
| M2 | Spike check: confirm section 6 against S1 and S2 using the `spike` workflow | 6 | `format.md` updated; locator rules (6.10) confirmed or amended |
| M3 | Domain: models, exceptions, protocols, naming | 4, 5 | Unit tests for naming pass; checker clean |
| M4 | Test helpers: builder and fakes | 10.2, 10.3 | Builder output equals real structures |
| M5 | Core reader and records | 7.2, 7.3, 6 | S1/S2 records decoded |
| M6 | Core media and text | 7.4, 7.5 | Name and text rules tested |
| M7 | Core parser and renderer | 7.6, 7.7, 8 | Golden outputs of 8.4 for S1 and S2 |
| M8 | Infrastructure scanner and extractor | 7.8, 7.9 | Safety scenarios pass |
| M9 | Infrastructure storage | 7.10 | T-02, T-03, T-12, T-13 pass |
| M10 | Application service | 7.11 | T-04 with fakes, call order verified |
| M11 | CLI and composition | 7.12 | Exit codes and summary tested |
| M12 | Acceptance and packaging (`accept` workflow) | 10 | AC-1 to AC-4 green locally (CI is out of scope until explicitly instructed) |

Detailed phase instructions, test tables, and gates are in `docs/plan.md` (phases P0 to P12 correspond to M0 to M12). Per-session instructions for the agent: implement only the phase; ask before deviating from the DDS; report gate output; list assumptions.

---

## 13. Risks, Assumptions, and Open Questions

### 13.1 Risks
| Id | Risk | Mitigation |
|---|---|---|
| R-01 | Text record locator relies on scanning because framing is only partly decoded | Validation rules (6.10), fail rather than guess, real-sample tests, more samples |
| R-02 | Object order may not equal position order in edited notes | Audio offset cross-check; reordered sample (O-01) |
| R-03 | Unknown object kinds (attachments, drawings, tables) | Dropped with warnings; slots preserved |
| R-04 | Format differences across Samsung Notes versions | Strict validation and clear errors; collect samples |
| R-05 | Large media in memory | Limits and documented streaming extension |
| R-06 | Plain text containing Markdown syntax changes appearance in Obsidian | Accepted per SRS; possible future option |
| R-07 | Stripped media names can collide | Deterministic suffix rule (D-04) |

### 13.2 Open questions for the maintainer (Resolved in P1)
| Id | Question | Maintainer Resolution |
|---|---|---|
| O-01 | Inline image/media ordering when items are inserted or reordered | **Resolved by maintainer:** Images must strictly follow the document visual sequence and relative position with respect to surrounding text in the note, anchored to the sequential order of U+FFFC placeholders in the body text (D-03). |
| O-02 | Edge cases: unrecognized emojis, unsupported objects, empty notes | **Resolved by maintainer:** Unrecognized emojis and invalid surrogate code units are replaced with the Unicode replacement character `\uFFFD` () (DDS 7.5, 9.7, 14.2). Unsupported non-media objects are dropped with a warning. Empty title/body yield empty text. |
| O-03 | Note naming: in-note title vs. exported stem | **Resolved:** Use source file stem verbatim per SRS FR-06 (D-09). |
| O-04 | Batch exit code on individual note failure | **Resolved:** Process exit code is 0 when batch completes per SRS AC-4 (D-11); non-zero only for fatal setup errors. |
| O-05 | Architecture additions: `domain/naming.py`, `infrastructure/scanner.py`, core helpers, `IProgressReporter` | **Resolved:** Approved as documented in DDS. |
| O-06 | Update SRS with amendments of 1.3 | **Resolved by maintainer:** All amendments incorporated directly into this DDS without modifying other documentation files. |

### 13.3 Future extensions (out of scope now)
Streaming of large media; reading `mediaInfo.dat` for integrity checks; recursive scanning; optional Markdown escaping; parallel processing (would require target reservation); YAML frontmatter and timestamps.

---

## 14. Appendices

### 14.1 Naming conventions
Modules lower_snake_case; classes PascalCase with protocols prefixed `I`; constants UPPER_SNAKE_CASE defined once per module; test files mirror module names.

### 14.2 Constants register
Asset folder suffix `_Assets`; Markdown extension `.md`; source extension `.sdocx`; staging directory prefix `.sdocx2obsidian-staging-`; maximum note stem 120; maximum media stem 100; placeholder character U+FFFC; unrecognized emoji / replacement character `\uFFFD` (); limits of 7.9.

### 14.3 Samples needed to harden the design
Reordered insertion; empty title; empty body; media-only note; emoji and non-Latin text; formatted text; checklist; table; file attachment; multi-page long note; note from an older app version.
