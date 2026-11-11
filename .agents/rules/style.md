# Python Style (apply to **/*.py)

- Python 3.11+ typing only (`list[str]`, `Mapping`, `str | None`); fully typed; `mypy --strict` clean. No `Any` without a justifying comment.
- No function longer than 35 lines (docstring excluded); keep complexity low; extract intention-revealing helpers.
- `from __future__ import annotations` in every module; one-line docstring on every public class and function.
- Use `pathlib.Path` for paths; never `os.path`. Markdown links are built from plain strings with forward slashes, never from `Path` objects.
- Prefer immutable data and pure functions; no module-level mutable state.
- No bare `except`; broad `except Exception` only at the single documented per-file boundary in the service. Always chain exceptions.
- `print` only in `cli.py`.
- Runtime dependencies are `typer` and `rich` only.
- Suppressions (`# type: ignore`, `# noqa`) need a justification comment and a mention in your report.
