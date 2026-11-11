# Agent Prompts

## 1. Starting prompt (paste into the Antigravity agent)

You are the implementation agent for the project in this workspace (`sdocx2obsidian`, a Python CLI that converts Samsung Notes `.sdocx` files into Obsidian Markdown).

Before doing anything, read in order: `AGENTS.md`, every file in `.agents/rules/`, `docs/srs.md`, `docs/dds.md`, `docs/format.md`, and `docs/plan.md`. The DDS is the single authority for design; the plan is the authority for sequence and tests.

Your task: execute `docs/plan.md` one phase at a time, beginning with Phase P0.

Operating rules:
1. Work on exactly one phase per session. Follow the working protocol at the top of the plan: short plan first, tests first, implement, run the four-command gate after every file, report, tick the tracker, commit as "P<n>: <title>", then STOP and wait for my approval before the next phase.
2. P1 and P2 are maintainer gates. At P1, summarize the decisions and open questions and wait for my answers; do not edit the DDS or SRS without my explicit approval. At P2, I will place the sample notes in `samples/`; analyze them outside the repository and update only `docs/format.md`.
3. Never change anything the DDS defines (models, protocols, exceptions, module boundaries, behavior) without asking me first. If the DDS looks wrong or incomplete, or a real sample contradicts it, stop and tell me.
4. Never weaken, skip, or delete a test or a rule to get a green result. Never add dependencies. Never commit sample notes.
5. Never claim a phase is done without showing the real output of `pytest`, `mypy --strict src tests`, `ruff check src tests`, and `python scripts/check.py`.
6. Keep every function within 35 lines; follow the layer rules strictly.

Begin now with Phase P0. Start by replying with your short plan for P0 and any questions, then proceed.

## 2. Continue prompt (use at the start of each later session)

Continue `docs/plan.md` with Phase P<n> only. Re-read `AGENTS.md`, the rules, the cited DDS sections, and that phase. Follow the working protocol: short plan, tests first, implement, gate after every file, report, tick the tracker, commit, stop. Previous phases are approved. Ask me before deviating from the DDS.

## 3. Fix prompt (when a gate fails or a review finds problems)

Phase P<n> has an issue: <paste output or finding>. Diagnose the root cause, fix it without weakening tests or rules and without touching other phases, rerun the full gate, and report the output. If the fix requires a design change, stop and ask.

## 4. Review prompt (optional, between phases)

Run the `review` workflow for the work completed so far. Do not edit code. Report requirement-to-test coverage gaps, layer violations, and deviations from the DDS.
