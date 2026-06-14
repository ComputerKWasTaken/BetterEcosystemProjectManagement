# BetterDungeon Project Management

> Project tracking for the AI Dungeon browser extension.

## Current Focus

BetterDungeon V2 is in final Ultrascripts rebuild and release prep.

The major Ultrascripts capability stack is shipped:

- transport and live AI Dungeon traffic observation
- direct `SaveQueueStoryCard` writeback through captured credentials
- write queue
- heartbeat discovery
- two-way request/response envelopes
- state-card dispatch
- module registry and lifecycle
- popup integration and module settings
- Scripture, WebFetch, Clock, SDK, Geolocation, Weather, Network, and System
- per-module AI Dungeon regression suites
- Enhanced and Required starter templates
- Chromium, Gecko/Firefox, and Android WebView support

Current next step:

- continue the AI module rebuild from the signed-off status/query contract
- polish/complete Scripture
- keep the Enhanced and Required templates aligned with BetterRepository
- build Brainiac, Statboy, and Chronos V2 after module polish

## Active Work

### AI Module Rebuild

Goal: rebuild the AI module from a clean, policy-safe design.

Current state:

- module id `ai` is preserved
- `ai.status` and `ai.query` are exposed
- the backend-agnostic AI executor validates query requests and builds normalized tasks
- generation backends are intentionally absent
- previous provider, native-generation, and alias surfaces are not active

Rebuild phases:

1. **Contract**
   Define the public AI module contract before any backend work resumes. This
   phase establishes the stable module surface, request/response shapes, error
   model, readiness/status semantics, timeout behavior, and the exact promises
   the module makes to scripts. The goal is for public docs, starter templates,
   and future showcase scripts to target one clear AI contract instead of a
   provider-specific implementation.
2. **Execution Layer**
   Build the internal execution layer that turns script requests into clean,
   well-bounded model tasks. This phase owns prompt/query construction,
   structured request assembly, validation, normalization, logging hooks, and
   the documented internal path between `ai.query` and whatever backend
   eventually processes it. The goal is to keep request construction organized
   and backend-agnostic.
3. **Backend**
   Connect the execution layer to a real provider or runtime such as
   OpenRouter, Google AI Studio, or a future local system. This phase owns
   authentication, transport, provider-specific settings, quota/error mapping,
   and final result delivery back through the AI module contract. Backend work
   happens last so the provider can change without destabilizing scripts,
   templates, or docs.

### Module Quality Pass

Goal: make shipped modules feel good in real scripts, not merely test-passing.

Current priority:

- AI rebuild first
- Scripture widget/layout/helper polish
- SDK readiness for Brainiac and Statboy after the new AI contract exists
- Clock/Weather/Geolocation readiness for Chronos V2

Tracking doc:

- [Module Quality Pass](./ultrascripts/planning/module-quality-pass.md)

### Showcase Scripts

Planned after module polish:

- **Brainiac** - Requires Ultrascripts. AI-powered story-card and brain-card
  management using the AI module.
- **Statboy** - Requires Ultrascripts. Schema-based stat management with AI
  update proposals, validation, and Scripture widgets.
- **Chronos V2** - Enhanced with Ultrascripts. Vanilla-safe timekeeping with
  optional real time/weather sync and widgets.

## V2 Release Sequence

1. Complete the AI module rebuild.
2. Polish/complete Scripture.
3. Build Brainiac, Statboy, and Chronos V2.
4. Resync mobile with PC Ultrascripts behavior.
5. Rework Chrome Web Store marketing.
6. Publish the Firefox Add-ons version.
7. Drop Reddit teasers, then finish last-minute bugfixes and polish.
8. Release BetterDungeon V2.

## Later

- Third-party module registry and sandboxing as a future project.
- NPM/TypeScript/bundler migration as a separate epic.

## Risks

- Showcase scripts may expose awkward module result fields or public-doc drift.
- Future scripts should not fork the `bd.us` helper contract without updating
  BetterDungeon examples and BetterRepository raw-script copies.
- AI module flows are blocked until a new backend design is chosen and should
  stay policy-safe, bounded, opt-in, and clearly documented.
- Scripture polish matters disproportionately because it is the player-visible
  face of Ultrascripts.

## Canonical Docs

- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Current roadmap](./ultrascripts/planning/current-roadmap.md)
- [Verification reference](./ultrascripts/reference/verification.md)
- [BetterDungeon SDK reference](./ultrascripts/reference/sdk.md)
- [Script contract reference](./ultrascripts/reference/script-contract.md)
- [Module quality pass](./ultrascripts/planning/module-quality-pass.md)
