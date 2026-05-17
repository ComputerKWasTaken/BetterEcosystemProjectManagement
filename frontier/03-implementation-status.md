# 03 - Implementation Status

> This document is the current implementation-status and roadmap summary for Frontier. It replaces the older phase-by-phase construction log. Frontier's core system is already built and working; this doc exists to show what is shipped, what remains, and what is intentionally out of scope for now.

## Current state

Frontier is no longer in the "plan the architecture" stage. The core runtime is implemented in BetterDungeon and already supports:

- live story-card observation
- mutation-template-based writeback
- per-card write queuing
- module registration and lifecycle
- heartbeat-based module discovery
- state-card dispatch
- request/response ops through `frontier:out` and `frontier:in:<module>`

Shipped first-party modules:

- `scripture`
- `webfetch`
- `clock`
- `sdk`
- `geolocation`
- `weather`
- `network`
- `system`
- `ai`

## What is shipped

These implementation areas are already real and should be treated as current production reality, not future planning:

### Transport

Shipped:

- `ws-interceptor.js`
- `ws-stream.js`
- mutation-template capture
- adventure-boundary handling
- live-count tracking
- tail tracking

Result:

- Frontier can observe AI Dungeon's story cards and actions reliably enough to drive the runtime.

### Write path

Shipped:

- mutation-template replay through `ai-dungeon-service.js`
- shared `write-queue.js`
- optimistic local updates
- retry/coalescing behavior

Result:

- BetterDungeon can write and update Frontier-owned cards without needing a separate GraphQL client implementation.

### Core runtime

Shipped:

- `core.js`
- `module-registry.js`
- `ops-dispatcher.js`
- `envelope.js`
- heartbeat writing in `core.js`

Result:

- modules can mount, receive state dispatch, expose ops, and advertise themselves through heartbeat

### Module system

Shipped:

- state-module pattern
- ops-module pattern
- per-module enable/disable persistence
- per-module storage via `ctx.storage`
- live-count-aware rerender behavior for state modules like Scripture

Result:

- Frontier's module surface is stable enough to document and extend

### BetterDungeon integration

Shipped:

- `features/frontier_feature.js`
- popup-side Frontier controls
- per-module toggles
- WebFetch consent management
- AI module settings and connection testing

Result:

- Frontier is integrated as a real BetterDungeon feature, not a side experiment

## What was especially important to resolve

These were the big implementation questions that once mattered and are now settled:

- live-count history won over action-id-keyed history
- full two-way Frontier shipped; there is no meaningful Lite profile
- mutation-template replay solved the write path
- heartbeat lives in `core.js`, not a separate heartbeat subsystem
- request/response ops are part of the same unified runtime as state cards
- old BetterScripts-era assumptions are no longer the model Frontier should be documented around

## Current documentation position

The active documentation set should describe Frontier as:

- built
- unified
- cards-based
- live-count-aware
- module-driven

It should not describe Frontier as:

- a speculative architecture
- a Scripture-only prototype
- a phased split between Lite and Full runtime profiles
- a future possibility that still needs the core system invented

## Remaining work before Frontier is fully wrapped

The core runtime, all modules, and the regression test suite are shipped. What remains is documentation, showcase scripts, multiplatform follow-through, and public-facing guides.

### Completed phases

**Phase 9 — BetterDungeon SDK.**

- Shipped the `sdk` Frontier module with `version` and `config` ops.
- Locked in the separation: heartbeat owns Frontier discovery, SDK owns BetterDungeon-facing metadata.
- Added and live-validated the dedicated `sdk-module` regression script.
- Moved config reads through the background-authoritative path so the SDK reflects real saved AI settings.

**Phase 10 — Module Polish & Test Scripts.**

- All 9 shipped modules polished and validated.
- Dedicated regression test suites created for every module in `tests/aid-scripts/`: scripture, ai, sdk, clock, system, network, geolocation, weather, webfetch.
- Story card types normalized to capitalized `Frontier` across all production code.
- Every shipped module now has a dependable regression surface.

### Phase 11 — Documentation Cleanup (active)

In progress:

- Vetting internal Frontier docs file by file.
- Removing stale planning residue and outdated phase references.
- Aligning roadmap language with what is actually shipped.

Goal:

- Every active file under `frontier/` reflects the shipped Frontier system rather than the earlier build process.

### Phase 12 — Showcase Scripts

Still needed:

- Produce or polish example scripts for the shipped modules.
- Keep examples useful as both demos and learning material.

Known examples already in the codebase:

- Aura Cards (AI + Scripture)
- Chronos V2 (Clock + Weather + Scripture)

Goal:

- Each important module has at least one strong example script.

### Phase 13 — Mobile Port

Still needed:

- Carry Frontier through the Android WebView path.
- Multiplatform smoke testing across Chromium, Gecko, and Android WebView.

Goal:

- Frontier behavior is understood and documented across supported BetterDungeon targets.

### Phase 14 — BetterRepository Documentation

Still needed:

- Finish the public-facing BetterRepository Frontier/module docs.
- Align public docs with the real shipped runtime.
- Complete release-facing cleanup around the Frontier feature set.

Goal:

- Public docs explain Frontier clearly without reintroducing outdated technical assumptions.

## What is no longer an active implementation problem

These should not keep showing up in active planning docs as if they are still open:

- whether Frontier can support two-way communication
- whether Lite is needed
- whether heartbeat should use a profile split
- whether Scripture should key its turn history around wire action ids
- whether Frontier needs a separate heartbeat file
- whether Frontier is still just a future V2 experiment

Those questions were useful during construction, but they are settled now.

## What is intentionally out of scope for now

These are still reasonable future ideas, but they are not required to describe Frontier's current working state:

- third-party module registry UI
- sandboxed user-authored modules
- richer inspector/debugger UI
- full migration of every older BetterDungeon card consumer to Frontier-native streams
- additional AI provider expansion beyond the current shipped bridge

## Practical file references

If someone needs the real implementation, these are the most useful places to start:

- [00-overview.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/frontier/00-overview.md)
- [01-architecture.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/frontier/01-architecture.md)
- [02-modules.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/frontier/02-modules.md)
- [core.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/core.js)
- [module-registry.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/module-registry.js)
- [ops-dispatcher.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/ops-dispatcher.js)
- [ws-stream.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/ws-stream.js)
- [ws-interceptor.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/ws-interceptor.js)

Those files are a better source of truth than the old construction diary ever was.
