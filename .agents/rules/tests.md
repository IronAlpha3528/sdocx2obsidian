# Testing Rules (apply to tests/**)

- Tests mirror `src/`; acceptance tests live in `tests/integration/`. Follow the test plan in `docs/dds.md`.
- Test first or alongside; one behavior per test; names read `test_<unit>_<condition>_<expected>`.
- `core/` tests use in-memory data only. `application/` tests use hand-written fakes of the protocols, not mocks of whole protocols. `infrastructure/` tests use `tmp_path`.
- Use the synthetic archive builder in `tests/helpers/`; never commit private user notes.
- Each SRS acceptance criterion has a named end-to-end test.
- Cover failure paths and platform differences (links always use `/`).
- Tests are deterministic. Never delete, skip, or loosen a failing test to get green; fix the code or ask.
