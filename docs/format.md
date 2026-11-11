# .sdocx Format Evidence Log

The normative format description used by the code is in `docs/dds.md` (format section). This file records empirical evidence and open questions from sample investigations. Update it only through the `spike` workflow.

## 1. Samples Analyzed

| ID | File Name | Size (bytes) | Content Summary | Spike Result |
|---|---|---|---|---|
| **S1** | `Hello world_261028_230938.sdocx` | 20,878,734 | Title ("Hello world"), typed body text (293 chars), 1 image, 1 attached audio ("Over_the_Horizon"), 1 voice recording ("Voice 001", index 2) | All structures decoded; 100% match with DDS §6 & §8.4 golden output |
| **S2** | `Yolo_261029_130712.sdocx` | 20,017,829 | Title ("Yolo"), typed body text (31 chars), 2 images, 1 attached audio ("Over_the_Horizon") | All structures decoded; 100% match with DDS §6 & §8.4 golden output |

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

## 3. Format Fact Verification Matrix

| DDS § | Specification Item | S1 Evidence | S2 Evidence | Status |
|---|---|---|---|---|
| **6.1** | Container is a standard ZIP archive (Deflate) | 11 entries, verified with `zipfile` | 10 entries, verified with `zipfile` | **VERIFIED** |
| **6.2** | Media entries named `<index>@<original_name>` | Indices 0, 1, 2 | Indices 0, 1, 2 | **VERIFIED** |
| **6.2** | `mediaInfo.dat` SHA-256 hashes match media bytes | Hashes verified | Hashes verified | **VERIFIED** |
| **6.3** | `note.note` section ordering (Title record → Body record → Object records) | Matches layout | Matches layout | **VERIFIED** |
| **6.4** | GUID marker: u16(36) + 36 ASCII characters | 4 markers at 0x56, 0x1A9, 0x82B, 0xA1E | 5 markers at 0x56, 0x19B, 0x493, 0x686, 0x879 | **VERIFIED** |
| **6.5** | Text record format: u32 length, u32 char count N, N UTF-16LE units | Title N=11 ("Hello world"), Body N=293 | Title N=4 ("Yolo"), Body N=31 | **VERIFIED** |
| **6.5** | Inline objects marked by U+FFFC in body text | 2 placeholders (64, 119) | 3 placeholders (19, 20, 21) | **VERIFIED** |
| **6.6** | Image object signature `06 00 3E 00 00 00 02 00` + u16 media index | Matched at +0x16F, index=0 | Matched at +0x16F, index=0, 1 | **VERIFIED** |
| **6.6** | Attached audio object signature `1F 03` + u32 index, u16 title len, u16 dur len | Matched, index=1, "Over_the_Horizon" | Matched, index=2, "Over_the_Horizon" | **VERIFIED** |
| **6.7** | Placeholder-to-object order (Nth placeholder = Nth object record) | 2 placeholders = 2 objects (image 0, audio 1) | 3 placeholders = 3 objects (image 0, image 1, audio 2) | **VERIFIED** |
| **6.8** | Voice recording has media file, no inline placeholder | Index 2 (`6ae232fb_b55e6.m4a`), 120,033 bytes | No unreferenced audio | **VERIFIED** |
| **6.10**| Region-bounded text locator algorithm (§6.10) | Unambiguously extracts title and body | Unambiguously extracts title and body | **VERIFIED** |
| **8.4** | Golden Markdown outputs match byte-for-byte | Matches DDS 8.4 golden text | Matches DDS 8.4 golden text | **VERIFIED** |

---

## 4. Unverified / Deferred Items

The following edge-case scenarios remain unverified due to lack of distinct sample files, but have approved fallback/safe policies in the DDS:
* **Object insertion out of chronological order:** Maintainer confirmed (O-01) that document sequence and relative text position are strictly governed by placeholder order.
* **Empty title or empty body notes:** DDS §7.6 treats empty regions as empty text (0 blocks for empty note).
* **Other object types (drawings, stickers, PDF attachments):** DDS §6.6 treats unrecognized signatures as unsupported objects; drops with warning (D-07).
* **Emoji / special characters:** Maintainer confirmed (O-02) replacing unrecognized emojis with `\uFFFD` ().
* **Multi-page long notes:** Observed notes contain 3–4 `.page` entries with pen metadata, which are safely ignored.

---

## 5. DDS Impact Summary

* **Proposed DDS Changes:** **None.** All findings on S1 and S2 match the DDS Section 6 specification 100%. The maintainer's decisions on open questions (O-01, O-02, O-06) were already integrated in Phase P1.
