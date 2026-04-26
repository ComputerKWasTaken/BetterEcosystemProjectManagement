# 11 - Frontier Test Suites

This page tracks the current live AI Dungeon regression harness and the completed sign-off history.

## Current Status

Active live sign-off suite:

- None. Phase 10 is guide and docs rewrite work.

Current regression suite:

- [21 - Provider AI AI Dungeon Test Suite](./21-provider-ai-ai-dungeon-test-suite.md)

Use the Provider AI suite when changing Provider AI op behavior, OpenRouter request/response normalization, key/default-model settings, heartbeat advertisement, dispatcher unsafe replay behavior, or the Provider AI AI Dungeon harness itself.

## Completed Sign-offs

| Area | Date | Result |
|---|---:|---|
| Scripture | 2026-04-22 | Live AI Dungeon suite passed 10/10 |
| Full Frontier | 2026-04-22 | Live suite passed, including reload-mid-pending |
| WebFetch | 2026-04-23 | Live suite passed, including denied-origin consent |
| Clock | 2026-04-23 | Live suite passed with `clock-mobxzre5` |
| Weather | 2026-04-23 | Live suite passed |
| Network | 2026-04-24 | Live suite passed |
| System | 2026-04-24 | Live suite passed |
| Provider AI | 2026-04-26 | Live suite passed with `provider-ai-mof04zzu` |

## Cleanup Policy

- Keep only the current or strategically useful live suite in the main Frontier folder.
- Once a suite passes and its result is summarized here and in [Implementation Plan](./04-implementation-plan.md), remove old paste-ready scripts.
- Keep phase details in the canonical planning docs instead of one file per completed test run.
- Recreate older harnesses from version history only when a real regression investigation needs them.
