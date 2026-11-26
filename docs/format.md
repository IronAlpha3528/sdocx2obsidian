# .sdocx Format Evidence Log

The normative format description used by the code is in `docs/dds.md` (format section). This file records empirical evidence and open questions from sample investigations. Update it only through the `spike` workflow.

## 1. Samples Analyzed

| ID | File Name | Size (bytes) | Content Summary | Spike Result |
|---|---|---|---|---|
| **S1** | `Hello world_261028_230938.sdocx` | 20,878,734 | Title ("Hello world"), typed body text (293 chars), 1 image, 1 attached audio ("Over_the_Horizon"), 1 voice recording ("Voice 001", index 2) | All structures decoded; 100% match with DDS §6 & §8.4 golden output |
| **S2** | `Yolo_261029_130712.sdocx` | 20,017,829 | Title ("Yolo"), typed body text (31 chars), 2 images, 1 attached audio ("Over_the_Horizon") | All structures decoded; 100% match with DDS §6 & §8.4 golden output |
| **S3** | `Empty note with title_261111_155038.sdocx` | 2,047 | Title ("Empty note with title"), empty body (0 chars), 0 media files | Title extracted; empty body yields 0 blocks; empty Markdown with trailing newline |
| **S4** | `Note with emoji between texts_261111_155027.sdocx` | 2,311 | Title ("Note with emoji between texts"), body with multiple emojis and ZWJ sequence (`🙇‍♂️`, `🎉`, `🎂`, `🔥`, `🐒`), 0 media files | Title and emojis decoded and normalized without data loss; multiple newlines collapsed |
| **S5** | `Test Note_261111_203958.sdocx` | 13,807,372 | Title ("Test Note"), body with 5 placeholders across two dates, 4 voice/audio recordings (`.mp3`/`.m4a`), 1 image (`.jpg`), 1 unreferenced `.spi` graphic | Revealed new audio object signature `17 00` for recorded voice memos; `.spi` identified as unreferenced S-Pen drawing/page graphic |

---

## 2. Detailed Empirical Evidence per Sample

### 2.1 Sample S1 (`Hello world_261028_230938.sdocx`)

* **Container:** ZIP archive, 11 entries:
  * `note.note` (3,004 bytes uncompressed)
  * `media/mediaInfo.dat` (411 bytes uncompressed)
  * `media/0@files_261028_230722_161.jpg` (818,064 bytes uncompressed)
  * `media/1@_261028_230754_224.m4a` (19,936,108 bytes uncompressed)
  * `media/2@6ae232fb_b55e6.m4a` (120,033 bytes uncompressed)
  * Ignored entries: `pageIdInfo.dat`, `end_tag.bin`, 4 `.page` files (`201d2ee6-...`, `201d4a8e-...`, `6c242272-...`, `7f20e838-...`)
* **GUID Markers (4 found):**
  * Marker 0 at offset 86 (`0x56`): `1ff508ee-d2f6-11f1-ac3e-33ee61339d1c` (introduces Title record)
  * Marker 1 at offset 425 (`0x1A9`): `1ff50f42-d2f6-11f1-a958-2feb13dd9b57` (introduces Body record)
  * Marker 2 at offset 2091 (`0x82B`): `3b7df198-d2f6-11f1-b0df-d76dccb1ee55` (Object 0)
  * Marker 3 at offset 2590 (`0xA1E`): `4e680dd4-d2f6-11f1-be96-5fdb9081d37c` (Object 1)
* **Text Records (Region-Bounded Scan §6.10):**
  * Title Region (`0x7C`..`0x1A9`): Candidate found at offset 297 (`0x129`), declared length = 83, char count = 11: `"Hello world"`
  * Body Region (`0x1CF`..`0x82B`): Candidate found at offset 636 (`0x27C`), declared length = 2,186, char count = 293
  * U+FFFC Placeholders: Exactly 2 placeholders in body text at character indices 64 and 119.
* **Inline Object Records:**
  * Object 0 (Marker 2 at `0x82B`, preceding u32 header = 4000):
    * Image signature `06 00 3E 00 00 00 02 00` matched at `+0x16F`
    * Media index = 0 (`files_261028_230722_161.jpg`)
    * Aligns with 1st placeholder (char index 64).
  * Object 1 (Marker 3 at `0xA1E`, preceding u32 header = 5400):
    * Audio signature `1F 03` matched
    * Media index = 1 (`_261028_230754_224.m4a`), title = `"Over_the_Horizon"`, duration = `"00:03:18"`
    * Tail offset = 29 (points to placeholder position)
    * Aligns with 2nd placeholder (char index 119).
* **Voice Recording Detection (D-05):**
  * `media/2@6ae232fb_b55e6.m4a` is present in media catalog but not referenced by any inline object record.
  * Correctly categorized as voice recording, placed at the top of the generated Markdown note.

---

### 2.2 Sample S2 (`Yolo_261029_130712.sdocx`)

* **Container:** ZIP archive, 10 entries:
  * `note.note` (2,489 bytes uncompressed)
  * `media/mediaInfo.dat` (429 bytes uncompressed)
  * `media/0@files_261029_130656_907.jpg` (36,888 bytes uncompressed)
  * `media/1@files_261029_130656_922.jpg` (41,070 bytes uncompressed)
  * `media/2@_261029_130708_202.m4a` (19,936,108 bytes uncompressed)
  * Ignored entries: `pageIdInfo.dat`, `end_tag.bin`, 3 `.page` files (`4f8c3684-...`, `4f8c5754-...`, `8504ba48-...`)
* **GUID Markers (5 found):**
  * Marker 0 at offset 86 (`0x56`): `4f4bb258-d36b-11f1-9691-dbb4989bb93a` (introduces Title record)
  * Marker 1 at offset 411 (`0x19B`): `4f4bbcf8-d36b-11f1-9044-f749078f5387` (introduces Body record)
  * Marker 2 at offset 1171 (`0x493`): `84fcfb1e-d36b-11f1-aca9-0be996f66ab5` (Object 0)
  * Marker 3 at offset 1670 (`0x686`): `8503b4e0-d36b-11f1-b86b-cb809cf37f0a` (Object 1)
  * Marker 4 at offset 2169 (`0x879`): `8bba091a-d36b-11f1-8815-9ffc5245ac9a` (Object 2)
* **Text Records (Region-Bounded Scan §6.10):**
  * Title Region (`0x7C`..`0x19B`): Candidate found at offset 297 (`0x129`), declared length = 69, char count = 4: `"Yolo"`
  * Body Region (`0x1C1`..`0x493`): Candidate found at offset 622 (`0x26E`), declared length = 1,779, char count = 31
  * U+FFFC Placeholders: Exactly 3 adjacent placeholders in body text at character indices 19, 20, 21.
* **Inline Object Records:**
  * Object 0 (Marker 2 at `0x493`, preceding u32 header = 4000):
    * Image signature `06 00 3E 00 00 00 02 00` matched at `+0x16F`
    * Media index = 0 (`files_261029_130656_907.jpg`)
    * Aligns with 1st placeholder (char index 19).
  * Object 1 (Marker 3 at `0x686`, preceding u32 header = 4000):
    * Image signature `06 00 3E 00 00 00 02 00` matched at `+0x16F`
    * Media index = 1 (`files_261029_130656_922.jpg`)
    * Aligns with 2nd placeholder (char index 20).
  * Object 2 (Marker 4 at `0x879`, preceding u32 header = 5400):
    * Audio signature `1F 03` matched
    * Media index = 2 (`_261029_130708_202.m4a`), title = `"Over_the_Horizon"`, duration = `"00:03:18"`
    * Tail offset = 29
    * Aligns with 3rd placeholder (char index 21).
* **Voice Recording Detection (D-05):**
  * All audio media are referenced by inline objects. None unreferenced.

---

### 2.3 Sample S3 (`Empty note with title_261111_155038.sdocx`)

* **Container:** ZIP archive, 6 entries:
  * `note.note` (873 bytes uncompressed)
  * `media/mediaInfo.dat` (10 bytes: 0 media records, `EOFX`)
  * Ignored entries: `pageIdInfo.dat`, `end_tag.bin`, 2 `.page` files (`8552ae1c-...`, `8552cd02-...`)
* **GUID Markers (2 found):**
  * Marker 0 at offset 86 (`0x56`): `852c9e34-ddb9-11f1-9b2b-b75519e8df33` (introduces Title record)
  * Marker 1 at offset 445 (`0x1BD`): `852ca0a0-ddb9-11f1-8d4e-cfa74669be02` (introduces Body record)
* **Text Records (Region-Bounded Scan §6.10):**
  * Title Region (`0x7C`..`0x1BD`): Candidate found at offset 297 (`0x129`), declared length = 89, char count = 21: `"Empty note with title"`
  * Body Region (`0x1E3`..EOF): No text record candidate found; empty body text `""` correctly inferred.
  * U+FFFC Placeholders: 0 placeholders.
* **Inline Object Records:** None (0 objects).
* **Rendered Markdown:** Exactly one trailing newline `"\n"`, 0 blocks, 0 assets. Clean vault rule strictly maintained (no empty asset folder created).

---

### 2.4 Sample S4 (`Note with emoji between texts_261111_155027.sdocx`)

* **Container:** ZIP archive, 6 entries:
  * `note.note` (1,569 bytes uncompressed)
  * `media/mediaInfo.dat` (10 bytes: 0 media records, `EOFX`)
  * Ignored entries: `pageIdInfo.dat`, `end_tag.bin`, 2 `.page` files (`628ed28e-...`, `628ef6ec-...`)
* **GUID Markers (2 found):**
  * Marker 0 at offset 86 (`0x56`): `61fb95a0-ddb9-11f1-9e25-db6060ae19ea` (introduces Title record)
  * Marker 1 at offset 461 (`0x1CD`): `61fbdc5e-ddb9-11f1-b819-ab9959785f6f` (introduces Body record)
* **Text Records (Region-Bounded Scan §6.10):**
  * Title Region (`0x7C`..`0x1CD`): Candidate found at offset 297 (`0x129`), declared length = 119, char count = 29: `"Note with emoji between texts"`
  * Body Region (`0x1F3`..EOF): Candidate found at offset 672 (`0x2A0`), declared length = 633, char count = 76.
  * Body text: `"Loreal ipsum\nYellow world\nIddbi\nToday is a birthday🎉🎉🎂🎂🔥🙇\u200d♂️🐒\n\n\n\n\n\n\n\n"`
  * Text validation rule: Unicode characters with `ord >= 32` (including emojis, Zero Width Joiner `\u200D`, and Variation Selector `\uFE0F`) are valid UTF-16 units. Only ASCII control characters (`< 32` and `127`) are rejected.
  * Normalization: Trailing multiple newlines collapsed and trimmed; output renders as `"Loreal ipsum\nYellow world\nIddbi\nToday is a birthday🎉🎉🎂🎂🔥🙇‍♂️🐒\n"`.

---

### 2.5 Sample S5 (`Test Note_261111_203958.sdocx`)

* **Container:** ZIP archive, 11 entries:
  * `note.note` (2,972 bytes uncompressed)
  * `media/mediaInfo.dat` (798 bytes uncompressed, 6 records)
  * `media/5@240610_200556_844.mp3` (685,761 bytes)
  * `media/6@240610_200606_825.mp3` (1,356,513 bytes)
  * `media/7@files240610_200620_779.jpg` (802,307 bytes)
  * `media/8@240610_200704_044.mp3` (2,234,625 bytes)
  * `media/9@page_0000011.spi` (2,796 bytes, unreferenced S-Pen drawing/page graphic)
  * `media/10@240626_132453_378.m4a` (8,721,662 bytes)
  * Ignored entries: `pageIdInfo.dat`, `end_tag.bin`, 1 `.page` file (`8013d50c-...`)
* **GUID Markers (7 found):**
  * Marker 0 at offset 86 (`0x56`): Title record
  * Marker 1 at offset 429 (`0x1AD`): Body record
  * Marker 2 at offset 1411 (`0x583`): Object 0
  * Marker 3 at offset 1624 (`0x658`): Object 1
  * Marker 4 at offset 1837 (`0x72D`): Object 2
  * Marker 5 at offset 2336 (`0x920`): Object 3
  * Marker 6 at offset 2541 (`0x9ED`): Object 4
* **Text Records:**
  * Title: `"Test Note"`
  * Body: `" 18th May 2024:\nLorem Ipsum something something test.Hello world\n\n\ufffc\n\ufffc\n\ufffc\n\n19th May 2024:\n\ufffc\n\ufffc"`
  * U+FFFC Placeholders: Exactly 5 placeholders at character offsets 66, 68, 70, 88, 90.
* **Inline Object Signatures & New Format Discovery:**
  * Object 0 (Marker 2): Audio signature `17 00` (`0x17, 0x00`), media index 5 (`240610_200556_844.mp3`), title `"180524 - 1"`, duration `"00:01:25"`, tail offset 0. Matches 1st placeholder.
  * Object 1 (Marker 3): Audio signature `17 00` (`0x17, 0x00`), media index 6 (`240610_200606_825.mp3`), title `"180524 - 2"`, duration `"00:02:49"`, tail offset 0. Matches 2nd placeholder.
  * Object 2 (Marker 4): Image signature `06 00 3E 00 00 00 02 00`, media index 7 (`files240610_200620_779.jpg`). Matches 3rd placeholder.
  * Object 3 (Marker 5): Audio signature `17 00` (`0x17, 0x00`), media index 8 (`240610_200704_044.mp3`), title `"190524"`, duration `"00:04:39"`, tail offset 0. Matches 4th placeholder.
  * Object 4 (Marker 6): Audio signature `17 00` (`0x17, 0x00`), media index 10 (`240626_132453_378.m4a`), title `"Voice 001"`, duration `"00:08:52"`, tail offset 0. Matches 5th placeholder.
* **Findings on `.spi`:**
  * `9@page_0000011.spi` is an unreferenced S-Pen drawing/page graphic generated by Samsung Notes.
  * It is not an audio file and is not referenced by any inline placeholder.
  * Correctly skipped per DDS D-07 with warning `"Media entry '9@page_0000011.spi' has unsupported extension '.spi'; skipped."`.

---

## 3. Format Fact Verification Matrix

| DDS § | Specification Item | S1/S2 Evidence | S3/S4 Evidence | Status |
|---|---|---|---|---|
| **6.1** | Container is a standard ZIP archive (Deflate) | S1 (11 entries), S2 (10 entries) | S3 (6 entries), S4 (6 entries) | **VERIFIED** |
| **6.2** | Media entries named `<index>@<original_name>` | S1/S2 indices 0, 1, 2 | S3/S4 have 0 media files | **VERIFIED** |
| **6.3** | `note.note` section ordering (Title → Body → Objects) | S1/S2 full layouts | S3/S4 Title and Body markers | **VERIFIED** |
| **6.4** | GUID marker: u16(36) + 36 ASCII characters | Markers verified at offsets 0x56, etc. | Markers verified at offsets 0x56, 0x1BD, 0x1CD | **VERIFIED** |
| **6.5** | Text record format: u32 length, u32 char count N, UTF-16LE | Title & Body text decoded | Title & Body text decoded with full emoji support | **VERIFIED** |
| **6.5** | Inline objects marked by U+FFFC in body text | Placeholders mapped | 0 placeholders when no media | **VERIFIED** |
| **6.6** | Media signatures (Image `06 00 3E 00 00 00 02 00`, Audio `1F 03` and `17 00`) | Matched in S1 and S2 | S5 confirmed `17 00` audio signature for recorded voice memos | **VERIFIED** |
| **6.8** | Voice recording has media file, no inline placeholder | S1 index 2 (`6ae232fb_b55e6.m4a`) | N/A | **VERIFIED** |
| **6.10**| Region-bounded text locator algorithm (§6.10) | Unambiguously extracts title and body | Verified on empty body (S3) and emojis (S4) | **VERIFIED** |
| **7.6** | Empty body note renders empty Markdown with single newline | Tested in builder fakes | Verified on real sample S3 | **VERIFIED** |
| **8.4** | Golden Markdown outputs match byte-for-byte | S1 & S2 match DDS 8.4 | S3 & S4 match expected outputs | **VERIFIED** |

---

## 4. Empirical Verification Status

* **Non-image / unsupported entries:** Unreferenced `.spi` and `.page` entries are verified present in real `.sdocx` archives and are safely skipped with non-fatal warnings (`D-07`). Formal product scope and future extensions are maintained in `docs/srs.md` (§1.3) and `docs/dds.md` (§1.2, §13.3).
* **Empty body notes:** **VERIFIED** with real sample S3 (`Empty note with title_261111_155038.sdocx`).
* **Emoji / special characters / ZWJ:** **VERIFIED** with real sample S4 (`Note with emoji between texts_261111_155027.sdocx`).
* **Object insertion out of chronological order:** Maintained by placeholder ordering rule (O-01).

---

## 5. DDS Impact Summary

* **Text Locator Rule Refinement:** In `_is_valid_utf16_record`, standard Unicode characters (`ord >= 32` including emojis, `\u200D` ZWJ, and `\uFE0F` variation selectors) are explicitly supported. Control codes (`< 32` except `\n`, `\r`, `\t`, and `127`) are rejected. All 4 real samples now decode cleanly with 100% precision.
* **Audio Object Signatures (DDS §6.6):** Audio object records use the 5-byte sequence `01 00 02 1F 03` for attached audio and `01 00 02 17 00` for recorded voice memos. Both share the identical payload structure (`u32 media_index`, `u16 title_len`, `UTF-16LE title`, `u16 duration_len`, `UTF-16LE duration`, `u32 tail offset`). The 5-byte signature prevents false-positive collisions with 16-bit integers (e.g. 23 or 799) in image metadata and stroke coordinates. Unpacking is strictly bounds-checked to isolate invalid records cleanly.
* **`.spi` Clarification:** `.spi` is Samsung's internal S-Pen drawing/page graphic format (not an audio format). When unreferenced by placeholders, it is skipped per D-07 with a warning. When referenced by inline audio objects, the audio files themselves are standard media (`.mp3` or `.m4a`).
