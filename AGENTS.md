# sdocx2obsidian — Agent Entry Point

Python 3.11+ CLI that batch-converts Samsung Notes `.sdocx` files into Obsidian Markdown.

Read in this order before any task:
1. `.agents/rules/` — always-on constraints.
2. `docs/srs.md` (what to build) and `docs/dds.md` (how it is structured; the authority for every module).
3. `docs/format.md` — evidence log for the `.sdocx` binary format. Never guess format facts.
4. `docs/plan.md` — phased implementation plan with tests; work one phase at a time and stop at each gate.
5. The matching skill in `.agents/skills/` and workflow in `.agents/workflows/`.

Verification gate (must pass before saying "done"):
`pytest`, `mypy --strict src tests`, `ruff check src tests`, `python scripts/check.py`.
