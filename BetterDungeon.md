# BetterDungeon Project Management

> Project tracking for the AI Dungeon browser extension.

## Current Focus

BetterDungeon V2 is in final Ultrascripts polish.

The major Ultrascripts capability stack is shipped:

- transport and live AI Dungeon traffic observation
- direct `SaveQueueStoryCard` writeback through captured credentials
- write queue
- heartbeat discovery
- two-way request/response envelopes
- state-card dispatch
- module registry and lifecycle
- popup integration and module settings
- Scripture, WebFetch, Clock, SDK, Geolocation, Weather, Network, System, and AI
- per-module AI Dungeon regression suites
- Enhanced and Required starter templates
- Chromium, Gecko/Firefox, and Android WebView support

Current next step:

- finish the module quality pass, starting with Scripture
- keep the Enhanced and Required templates aligned with BetterRepository
- build Brainiac, Statboy, and Chronos V2 after module polish

## Active Work

### Module Quality Pass

Goal: make shipped modules feel good in real scripts, not merely test-passing.

Current priority:

- Scripture widget/layout/helper polish
- AI and SDK readiness for Brainiac and Statboy
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

## Later

- BetterDungeon V2 release plan.
- Version bump, README/changelog, and store-page polish.
- Final PC/mobile parity check after module/template changes.
- Third-party module registry and sandboxing as a future project.
- NPM/TypeScript/bundler migration as a separate epic.

## Risks

- Showcase scripts may expose awkward module result fields or public-doc drift.
- Future scripts should not fork the `bd.us` helper contract without updating
  BetterDungeon examples and BetterRepository raw-script copies.
- AI module flows depend on player-supplied OpenRouter configuration and should
  remain bounded, opt-in, and clearly documented.
- Scripture polish matters disproportionately because it is the player-visible
  face of Ultrascripts.

## Canonical Docs

- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Current roadmap](./ultrascripts/planning/current-roadmap.md)
- [Verification reference](./ultrascripts/reference/verification.md)
- [BetterDungeon SDK reference](./ultrascripts/reference/sdk.md)
- [Script contract reference](./ultrascripts/reference/script-contract.md)
- [Module quality pass](./ultrascripts/planning/module-quality-pass.md)
