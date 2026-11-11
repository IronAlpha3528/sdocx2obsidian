---
name: storage
description: Use when implementing or testing destination preparation, collision-safe target resolution, staged writes, or cleanup.
---

# Storage

- Follow the storage section of `docs/dds.md` for naming, collision resolution, and the staged-write protocol.
- Tests use `tmp_path`: text-only note creates no asset folder; every collision variant; failure mid-write leaves the destination unchanged; staging area always removed; existing items are never overwritten.
