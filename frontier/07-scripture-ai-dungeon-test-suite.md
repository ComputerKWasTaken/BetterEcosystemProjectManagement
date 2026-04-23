# 07 - Scripture Test Suite Archive

The Phase 3 Scripture live suite is complete and archived. Keep this page as the stable pointer from older docs.

## Status

Passed in AI Dungeon on 2026-04-22.

Validated:

- Initial Scripture render.
- Continue / forward turns.
- Undo.
- Retry.
- Edit.
- Refresh rehydrate.
- Manifest reset / sticky DOM regression.
- Sanitizer behavior.
- Malformed state recovery.
- Module disable / re-enable.

## Archived Files

- [Archived suite guide](./archive/phase-3-scripture-test-suite/README.md)
- [Library script](./archive/phase-3-scripture-test-suite/scripture-test-suite.library.js)
- [Output Modifier script](./archive/phase-3-scripture-test-suite/scripture-test-suite.output-modifier.js)

## When To Re-run

Re-run this suite only when changing Scripture rendering, Scripture validation, live-count history handling, module enable/disable behavior, or reserved Frontier state-card handling.

Current active validation lives in:

- [09 - WebFetch AI Dungeon Test Suite](./09-webfetch-ai-dungeon-test-suite.md)
- [10 - WebFetch Phase 5 Validation](./10-webfetch-phase-5-validation.md)
