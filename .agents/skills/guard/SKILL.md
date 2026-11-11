---
name: guard
description: Use when reviewing code, adding imports, wiring dependencies, or when scripts/check.py reports violations. Enforces layer boundaries.
---

# Architecture Guard

1. Run `python scripts/check.py` and fix every reported line.
2. For each violation, move the offending work to the layer that owns it: I/O to infrastructure, orchestration to application, presentation and wiring to the CLI, pure logic to core.
3. If a lower layer needs to report something, return data instead of printing or logging.
4. If a new abstraction seems necessary, stop and ask; protocols are defined in the DDS.
5. Check: wiring only in the CLI; exceptions chained; paths resolved before rendering; links use forward slashes; no empty asset folders; no partial output.
