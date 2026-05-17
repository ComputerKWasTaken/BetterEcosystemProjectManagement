# BetterDungeon Project Management

> Project tracking for the AI Dungeon browser extension.

## Current Focus

BetterDungeon V2 is in progress. Frontier — the largest V2 workstream — is feature-complete through Phase 10. All 9 first-party modules are implemented, live-tested, and have dedicated regression test suites.

Completed Frontier capability stack:

- Transport, write queue, adventure-boundary handling, and heartbeat.
- Full two-way request/response envelope over AI Dungeon Story Cards.
- First-party modules: Scripture, WebFetch, Clock, SDK, Geolocation, Weather, Network, System, and Provider AI.
- Popup integration with a dedicated Frontier tab and module settings.
- Story Card UI / GraphQL drift investigation.
- Heartbeat dedupe and safer unsafe-op replay behavior.
- BetterDungeon SDK module with `version` and `config` ops.
- Per-module regression test suites for all 9 modules in `tests/aid-scripts/`.
- Consistent `Frontier` story card type across all production code.

Current next step:

- Phase 11: Documentation cleanup across internal Frontier planning docs.

## Roadmap

### Completed

- **Phase 10 — Module Polish & Test Scripts.** All modules polished, per-module regression test scripts created in `tests/aid-scripts/`, story card types normalized.

### Active

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
- [Implementation status](./frontier/03-implementation-status.md)
- [Test suites](./frontier/04-test-suites.md)
- [Provider AI live suite](./frontier/archive/21-provider-ai-ai-dungeon-test-suite.md)
