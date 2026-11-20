# Pyodide Feasibility Spike Report — Phase P13

**Date:** November 20, 2026  
**Spike Target:** `sdocx2obsidian` in Pyodide WebAssembly under Node.js  
**Runtime Version:** Pyodide v0.26.4 (Python 3.12.1, Emscripten 3.1.58, Clang 19.0.0)  
**Host Environment:** Node.js v24.18.0 on Windows 10 Home (Build 10.0.26200, 64-bit, 8 cores)  
**Authority:** `docs/web-implementation-brief.md` Phase P13  

---

## 1. Executive Summary & Verdict

- **Verdict:** **PASS WITH CONDITIONS**.
- **Core Compatibility:** The entire conversion engine (`core/`, `domain/`, `infrastructure/`, `application/`) executed end-to-end in Pyodide with **zero code modifications**.
- **Output Fidelity:** Converted notes S1 through S5 matched golden outputs (DDS §8.4) and `format.md` evidence byte for byte.
- **Conversion Speed:** Fast execution in WebAssembly: a 20 MB note converts in **0.077 s – 0.107 s** (< 0.11 s).
- **Filesystem (MEMFS):** All storage operations (nested `mkdir`, writability probe, hidden staging `.sdocx2obsidian_staging/`, `shutil.move` atomic renames, and rollback) passed 100%.
- **Transfer Size:** The complete runtime (Pyodide core, WASM, Python standard library zip, and the package wheel) compresses to **4.66 MB** under Brotli (**5.65 MB** under Gzip).
- **Conditions Identified:**
  1. **Packaging Decoupling (MD-7):** The wheel must install without `micropip` fetching dependencies over the network. Direct wheel extraction or `sys.path` injection enables zero-network offline loading.
  2. **Memory Multiplier on 50 MB Notes (R-4):** Converting a 48 MB note pushed peak WASM heap to **342.31 MB** due to simultaneous buffer copies (input zip in MEMFS, extracted media dict, staged file, and destination file). Because Emscripten heaps never shrink, a 50 MB single-file limit risks tab memory eviction on low-end mobile browsers. A mobile-specific cap of **25 MB** (or 30 MB) is recommended.
  3. **Case Sensitivity in MEMFS:** MEMFS behaves like Linux (case-sensitive). Collision handling must use case-folded stem checks to remain safe when unzipped on Windows.

---

## 2. Empirical Benchmark Measurements

### 2.1 Real Samples Conversion (S1 – S5)
Each sample was converted using `ConversionService` with `StorageRepository` writing into Pyodide's virtual filesystem (`/spike_workspace/dest`):

| Sample | Input Size | Wall Time | WASM Heap Start | WASM Heap Peak | Multiplier (Peak / Size) | Output Markdown | Assets Created | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **S3** | 2.0 KB | 0.032 s | 20.00 MB | 20.00 MB | Base heap | `Empty note with title_261111_155038.md` | None (0) | **OK** |
| **S4** | 2.3 KB | 0.022 s | 20.00 MB | 20.00 MB | Base heap | `Note with emoji between texts_261111_155027.md` | None (0) | **OK** |
| **S5** | 13.168 MB | 0.078 s | 20.00 MB | 36.94 MB | 2.81x | `Test Note_261111_203958.md` | `Test Note_..._Assets/` | **OK** (1 warn) |
| **S2** | 19.090 MB | 0.107 s | 36.94 MB | 44.38 MB | 2.32x | `Yolo_261029_130712.md` | `Yolo_..._Assets/` | **OK** |
| **S1** | 19.912 MB | 0.077 s | 44.38 MB | 44.38 MB | 2.23x | `Hello world_261028_230938.md` | `Hello world_..._Assets/` | **OK** |

*Sequential Execution Note:* After converting S5, S2, and S1 sequentially (over 52 MB of combined archive data), the WASM heap stabilized at **44.38 MB**.

### 2.2 Hostile Inputs & 50 MB Synthetic Note

| Scenario | Input Magnitude | Wall Time in WASM | Peak WASM Heap | Result / Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Object Scaling** | 5,000 inline GUID objects | 1.686 s | 44.38 MB | Linear scaling; parsed cleanly into 1 block. |
| **Placeholder Scaling** | 100,000 placeholders (`\ufffc`) | 1.177 s | 44.38 MB | Linear scaling; stripped without backtracking. |
| **Synthetic 50 MB Note** | 48.01 MB archive (48 MB audio) | 0.258 s | 342.31 MB | Converted cleanly in 0.258s. Succeeded. |

---

## 3. Memory Multiplier & Per-Copy Breakdown (R-4)

When converting large media-heavy notes in the browser runtime, data exists in several distinct buffers:

1. **Browser ArrayBuffer (JS Heap):** The raw file buffer read from the file input (e.g. 48 MB).
2. **MEMFS Input Archive (WASM Heap):** Written into Pyodide's virtual filesystem (48 MB).
3. **In-Memory Extraction (`SdocxArchive`):** `ArchiveExtractor` reads entries into Python `dict[str, bytes]` (48 MB).
4. **Staging Directory File (MEMFS):** `StorageRepository` writes media to `.sdocx2obsidian_staging/` (48 MB).
5. **Destination File (MEMFS):** Atomic move renames file into `<Note>_Assets/` (metadata rename, zero copy in MEMFS).
6. **Output ZIP Packaging:** In-memory `zipfile` accumulates output archive for download (48 MB).

**Empirical WASM Heap Growth:**
- Base Pyodide Heap: **20.00 MB**
- Heap after 20 MB note (S1): **44.38 MB** ($\Delta \approx 24.38\text{ MB}$, multiplier $\sim 2.2\times$)
- Heap after 48 MB note: **342.31 MB** ($\Delta \approx 298\text{ MB}$, multiplier $\sim 6.2\times$ of active note size)

*Why 342 MB?* Emscripten's memory allocator grows WASM memory in geometric blocks ($2^n$). Simultaneous coexistence of the archive in MEMFS, the extracted media dictionary in Python memory, and the destination files in MEMFS causes the WASM page allocator to allocate 342 MB. Emscripten heap memory **never shrinks back to the OS** once allocated.

**Impact on Limits:**
- Desktop browsers have 2 GB – 4 GB per-tab allocations and easily handle 342 MB.
- Mobile browsers (especially iOS Safari) enforce stricter tab limits (~300 MB – 500 MB per tab).
- **Recommendation:** Keep **50 MB** for desktop browsers, but recommend a **25 MB** cap for mobile user agents.

---

## 4. Virtual Filesystem (MEMFS) Semantics Evaluation

The standard Emscripten MEMFS used by Pyodide was tested against every filesystem operation in `sdocx2obsidian`:

| Operation | Implementation in Code | MEMFS Behavior | Finding |
| :--- | :--- | :--- | :--- |
| **Nested Directory Creation** | `p.mkdir(parents=True, exist_ok=True)` | Succeeded | Fully POSIX compliant. |
| **Writability Probe** | `probe_file = dest / f".probe_{pid}_{uuid}"` | Succeeded; unlinked cleanly | Storage writability check passes. |
| **Hidden Staging Directory** | `.sdocx2obsidian_staging/` | Created and read without issue | Supported without restriction. |
| **Atomic Rename / Move** | `shutil.move(staging_path, final_path)` | Succeeded instantaneously | `os.rename` is an $O(1)$ pointer update in MEMFS. |
| **Rollback / Directory Cleanup** | `shutil.rmtree(staging_path)` | Cleanly deleted; free nodes released | Rollback works reliably. |
| **Case Sensitivity** | `Path('file.txt')` vs `Path('FILE.TXT')` | **Case-Sensitive (Linux-like)** | Native Windows is case-insensitive, while MEMFS is case-sensitive. Collision resolution logic must check lowercased stems to avoid collisions when unpacked on Windows. |

---

## 5. Forged-Header Reproduction (R-2)

The audit report claimed that a forged ZIP header declaring a small `file_size` (e.g. 100 bytes) while containing a large compressed payload could cause unbounded decompression during `zf.read(info)`.

### Empirical Test
A ZIP entry was generated containing 5 MB of deflated data, with the local header `file_size` forged to `100`:
- **Result in Python Standard Library (`zipfile`):**
  ```text
  zf.read() failed with: BadZipFile: Bad CRC-32 for file 'media/test.bin'
  ```
- **Finding:** Python's `zipfile` computes the CRC-32 checksum during decompression and compares it against the header. Forged headers fail with `BadZipFile` (which maps cleanly to `CorruptArchiveError`).
- **Decompression Behavior:** While `zipfile` does catch the CRC mismatch, Python's underlying `zlib.decompressobj` processes stream chunks up to EOF before validating the checksum.
- **Classification:** As noted in brief correction R-2, this is **defensive hardening** (preventing transient memory spikes on malformed inputs), **not an unhandled vulnerability**. The planned chunked streaming read in Phase P14 correctly caps maximum read bytes at the profile limit.

---

## 6. Runtime Asset Transfer Sizes & Static Hosting

All runtime assets in `pyodide@0.26.4` and the built package wheel were measured uncompressed, gzipped, and brotli-compressed:

| Asset Name | Raw Size | Gzip (Level 9) | Brotli (Max) | Compression Reduction |
| :--- | :--- | :--- | :--- | :--- |
| **`pyodide.js`** | 14.4 KB | 5.8 KB | 5.2 KB | 63.9% |
| **`pyodide.asm.js`** | 1,200.3 KB | 226.8 KB | 188.3 KB | 84.3% |
| **`pyodide.asm.wasm`** | 9,851.6 KB | 3,145.1 KB | 2,211.4 KB | 77.6% |
| **`python_stdlib.zip`** | 2,287.0 KB | 2,250.5 KB | 2,235.5 KB | 2.3% (already zipped) |
| **`sdocx2obsidian-0.1.0-py3-none-any.whl`** | 20.2 KB | 17.9 KB | 17.6 KB | 12.7% |
| **TOTAL INITIAL LOAD** | **13.37 MB** | **5.65 MB** | **4.66 MB** | **65.2% Overall Savings** |

### Static Hosting Observations
1. **Brotli Transfer:** Vercel automatically serves `.wasm` and `.js` files using Brotli compression when requested by modern browsers. Total bandwidth consumed on first visit is **4.66 MB**.
2. **Caching:** Because all Pyodide assets and package wheels are version-pinned and immutable, they can be served with `Cache-Control: public, max-age=31536000, immutable`. Subsequent visits require **0 KB** transfer.
3. **No Network Dependencies:** Pyodide can load the wheel directly from the origin without `micropip` or external CDN queries to jsdelivr or PyPI.

---

## 7. Packaging & Installation in Pyodide

### Testing Wheel Installation without CLI Dependencies
1. Building a wheel of `sdocx2obsidian` produces a pure-Python wheel (`sdocx2obsidian-0.1.0-py3-none-any.whl`, 20.2 KB).
2. When `typer` and `rich` are omitted, importing `sdocx2obsidian.core.*`, `sdocx2obsidian.domain.*`, `sdocx2obsidian.infrastructure.*`, and `sdocx2obsidian.application.*` succeeds with zero errors.
3. Calling `cli.py` raises `ModuleNotFoundError: No module named 'typer'` cleanly.
4. Moving `typer` and `rich` to `[project.optional-dependencies] cli = [...]` in Phase P14 will formally decouple the core package.

---

## 8. Spike Conclusions & Recommendations for Phase P14

1. **Proceed with Option B:** Option B is completely feasible, performant, and safe.
2. **Web Limits Profile Adjustment:**
   - Desktop Single-File Cap: **50 MB**
   - Mobile Single-File Cap: **25 MB** (due to 6.2x WASM heap expansion on large files)
   - Total Batch Cap: **100 MB** (Desktop), **50 MB** (Mobile)
   - Entry Count Cap: **500 entries**
   - Ratio Cap: **50:1** (over 1 MB)
   - Parser Objects Cap: **2,500 objects**
   - Parser Placeholders Cap: **20,000 placeholders**
3. **Zero-Network Wheel Loading:** In the web worker, load the wheel by writing bytes into Pyodide's virtual filesystem and adding to `sys.path` (or unpacking via Python's built-in `zipfile`), avoiding `micropip` network overhead entirely.

---
*End of Phase P13 Spike Report.*
