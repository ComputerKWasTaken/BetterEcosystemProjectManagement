# BetterDungeon Project Management

> Project tracking for the AI Dungeon browser extension.

## Current Focus

BetterDungeon V2 is in progress. Ultrascripts, the largest V2 workstream, is
feature-complete through Phase 13. Ultrascripts is now multiplatform:
smoke-tested on Chromium, Gecko/Firefox, and Android WebView. All 9 first-party
modules are implemented, live-tested, have dedicated regression test suites, and
are documented in both the private planning docs and public BetterRepository
guides.

Completed Ultrascripts capability stack:

- Transport, write queue, adventure-boundary handling, and heartbeat.
- Full two-way request/response envelope over AI Dungeon Story Cards.
- First-party modules: Scripture, WebFetch, Clock, SDK, Geolocation, Weather,
  Network, System, and AI.
- Popup integration with a dedicated Ultrascripts tab and module settings.
- Story Card UI / GraphQL drift investigation.
- Heartbeat dedupe and safer unsafe-op replay behavior.
- BetterDungeon SDK module with `version` and `config` ops.
- Per-module regression test suites for all 9 modules in `tests/aid-scripts/`.
- Consistent `Ultrascripts` story card type across all production code.
- Internal documentation cleaned of speculative framing, with a production SDK
  specification locked in.
- Public BetterRepository docs for the Ultrascripts platform and every shipped
  module.

Current next step:

- Review each shipped module one at a time for conceptual improvements before
  creating complete scripts.
- Keep the standardized SDK-based Enhanced and Required Ultrascripts templates
  aligned with BetterRepository while module reviews are underway.

## Roadmap

### Completed

- **Phase 10 - Module Polish & Test Scripts.** All modules polished, per-module
  regression test scripts created in `tests/aid-scripts/`, story card types
  normalized.
- **Phase 11 - Documentation Cleanup.** Refreshed Ultrascripts technical docs to
  match production code, removed speculative planning language, and locked in the
  BetterDungeon SDK spec.
- **Phase 12 - Mobile Port.** Ultrascripts ported to the Android WebView build
  of BetterDungeon. Multiplatform smoke testing passed on Chromium,
  Gecko/Firefox, and Android WebView.
- **Phase 13 - BetterRepository Documentation.** Public Ultrascripts docs are
  complete: overview, Quick Start, Cookbook, Architecture, Building Modules, and
  all shipped module guides.

### Active

- **Phase 14 - Example Cleanup / Template Foundation / Complete Scripts.**
  Transitional examples have been removed and replaced by public `bd.us`
  helper templates for Enhanced and Required scripts. Next: review modules
  conceptually, then produce proper complete scripts.

### Later

- Release prep: version bump, README/changelog polish, store-page updates.
- Third-party module registry and sandboxing.
- NPM/TypeScript/bundler migration as a separate epic.

## Bugs And Risks

- Future complete scripts should not fork the template contract without also
  updating BetterRepository and the popup tutorial copy.
- The AI module depends on user-supplied OpenRouter configuration and should
  remain bounded, opt-in, and clearly documented.

## Canonical Docs

- [Ultrascripts planning index](./ultrascripts/README.md)
- [Implementation status](./ultrascripts/03-implementation-status.md)
- [Test suites](./ultrascripts/04-test-suites.md)
- [BetterDungeon SDK Spec](./ultrascripts/05-betterdungeon-sdk-spec.md)
- [Example contract reference](./ultrascripts/07-example-contract-reference.md)
