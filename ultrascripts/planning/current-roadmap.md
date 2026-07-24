# BetterEcosystem Final-Era Roadmap

## Status Snapshot

BetterDungeon V2 is released. Ultrascripts is shipped infrastructure with eight
first-party modules, aligned starter templates, regression suites, public guide
coverage, and desktop/mobile support.

Completed foundation:

- Core runtime, transport, write path, heartbeat discovery, and state dispatch.
- Request/response operations and module registry.
- Popup integration and per-module settings.
- Eight first-party modules with dedicated regression suites.
- Enhanced and Required starter templates.
- BetterRepository public Ultrascripts guide foundation.
- Chromium, Firefox/Gecko, and Android WebView support.
- Stable asynchronous AI `status`/`query` contract.
- Widget V2 polish and PC/mobile behavior resynchronization.
- BetterDungeon V2 publication.

The remaining roadmap is a fixed release sequence. Work on one stage at a time.

## Stage 1 — BetterRepository V1.7

Status: **Active**

Goal: publish a polished public resource release that accurately supports the
already-released BetterDungeon V2.

Required work:

- Reconcile public guides, info dumps, templates, and script metadata.
- Confirm the public module inventory contains the eight shipped modules.
- Polish navigation, search, responsive layouts, downloads, and visual finish.
- Finalize V1.7 What's New copy, metadata, and release notes.
- Clearly label Stateboy as unpublished if it appears before its release stage.
- Run a clean production build and smoke-test primary routes.
- Publish V1.7 and verify the live deployment.

Exit gate:

- Public claims match released V2 behavior.
- Primary routes, search, navigation, and downloads work.
- No unpublished showcase is presented as public.
- The live deployment is verified.

## Stage 2 — Stateboy

Status: **Next**

Goal: turn the existing implementation into the first published Ultrascripts
showcase.

Required work:

- Review the script and trim unfinished or confusing behavior.
- Verify Required-mode gating and player-facing setup messages.
- Live-test AI, Widget, SDK, manual-edit, and fallback paths.
- Align the raw script, BetterRepository entry, usage guide, and release copy.
- Publish Stateboy and verify its public entry and download.

Exit gate:

- The live script behaves predictably with and without AI configuration.
- Documentation matches the published script.
- BetterRepository marks Stateboy as published only after publication succeeds.

## Stage 3 — Brainiac

Status: **Planned after Stateboy**

Goal: publish an AI-powered story-card and brain-card management showcase.

Required work:

- Finalize scope from Auto Cards and Inner Self patterns.
- Use the public AI `status`/`query` contract and validate all returned JSON.
- Keep story/brain cards as the persistent author-facing substrate.
- Add useful Widget/SDK status surfaces without making them ornamental.
- Build regression scenarios, public documentation, and release assets.
- Publish Brainiac and verify its public entry.

Exit gate:

- Card writes are safe and explainable.
- AI-unavailable behavior is actionable and non-destructive.
- Public examples teach reusable patterns rather than project-specific tricks.

## Stage 4 — Chronos V2

Status: **Planned after Brainiac**

Goal: publish a vanilla-safe timekeeper enhanced by Ultrascripts.

Required work:

- Preserve useful base timekeeping without BetterDungeon.
- Add optional Clock, Weather, Widget, and SDK enhancements.
- Use explicit place names or coordinates for weather.
- Keep weather failures non-blocking.
- Verify timezones, formatting, persistence, and narrow/mobile presentation.
- Publish Chronos V2 and verify its public entry.

Exit gate:

- Vanilla and enhanced paths both work.
- Time and weather behavior is deterministic enough for scenario authors.
- Public documentation clearly distinguishes required and optional capabilities.

## Stage 5 — Era Closeout

Status: **Planned after Chronos V2**

- Verify BetterRepository status and downloads for all three showcases.
- Align private references, public entries, and release history.
- Move completed checklists out of active planning.
- Record only genuine maintenance risks for BetterDungeon V2.
- Keep BetterVoyage and speculative infrastructure projects parked.
- Declare this roadmap complete.

## Sequencing Rules

- Only the first incomplete stage is active.
- A later showcase may collect brief notes but may not become parallel work.
- BetterDungeon changes require a confirmed maintenance or showcase blocker.
- BetterRepository V1.7 does not wait for Stateboy publication.
- Stateboy must publish before Brainiac becomes active.
- Brainiac must publish before Chronos V2 becomes active.
- New platform initiatives wait until era closeout.

## Settled Technical Decisions

- Ultrascripts supports two-way communication.
- Heartbeat is discovery; SDK is metadata/configuration.
- Direct `SaveQueueStoryCard` writeback is the production write path.
- Mutation-template priming, Lite/full profiles, and invisible-text transport are retired.
- `ai` is the canonical AI module id.
- Module responses arrive on later turns.
- The released AI contract is a maintenance surface, not an active rebuild.

## Parked Work

- Third-party module registry and sandboxing.
- Richer runtime inspector/debugger.
- Broad AI provider expansion.
- Full migration of older BetterDungeon Story Card consumers.
- TypeScript/NPM/bundler migration.
- BetterVoyage implementation.

## Practical Next Action

Work only on the BetterRepository V1.7 release checklist. Do not begin Stateboy
publication work until V1.7 is live and verified.
