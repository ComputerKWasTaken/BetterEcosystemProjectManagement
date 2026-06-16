# Current Roadmap

## Status Snapshot

Ultrascripts is in final polish. Treat the runtime and shipped module set as
real infrastructure, not as an active construction project.

Done:

- core runtime
- transport and write path
- heartbeat discovery
- state-card dispatch
- request/response ops
- module registry
- popup integration
- 9 shipped first-party modules
- 9 dedicated module regression suites
- Enhanced and Required starter templates
- BetterRepository public Ultrascripts guide set
- Chromium, Gecko/Firefox, and Android WebView support
- completed AI module with stable `status`/`query` contract

Not done:

- Widget polish and cleanup
- Widget mobile and narrow-layout readiness
- three production showcase scripts
- BetterDungeon V2 release prep
- BetterRepository V2 release prep
- final PC/mobile sync after module and showcase fallout

## Active Workstream

### 1. Widget Polish

Goal: make Widget feel clean, light, and dependable in real scripts.

Current priorities:

- reduce renderer/helper bloat
- verify interaction and event-ack behavior
- improve automatic mobile and narrow-layout behavior
- keep the public guide, examples, and regression suite aligned with live behavior

Success looks like:

- Widget feels comfortable to ship in Brainiac, Statboy, and Chronos V2
- the regression suite still reflects real author usage
- helper examples match the live interaction contract
- mobile and desktop behavior both feel intentional

Tracked in [Module Quality Pass](./module-quality-pass.md).

### 2. Template Alignment

Goal: keep the Enhanced and Required starter foundations as the canonical
script-side helper pattern.

Watch:

- `../../../BetterDungeon/examples/aid-scripts/ultrascripts-starter-template/`
- `../../../BetterDungeon/examples/aid-scripts/ultrascripts-required-template/`
- `../../../BetterRepository/src/data/raw-scripts/*/ultrascripts-starter-template.js`
- `../../../BetterRepository/src/data/raw-scripts/*/ultrascripts-required-template.js`
- `../../../BetterRepository/src/data/scripts.js`

### 3. Showcase Scripts

After Widget polish, build:

1. **Brainiac** - Requires Ultrascripts. AI-powered story-card and brain-card
   management through the shipped AI module.
2. **Statboy** - Requires Ultrascripts. Schema-based stat management where
   authors define stats, AI proposes structured updates, script logic
   validates/clamps them, and Widget renders current state.
3. **Chronos V2** - Enhanced with Ultrascripts. A reworked Chronos that keeps a
   vanilla timekeeping path but adds BetterDungeon-powered time/weather sync and
   widgets when Ultrascripts is available.

## Shipped Modules

| Module | Status | Notes |
|---|---|---|
| `widget` | shipped, active polish focus | Player-visible module; current highest priority |
| `webfetch` | shipped | Review consent/error ergonomics if a showcase script needs it |
| `clock` | shipped | Ready for Chronos V2 time helpers |
| `sdk` | shipped | Keep heartbeat/SDK separation crisp |
| `geolocation` | shipped | Review with Weather if Chronos V2 uses location |
| `weather` | shipped | Ready for Chronos V2 weather sync after field-shape check |
| `network` | shipped | Best used for fallback hints, not hard gating |
| `system` | shipped | Best used for layout/device hints, not brittle UA branches |
| `ai` | shipped | Stable async `status`/`query` contract with text, JSON, thinking levels, and backend setup gating |

## BetterDungeon Integration

Shipped files:

- `../../../BetterDungeon/features/ultrascripts_feature.js`
- `../../../BetterDungeon/popup.js`
- `../../../BetterDungeon/background.js`
- `../../../BetterDungeon/manifest.json`

Current capabilities:

- master Ultrascripts toggle
- per-module toggles
- debug toggle
- WebFetch consent management
- AI setup and status/query configuration
- SDK background config snapshots
- extension load integration for all first-party modules

## Release Path

```text
Widget polish
-> Brainiac, Statboy, and Chronos V2
-> PC/mobile Ultrascripts resync
-> Chrome Web Store marketing refresh
-> Firefox Add-ons publishing
-> Reddit teasers, final bugfixes, and polish
-> BetterDungeon V2 release
```

Release prep should include:

- version bump decisions
- README/changelog polish
- BetterRepository script entries and guide links
- extension-store copy/screenshots if needed
- mobile/PC parity check for Ultrascripts runtime behavior
- final regression pass on changed modules and templates

## Settled Decisions

These are no longer active implementation questions:

- Ultrascripts supports two-way communication.
- Heartbeat is the discovery surface.
- SDK is metadata/config, not discovery.
- Live count is the Widget history key.
- Direct `SaveQueueStoryCard` writeback is the production write path.
- Mutation-template priming is retired.
- Lite/full profiles are retired.
- `ai` is the canonical module id.
- AI Dungeon scripts must expect module responses on later turns.
- The AI module is complete enough for V2 and is not the active rebuild track.

## Intentional Future Work

Good ideas, not required for V2:

- third-party module registry UI
- sandboxed user-authored modules
- richer runtime inspector/debugger
- deeper AI provider/backend expansion
- full migration of every older BetterDungeon Story Card consumer
- TypeScript/NPM/bundler migration

## Risks To Keep Visible

- Public examples can drift from the helper/template contract.
- Showcase scripts may expose awkward module result fields or error codes.
- Widget mobile/narrow rendering can make otherwise-good scripts feel rough.
- AI queries depend on player API-key setup and should fail closed with
  actionable `not_configured` errors.
- WebFetch examples must respect consent, blocked targets, and late responses.
- Mobile/PC parity should be checked after final module/template changes, not
  assumed from old smoke tests.

## Practical Next Action

Start with Widget:

1. Reduce bloat in the renderer, helpers, and state-flow where it improves real
   author usage.
2. Verify widget rendering, interactions, event pruning, and `ackSeq` behavior
   against the live suite and public examples.
3. Do a dedicated mobile and narrow-layout pass before moving on to showcase
   scripts.
