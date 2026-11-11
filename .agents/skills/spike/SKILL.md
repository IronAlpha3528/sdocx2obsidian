---
name: spike
description: Use when you must investigate real .sdocx sample files, verify or extend knowledge of the binary format, or when parsing results disagree with docs/format.md.
---

# Format Spike

Goal: turn assumptions into verified facts, recorded in `docs/format.md`.

1. Ask the user for sample files if none are in the gitignored `samples/` folder. Never commit samples.
2. List archive entries first; do not bulk-extract.
3. Inspect small entries with a hex view; locate strings (UTF-16LE), length prefixes, and object markers described in the DDS format section.
4. For every claim, state the evidence (sample, offset) and mark it VERIFIED or UNVERIFIED in `docs/format.md`.
5. Compare findings with the DDS format section. If they differ, report the difference to the user; do not silently change the DDS or write parser code.
6. Prefer samples that differ in one aspect (order of objects, empty title, special characters) to isolate behavior.
