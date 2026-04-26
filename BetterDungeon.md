# BetterDungeon Project Management

> Project tracking for the AI Dungeon browser extension.

## Current Focus

BetterDungeon V2 is in progress. Frontier is the largest V2 workstream and is now through Phase 9.

Completed Frontier capability stack:

- Transport, write queue, adventure-boundary handling, and heartbeat.
- Full two-way request/response envelope over AI Dungeon Story Cards.
- First-party modules: Scripture, WebFetch, Clock, Geolocation, Weather, Network, System, and Provider AI.
- Popup integration with a dedicated Frontier tab and module settings.
- Story Card UI / GraphQL drift investigation.
- Heartbeat dedupe and safer unsafe-op replay behavior.

Current next step:

- Phase 10 guide and documentation rewrite in BetterRepository.

## Roadmap

### Active

- Write public Frontier documentation and module guides.
- Keep Provider AI as the current regression suite while docs are updated.
- Preserve LocalAI for the later Robyn design pass.

### Next

- Phase 11 release prep: version bump, README/changelog polish, store-page updates, Chromium/Firefox/Android WebView smoke testing.

### Later

- LocalAI module.
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
- [Provider AI live suite](./frontier/21-provider-ai-ai-dungeon-test-suite.md)
