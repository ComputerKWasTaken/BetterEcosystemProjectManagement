# 11 - Frontier Test Suites

This page tracks which live AI Dungeon suites are active, which are archived, and when each should be re-run.

## Current Status

There is no active live sign-off suite at the moment.

The most recent completed sign-off is:

- [16 - System AI Dungeon Test Suite](./16-system-ai-dungeon-test-suite.md)
- before that, [15 - Network AI Dungeon Test Suite](./15-network-ai-dungeon-test-suite.md)
- before that, [14 - Weather AI Dungeon Test Suite](./14-weather-ai-dungeon-test-suite.md)
- before that, [13 - Clock AI Dungeon Test Suite](./13-clock-ai-dungeon-test-suite.md)
- before that, [09 - WebFetch Test Suite Archive](./09-webfetch-ai-dungeon-test-suite.md)
- and [10 - WebFetch Phase 5 Validation](./10-webfetch-phase-5-validation.md)

Clock is complete. Geolocation has landed locally. Weather is complete. Network is complete. System is complete. Phase 8 is complete. The current work is Phase 9 Provider AI, which will need a new live AI Dungeon paste suite once the first OpenRouter-backed vertical slice is implemented.

## Most Recent Completed Suite

### Phase 6 - Clock

Latest completed suite:

- [13 - Clock AI Dungeon Test Suite](./13-clock-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-6-clock-test-suite/README.md)

Re-run this suite while changing Clock ops behavior, response shaping, heartbeat advertisement, or the Clock AI Dungeon harness itself.

### Weather

Latest completed suite:

- [14 - Weather AI Dungeon Test Suite](./14-weather-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-7-weather-test-suite/README.md)

Re-run this suite while changing Weather ops behavior, response shaping, upstream normalization, heartbeat advertisement, or the Weather AI Dungeon harness itself.

### Network

Latest completed suite:

- [15 - Network AI Dungeon Test Suite](./15-network-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-8-network-test-suite/README.md)

Re-run this suite while changing Network ops behavior, response shaping, heartbeat advertisement, or the Network AI Dungeon harness itself.

### System

Latest completed suite:

- [16 - System AI Dungeon Test Suite](./16-system-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-9-system-test-suite/README.md)

Re-run this suite while changing System ops behavior, response shaping, heartbeat advertisement, or the System AI Dungeon harness itself.

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

### Phase 6 - Clock

Archive:

- [13 - Clock AI Dungeon Test Suite](./13-clock-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-6-clock-test-suite/README.md)

Re-run when changing Clock ops behavior, response shaping, heartbeat advertisement, dispatcher integration, or the Clock AI Dungeon suite scripts.

### Weather

Archive:

- [14 - Weather AI Dungeon Test Suite](./14-weather-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-7-weather-test-suite/README.md)

Re-run when changing Weather ops behavior, response shaping, upstream normalization, dispatcher integration, or the Weather AI Dungeon suite scripts.

### Network

Archive:

- [15 - Network AI Dungeon Test Suite](./15-network-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-8-network-test-suite/README.md)

Re-run when changing Network ops behavior, response shaping, heartbeat advertisement, dispatcher integration, or the Network AI Dungeon suite scripts.

### System

Archive:

- [16 - System AI Dungeon Test Suite](./16-system-ai-dungeon-test-suite.md)
- [Archived files](./archive/phase-9-system-test-suite/README.md)

Re-run when changing System ops behavior, response shaping, heartbeat advertisement, dispatcher integration, or the System AI Dungeon suite scripts.

## Maintenance Rules

- Keep active suite scripts in `Project Management/frontier`.
- Move completed suite scripts into `Project Management/frontier/archive/<phase-name>`.
- Leave a small numbered summary doc in the main folder so older planning links keep working.
- Add every new live suite to this index and to the README read-order table.
- Prefer one active sign-off path per phase. Completed suites should be regression tools, not everyday setup steps.
