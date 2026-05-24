# BetterDungeon Project Management

> Project tracking for the AI Dungeon browser extension.

## Current Focus

BetterDungeon V2 is in progress. Ultrascripts — the largest V2 workstream — is feature-complete through Phase 11. All 9 first-party modules are implemented, live-tested, have dedicated regression test suites, and internal technical documentation is fully updated.

Completed Ultrascripts capability stack:

- Transport, write queue, adventure-boundary handling, and heartbeat.
- Full two-way request/response envelope over AI Dungeon Story Cards.
- First-party modules: Scripture, WebFetch, Clock, SDK, Geolocation, Weather, Network, System, and Provider AI.
- Popup integration with a dedicated Ultrascripts tab and module settings.
- Story Card UI / GraphQL drift investigation.
- Heartbeat dedupe and safer unsafe-op replay behavior.
- BetterDungeon SDK module with `version` and `config` ops.
- Per-module regression test suites for all 9 modules in `tests/aid-scripts/`.
- Consistent `Ultrascripts` story card type across all production code.
- Internal documentation cleaned of all speculative framing, with a production SDK specification locked in.

Current next step:

- Phase 12: Port Ultrascripts to the Android WebView build of BetterDungeon, making it effectively multiplatform.

## Roadmap

### Completed

- **Phase 10 — Module Polish & Test Scripts.** All modules polished, per-module regression test scripts created in `tests/aid-scripts/`, story card types normalized.
- **Phase 11 — Documentation Cleanup.** Refreshed Ultrascripts technical docs to perfectly match production codebase, removed speculative planning language, and locked in the BetterDungeon SDK spec.

### Active

- **Phase 12 — Mobile Port.** Port Ultrascripts to the Android WebView build of BetterDungeon, making it effectively multiplatform. Multiplatform smoke testing across Chromium, Gecko, and Android WebView.

### Next

- **Phase 13 — BetterRepository Documentation.** Write proper developer documentation — core Ultrascripts guide, per-module sub-guides, helper function reference, BetterScripts migration guide.

### Later

- **Phase 14 — Showcase Scripts.** One useful script per module demonstrating Ultrascripts's power. Aura Cards (AI module) and Chronos V2 (Clock + Weather + Scripture) are already shipped; remaining module demos are deferred until after the mobile port and BetterRepository docs land.
- Release prep: version bump, README/changelog polish, store-page updates.
- `bd.sdk` helper surface for exposing safe BetterDungeon capabilities.
- Third-party module registry and sandboxing.
- NPM/TypeScript/bundler migration as a separate epic.

## Bugs And Risks

- Release docs still need to catch up to the completed Ultrascripts module set.
- Firefox and Android WebView parity need final V2 smoke testing.
- Provider AI depends on user-supplied OpenRouter configuration and should remain bounded, opt-in, and clearly documented.

## Canonical Docs

- [Ultrascripts planning index](./ultrascripts/README.md)
- [Implementation status](./ultrascripts/03-implementation-status.md)
- [Test suites](./ultrascripts/04-test-suites.md)
- [BetterDungeon SDK Spec](./ultrascripts/05-betterdungeon-sdk-spec.md)
- [Provider AI live suite](./ultrascripts/archive/21-provider-ai-ai-dungeon-test-suite.md)
