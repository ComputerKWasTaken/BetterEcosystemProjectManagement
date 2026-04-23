# 11 - Frontier Test Suites

This page tracks which live AI Dungeon suites are active, which are archived, and when each should be re-run.

## Current Status

There is no active live sign-off suite at the moment. Phase 5 is complete, and Phase 6 has not yet landed its own AI Dungeon harness.

The most recent completed sign-off is:

- [09 - WebFetch Test Suite Archive](./09-webfetch-ai-dungeon-test-suite.md)
- [10 - WebFetch Phase 5 Validation](./10-webfetch-phase-5-validation.md)

## Completed Archives

### Phase 3 - Scripture

Archive:

- [07 - Scripture Test Suite Archive](./07-scripture-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-3-scripture-test-suite/README.md)

Re-run only for Scripture rendering, validation, live-count history, state-card parsing, or module enable/disable regressions.

### Phase 4 - Full Frontier

Archive:

- [08 - Full Frontier Test Suite Archive](./08-full-frontier-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-4-full-frontier-test-suite/README.md)

Re-run only for envelope, dispatcher, heartbeat ops advertisement, ack/tombstone, duplicate request-id, or reload-mid-pending regressions.

### Phase 5 - WebFetch

Archive:

- [09 - WebFetch Test Suite Archive](./09-webfetch-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-5-webfetch-test-suite/README.md)
- [Final sign-off record](./10-webfetch-phase-5-validation.md)

Re-run when changing WebFetch request validation, consent flow, background fetch behavior, response shaping, dispatcher integration, or the WebFetch AI Dungeon suite scripts.

## Maintenance Rules

- Keep active suite scripts in `Project Management/frontier`.
- Move completed suite scripts into `Project Management/frontier/archive/<phase-name>`.
- Leave a small numbered summary doc in the main folder so older planning links keep working.
- Add every new live suite to this index and to the README read-order table.
- Prefer one active sign-off path per phase. Completed suites should be regression tools, not everyday setup steps.
