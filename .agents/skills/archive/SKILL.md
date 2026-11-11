---
name: archive
description: Use when implementing or testing the archive extractor, source scanner, or any code that opens a .sdocx (ZIP) file.
---

# Archive Handling

- Follow the extractor and scanner sections of `docs/dds.md`, including the named limits and error mapping.
- Read entries by name only; never bulk-extract; validate names and sizes before reading.
- Wrap every low-level failure in the matching domain exception, chained from the cause.
- Test: corrupt bytes, empty file, unsafe entry names, oversized entries (with patched small limits), duplicate entries, permission errors.
