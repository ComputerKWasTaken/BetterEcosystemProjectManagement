# BetterDungeon Project Management

> Project tracking for the AI Dungeon browser extension.

## Current Focus

BetterDungeon V2 is in progress. Frontier — the largest V2 workstream — is feature-complete through Phase 9. All 8 first-party modules are implemented and live-tested.

Completed Frontier capability stack:

- Transport, write queue, adventure-boundary handling, and heartbeat.
- Full two-way request/response envelope over AI Dungeon Story Cards.
- First-party modules: Scripture, WebFetch, Clock, Geolocation, Weather, Network, System, and Provider AI.
- Popup integration with a dedicated Frontier tab and module settings.
- Story Card UI / GraphQL drift investigation.
- Heartbeat dedupe and safer unsafe-op replay behavior.

Current next step:

- Phase 10: Module polish and per-module regression test scripts.

## Roadmap

### Active

- **Phase 10 — Module Polish & Test Scripts.** Polish every module, create a per-module regression test script in `tests/aid-scripts/`, validate new behavior and catch regressions.
- **Phase 11 — Documentation Cleanup.** Refresh Frontier planning docs to reflect production status, remove stale planning language, update roadmap.

### Next

- **Phase 12 — Showcase Scripts.** One useful script per module demonstrating Frontier's power. Aura Cards (AI module), Chronos V2 (Clock + Weather + Scripture), plus new demos for remaining modules.
- **Phase 13 — Mobile Port.** Port Frontier to the Android WebView build. Multiplatform smoke testing across Chromium, Gecko, and Android WebView.

### Later

- **Phase 14 — BetterRepository Documentation.** Write proper developer documentation — core Frontier guide, per-module sub-guides, helper function reference, BetterScripts migration guide.
- Release prep: version bump, README/changelog polish, store-page updates.
- `bd.sdk` helper surface for exposing safe BetterDungeon capabilities.
- Third-party module registry and sandboxing.
- NPM/TypeScript/bundler migration as a separate epic.

## Bugs And Risks

- Release docs still need to catch up to the completed Frontier module set.
- Firefox and Android WebView parity need final V2 smoke testing.
- Provider AI depends on user-supplied OpenRouter configuration and should remain bounded, opt-in, and clearly documented.

## Canonical Docs

- [Frontier planning index](./frontier/README.md)
- [Implementation plan](./frontier/04-implementation-plan.md)
- [Scripture Interactive Widgets suite](./frontier/22-scripture-interactive-widgets-test-suite.md)
- [Provider AI live suite](./frontier/archive/21-provider-ai-ai-dungeon-test-suite.md)
