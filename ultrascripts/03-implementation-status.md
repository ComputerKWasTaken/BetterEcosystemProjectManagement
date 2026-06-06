# 03 - Implementation Status

> This document is the current implementation-status and roadmap summary for Ultrascripts. It replaces the older phase-by-phase construction log. Ultrascripts's core system is already built and working; this doc exists to show what is shipped, what remains, and what is intentionally out of scope for now.

## Current state

Ultrascripts is no longer in the "plan the architecture" stage. The core runtime is implemented in BetterDungeon and already supports:

- live story-card observation
- direct GraphQL `SaveQueueStoryCard` writeback authenticated with captured session `baseCredentials`
- per-card write queuing
- module registration and lifecycle
- heartbeat-based module discovery
- state-card dispatch
- request/response ops through `ultrascripts:out` and `ultrascripts:in:<module>`

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

- `ws-interceptor.js` (page-world `WebSocket` / `fetch` / `XHR` shim)
- `ws-stream.js`
- session `baseCredentials` capture and `ultrascripts:baseCredentials:change` broadcast
- adventure-boundary handling
- live-count tracking
- tail tracking

Result:

- Ultrascripts can observe AI Dungeon's story cards and actions reliably enough to drive the runtime.

### Write path

Shipped:

- direct hardcoded `SaveQueueStoryCard` GraphQL mutation in `ai-dungeon-service.js` (resolver `updateStoryCard`, input `UpdateStoryCardInput!`)
- session `baseCredentials` handshake from MAIN world to isolated world
- shared `write-queue.js`
- optimistic local updates
- retry/coalescing behavior

Result:

- BetterDungeon can write and update Ultrascripts-owned cards from turn-0 onward with no template-priming step and no dependency on prior user-initiated card edits.

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

- Ultrascripts's module surface is stable enough to document and extend

### BetterDungeon integration

Shipped:

- `features/ultrascripts_feature.js`
- popup-side Ultrascripts controls
- per-module toggles
- WebFetch consent management
- AI module settings and connection testing

Result:

- Ultrascripts is integrated as a real BetterDungeon feature, not a side experiment

## What was especially important to resolve

These were the big implementation questions that once mattered and are now settled:

- live-count history won over action-id-keyed history
- full two-way Ultrascripts shipped; there is no meaningful Lite profile
- direct credentials-driven `SaveQueueStoryCard` writes replaced the legacy snoop-and-replay template cache; turn-0 cold start, silent failure loops, and the mobile `StoryCardInput` validation trap are all gone
- heartbeat lives in `core.js`, not a separate heartbeat subsystem
- request/response ops are part of the same unified runtime as state cards
- old BetterScripts-era assumptions are no longer the model Ultrascripts should be documented around

## Current documentation position

The active documentation set should describe Ultrascripts as:

- built
- unified
- cards-based
- live-count-aware
- module-driven

It should not describe Ultrascripts as:

- a speculative architecture
- a Scripture-only prototype
- a phased split between Lite and Full runtime profiles
- a future possibility that still needs the core system invented

## Remaining work before Ultrascripts is fully wrapped

The core runtime, all modules, the regression test suite, multiplatform follow-through, the public BetterRepository guide set, and the standard SDK-based Enhanced/Required script template foundation are shipped. What remains is module-by-module conceptual review and then complete production-quality scripts.

### Completed phases

**Phase 9 — BetterDungeon SDK.**

- Shipped the `sdk` Ultrascripts module with `version` and `config` ops.
- Locked in the separation: heartbeat owns Ultrascripts discovery, SDK owns BetterDungeon-facing metadata.
- Added and live-validated the dedicated `sdk-module` regression script.
- Moved config reads through the background-authoritative path so the SDK reflects real saved AI settings.

**Phase 10 — Module Polish & Test Scripts.**

- All 9 shipped modules polished and validated.
- Dedicated regression test suites created for every module in `tests/aid-scripts/`: scripture, ai, sdk, clock, system, network, geolocation, weather, webfetch.
- Story card types normalized to capitalized `Ultrascripts` across all production code.
- Every shipped module now has a dependable regression surface.

**Phase 11 — Documentation Cleanup.**

- Vetted all active internal Ultrascripts documentation files under `ultrascripts/` to ensure perfect alignment with production reality.
- Removed stale speculative planning language, deprecated profiles, and obsolete phase references.
- Replaced the speculative SDK roadmap with a definitive production API specification.
- Updated project-wide management hubs to reflect complete alignment.

**Phase 12 — Mobile Port.**

- Carried Ultrascripts through the Android WebView path.
- Completed multiplatform support across Chromium, Gecko/Firefox, and Android WebView.
- Documented the supported platform set in BetterRepository.

**Phase 13 — BetterRepository Documentation.**

- Completed the public-facing BetterRepository Ultrascripts guide set.
- Added/polished the overview, Quick Start, Cookbook, Architecture, Building Modules, and all shipped module guides.
- Aligned public examples with the live `ai`, `sdk`, heartbeat, and envelope contracts.
- Cleaned the Ultrascripts info dump so it no longer carries Phase 12/13 TODOs.

### Phase 14 - Reopened Module Quality Pass and Complete Scripts

Active next:

- Keep the standard SDK-based Enhanced and Required templates aligned with the live AI Dungeon scripting sandbox.
- Temporarily reopen the module quality pass so the shipped module set can be pushed from "working" to "maximally useful" for real authors.
- Finish the Scripture pass first, especially widget/mobile polish and the remaining helper-alignment work.
- Continue module review after Scripture only where it materially improves showcase-script quality.
- Produce the three target showcase scripts only after the Scripture-first quality pass lands.

Current example foundation:

- `ultrascripts-starter-template`
- `ultrascripts-required-template`

Goal:

- Complete scripts should be based on the standardized helper/templates and should demonstrate finalized module behavior rather than old transitional examples.

Showcase script targets after module polish:

1. **Brainiac** - Requires Ultrascripts. Repurpose Auto Cards' automatic story-card generation flow, remove its memory system, and use the AI module plus Inner Self-style brain cards for high-quality story card and brain management.
2. **Statboy** - Requires Ultrascripts. Build a seamless stat-management script where authors define stat schemas and the AI module proposes structured state updates, with validation and Scripture widgets.
3. **Chronos V2** - Enhanced with Ultrascripts. Rework the existing Chronos concept so the base time system still works without BetterDungeon, while Ultrascripts adds real time/weather sync and proper widgets.

Follow-up after showcase scripts:

- Plan the BetterDungeon V2 release while the showcase-script results are still fresh and concrete.
- Sync the BetterDungeon mobile codebase with the PC codebase as part of launch prep so both are on the same Ultrascripts/runtime behavior.
- Move into launch prep once module polish, showcase scripts, release planning, and any required mobile/PC sync are complete.

Quality-pass reference:

- [08-module-quality-pass.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/08-module-quality-pass.md)

## What is no longer an active implementation problem

These should not keep showing up in active planning docs as if they are still open:

- whether Ultrascripts can support two-way communication
- whether Lite is needed
- whether heartbeat should use a profile split
- whether Scripture should key its turn history around wire action ids
- whether Ultrascripts needs a separate heartbeat file
- whether Ultrascripts is still just a future V2 experiment

Those questions were useful during construction, but they are settled now.

## What is intentionally out of scope for now

These are still reasonable future ideas, but they are not required to describe Ultrascripts's current working state:

- third-party module registry UI
- sandboxed user-authored modules
- richer inspector/debugger UI
- full migration of every older BetterDungeon card consumer to Ultrascripts-native streams
- additional AI provider expansion beyond the current shipped bridge

## Practical file references

If someone needs the real implementation, these are the most useful places to start:

- [00-overview.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/00-overview.md)
- [01-architecture.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/01-architecture.md)
- [02-modules.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/02-modules.md)
- [05-betterdungeon-sdk-spec.md](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/Project%20Management/ultrascripts/05-betterdungeon-sdk-spec.md)
- [core.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/core.js)
- [module-registry.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/module-registry.js)
- [ops-dispatcher.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/ops-dispatcher.js)
- [ws-stream.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/ws-stream.js)
- [ws-interceptor.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/ws-interceptor.js)

Those files are a better source of truth than the old construction diary ever was.
