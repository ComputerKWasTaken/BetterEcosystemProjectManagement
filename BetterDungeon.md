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

- clean up and verify Scripture
- make sure Scripture is solid on mobile and narrow layouts
- keep the Enhanced and Required templates aligned with BetterRepository
- build Brainiac, Statboy, and Chronos V2 after module polish

## Active Work

### AI Module

Goal: keep the completed AI module stable, documented, and ready for real
script use.

Current state:

- module id `ai` is shipped
- `ai.status` and `ai.query` are exposed
- the backend-agnostic AI executor validates query requests and builds
  normalized tasks
- the default production backend uses a policy-safe background-worker path
- API keys are stored in extension local storage and never exposed to page
  scripts
- JSON queries require an explicit schema
- thinking, structured output, and fallback behavior are live
- previous provider, native-generation, and alias surfaces are not active

Current posture:

- treat the AI module as complete for V2
- keep docs/tests aligned with the live `status`/`query` contract
- leave future backend expansion as optional follow-on work, not current
  release-blocking work

### Module Quality Pass

Goal: make shipped modules feel good in real scripts, not merely test-passing.

Current priority:

- Scripture widget/layout/helper polish
- Scripture behavior verification
- Scripture mobile and narrow-layout readiness
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

1. Polish/complete Scripture.
2. Build Brainiac, Statboy, and Chronos V2.
3. Resync mobile with PC Ultrascripts behavior.
4. Rework Chrome Web Store marketing.
5. Publish the Firefox Add-ons version.
6. Drop Reddit teasers, then finish last-minute bugfixes and polish.
7. Release BetterDungeon V2.

## Later

- Third-party module registry and sandboxing as a future project.
- NPM/TypeScript/bundler migration as a separate epic.

## Risks

- Showcase scripts may expose awkward module result fields or public-doc drift.
- Future scripts should not fork the `bd.us` helper contract without updating
  BetterDungeon examples and BetterRepository raw-script copies.
- AI module flows depend on user-provided API keys and should stay policy-safe,
  bounded, opt-in, and clearly documented.
- Scripture polish matters disproportionately because it is the player-visible
  face of Ultrascripts.

## Canonical Docs

- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Current roadmap](./ultrascripts/planning/current-roadmap.md)
- [Verification reference](./ultrascripts/reference/verification.md)
- [BetterDungeon SDK reference](./ultrascripts/reference/sdk.md)
- [Script contract reference](./ultrascripts/reference/script-contract.md)
- [Module quality pass](./ultrascripts/planning/module-quality-pass.md)
