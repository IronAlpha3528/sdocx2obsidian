---
name: module
description: Use whenever asked to implement or modify a module under src/sdocx2obsidian. Defines the read, plan, test, implement, verify loop.
---

# Implement a Module

1. Read the module's section in `docs/dds.md`, the SRS items it traces to, and the rules.
2. Plan in at most 10 lines: files, contracts implemented, requirement ids covered, edge cases. Ask if anything is ambiguous.
3. Write failing tests first from the DDS test plan; confirm they fail for the right reason.
4. Implement the smallest code that satisfies the DDS contract; keep functions short.
5. Run the full verification gate; fix root causes, never suppress.
6. Report: files changed, requirement ids covered, command output, open questions. Touch nothing outside the requested module.

Stop and ask if the work needs a change to anything the DDS defines.
