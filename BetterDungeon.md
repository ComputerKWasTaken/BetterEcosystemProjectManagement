# BetterDungeon Project Management

> Project tracking for the AI Dungeon browser extension.

## Current Focus

BetterDungeon V2 is in final Ultrascripts polish and release prep.

The major Ultrascripts capability stack is shipped:

- transport and live AI Dungeon traffic observation
- direct `SaveQueueStoryCard` writeback through captured credentials
- write queue
- heartbeat discovery
- two-way request/response envelopes
- state-card dispatch
- module registry and lifecycle
- popup integration and module settings
- Widget, WebFetch, Clock, SDK, Geolocation, Weather, Network, System, and AI
- per-module AI Dungeon regression suites
- Enhanced and Required starter templates
- Chromium, Gecko/Firefox, and Android WebView support

Current next step:

- refresh BetterRepository's Ultrascripts guides and V1.7 release wording
- keep the Enhanced and Required templates aligned with BetterRepository
- build Brainiac and Chronos V2 after the docs/release wording pass
- upload the Firefox Add-ons version
- start Reddit teasers, final bugfixes, and launch polish

Completed finish-line work:

- Widget V2 polish pass
- BetterDungeon Mobile PC parity resync
- BetterDungeon Mobile release-distribution polish
- Stateboy Required Ultrascripts showcase script

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

- SDK readiness for Brainiac
- Clock/Weather/Geolocation readiness for Chronos V2

Tracking doc:

- [Module Quality Pass](./ultrascripts/planning/module-quality-pass.md)

### Showcase Scripts

Planned after module polish:

- **Brainiac** - Requires Ultrascripts. AI-powered story-card and brain-card
  management using the AI module.
- **Stateboy** - Requires Ultrascripts. Readable Story Card state management
  with AI update proposals, script-side validation, State Directives, and Widget
  dashboards. Built.
- **Chronos V2** - Enhanced with Ultrascripts. Vanilla-safe timekeeping with
  optional real time/weather sync and widgets.

## V2 Release Sequence

1. Refresh and verify BetterRepository's Ultrascripts guides.
2. Update BetterRepository V1.7 What's New and release wording.
3. Build Brainiac and Chronos V2.
4. Upload the Firefox Add-ons version of BetterDungeon.
5. Begin Reddit teasers, final bugfixes, and polish.
6. Release BetterDungeon V2 and BetterRepository V1.7.

## Later

- Third-party module registry and sandboxing as a future project.
- NPM/TypeScript/bundler migration as a separate epic.

## Risks

- Showcase scripts may expose awkward module result fields or public-doc drift.
- Future scripts should not fork the `bd.us` helper contract without updating
  BetterDungeon examples and BetterRepository raw-script copies.
- AI module flows depend on user-provided API keys and should stay policy-safe,
  bounded, opt-in, and clearly documented.
- Showcase scripts may still expose awkward Widget compositions even though
  the Widget module polish pass is complete.

## Canonical Docs

- [Ultrascripts internal docs](./ultrascripts/README.md)
- [Current roadmap](./ultrascripts/planning/current-roadmap.md)
- [Verification reference](./ultrascripts/reference/verification.md)
- [BetterDungeon SDK reference](./ultrascripts/reference/sdk.md)
- [Script contract reference](./ultrascripts/reference/script-contract.md)
- [Module quality pass](./ultrascripts/planning/module-quality-pass.md)
