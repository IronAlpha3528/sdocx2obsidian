---
name: testing
description: Use when writing or reviewing pytest tests, fakes, or the synthetic .sdocx builder used by tests.
---

# Testing

- Follow the test plan and fixture-builder specification in `docs/dds.md`.
- Fakes: implement each protocol with a small recording class; allow configuring per-file failures; assert call order for service tests.
- Synthetic archives: build them in memory with the builder helper, one option per scenario (text only, image, audio, voice, adjacent objects, corrupt, unsafe entry names).
- Parametrize collision and normalization cases; assert platform-independent output.
- A batch test must show that one failing file never stops the others.
- Real sample tests are optional and skipped when the private sample files are absent.
