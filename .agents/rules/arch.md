# Architecture Rules (always on)

Dependencies point inward only: `cli → application → domain ← core / infrastructure`. Module list and responsibilities are in `docs/dds.md`.

1. `domain/` — stdlib only (`dataclasses`, `pathlib`, `typing`, `collections.abc`, `enum`). All dataclasses use `frozen=True, slots=True`. No imports from other layers.
2. `core/` — pure logic. Imports only `domain` and stdlib parsing helpers (`struct`, `re`, `typing`). FORBIDDEN: `open()`, `Path` I/O methods, `zipfile`, `os`, `sys`, `print`, `logging`, `typer`, `rich`.
3. `infrastructure/` — implements `domain.protocols`; owns all disk and zip I/O. Wraps low-level errors (`OSError`, `zipfile.BadZipFile`, `zlib.error`, …) in domain exceptions with `raise X(...) from exc`. No `typer`, `rich`, `print`, or imports of `core`/`application`.
4. `application/` — orchestration only. Depends solely on `domain`. NEVER imports concrete classes from `core` or `infrastructure`; receives all collaborators via `__init__`.
5. `cli.py` — the only file allowed to import `typer` and `rich`, and the only place concrete classes are wired together.

## Cross-cutting
- Collision-safe link integrity: resolve target paths BEFORE rendering, so links use the final asset folder name.
- No empty asset folders: when a note has zero media, no `_Assets/` folder is created.
- Fault-tolerant batching: a failure on one file yields a failed outcome and never aborts the batch.
- Reporting flows outward through returned outcomes and the progress-reporter protocol; lower layers never print or log.
- Sources are read-only.
