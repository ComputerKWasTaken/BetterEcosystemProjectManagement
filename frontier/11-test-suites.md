# 11 - Frontier Test Suites

This page tracks the current live AI Dungeon regression harness, planned test infrastructure, and the completed sign-off history.

## Current Status

Active regression suites:

- [22 - Scripture Interactive Widgets AI Dungeon Test Suite](./22-scripture-interactive-widgets-test-suite.md)
- [21 - Provider AI AI Dungeon Test Suite](./archive/21-provider-ai-ai-dungeon-test-suite.md) (archived; still valid for regression checks)

Use the Scripture Interactive Widgets suite when changing Scripture widget validation/rendering, custom widget behavior, the `frontier:in:scripture.widgetEvents` queue, optimistic UI behavior, event coalescing, or interaction acknowledgements.

Use the Provider AI suite when changing Provider AI op behavior, provider request/response normalization, key/default-model settings, heartbeat advertisement, dispatcher unsafe replay behavior, or the Provider AI AI Dungeon harness itself.

## Planned — Per-Module Test Scripts

The next testing milestone is creating a regression test script for **every** module. Each will live in `tests/aid-scripts/<module>/` and follow the pattern established by the AI module test suite:

| Module | Directory | Status |
|--------|-----------|--------|
| Scripture | `tests/aid-scripts/scripture-module/` | Exists (interactive widgets suite) |
| Provider AI | `tests/aid-scripts/ai-module/` | Exists |
| WebFetch | `tests/aid-scripts/webfetch-module/` | Planned |
| Clock | `tests/aid-scripts/clock-module/` | Planned |
| Geolocation | `tests/aid-scripts/geolocation-module/` | Planned |
| Weather | `tests/aid-scripts/weather-module/` | Planned |
| Network | `tests/aid-scripts/network-module/` | Planned |
| System | `tests/aid-scripts/system-module/` | Planned |

Each test script should exercise the module's ops (or state publishing for Scripture), validate error paths, and confirm regression-free behavior after changes.

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

- Keep only the current or strategically useful live suite in the main Frontier folder. Completed artifacts move to `archive/`.
- Once a suite passes and its result is summarized here and in [Implementation Plan](./04-implementation-plan.md), archive old paste-ready scripts.
- Keep phase details in the canonical planning docs instead of one file per completed test run.
- Recreate older harnesses from version history only when a real regression investigation needs them.
