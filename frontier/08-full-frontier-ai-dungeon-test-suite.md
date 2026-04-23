# 08 - Full Frontier Test Suite Archive

The Phase 4 Full Frontier live suite is complete and archived. Keep this page as the stable pointer from older docs.

## Status

Passed in AI Dungeon on 2026-04-22.

Latest recorded run:

- `full-mo9ejlzk` reached `checksPass: true`.
- The separate `ff delay` reload-mid-pending check passed.

Validated:

- Full-profile heartbeat.
- `test.echo` op advertisement.
- `test.echo` ok responses.
- Ack tombstones for terminal responses.
- `unknown_op` structured errors.
- `unknown_module` structured errors.
- Duplicate request-id handling.
- Reload-mid-pending recovery.

## Archived Files

- [Archived suite guide](./archive/phase-4-full-frontier-test-suite/README.md)
- [Library script](./archive/phase-4-full-frontier-test-suite/full-frontier-test-suite.library.js)
- [Output Modifier script](./archive/phase-4-full-frontier-test-suite/full-frontier-test-suite.output-modifier.js)

## When To Re-run

Re-run this suite only when changing the envelope schema, ops dispatcher, ack/tombstone behavior, duplicate request handling, reload recovery, or heartbeat ops advertisement.

Current active validation lives in:

- [09 - WebFetch AI Dungeon Test Suite](./09-webfetch-ai-dungeon-test-suite.md)
- [10 - WebFetch Phase 5 Validation](./10-webfetch-phase-5-validation.md)
