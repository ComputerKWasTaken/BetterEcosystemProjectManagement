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
- completed V2 Widget polish pass
- PC/mobile Ultrascripts behavior resync
- mobile build release polish
- Stateboy Required Ultrascripts showcase script

Not done:

- BetterRepository V1.7 Ultrascripts guide refresh
- BetterRepository V1.7 What's New and release wording refresh
- Brainiac and Chronos V2 showcase scripts
- BetterDungeon V2 release prep
- BetterRepository V1.7 release prep

## Active Workstream

### 1. Widget Polish Complete

Goal: make Widget feel clean, light, and dependable in real scripts.

Completed:

- tightened validation and invalid-suite coverage
- verified interaction and event-ack behavior, including accepted-value bridge
- improved automatic mobile and narrow-layout behavior
- added a local minimize control for cramped/mobile surfaces
- kept the public guide, examples, raw BetterRepository copies, and regression
  suite aligned with live behavior

Success looks like:

- Widget feels comfortable to ship in Stateboy, Brainiac, and Chronos V2
- the regression suite still reflects real author usage
- helper examples match the live interaction contract
- mobile and desktop behavior both feel intentional
- BetterRepository public docs teach Widget without stale display knobs or old
  module naming

Tracked in [Module Quality Pass](./module-quality-pass.md).

### 2. PC/Mobile Ultrascripts Resync

Goal: confirm the mobile build inherits the PC Ultrascripts behavior after the
completed Widget/template changes.

Watch:

- state-card dispatch and writeback parity
- Widget layout/minimize behavior in Android WebView/narrow layouts
- popup/module settings parity
- mobile release-readiness polish

### 3. Template Alignment

Goal: keep the Enhanced and Required starter foundations as the canonical
script-side helper pattern.

Watch:

- `../../../BetterDungeon/examples/aid-scripts/ultrascripts-starter-template/`
- `../../../BetterDungeon/examples/aid-scripts/ultrascripts-required-template/`
- `../../../BetterRepository/src/data/raw-scripts/*/ultrascripts-starter-template.js`
- `../../../BetterRepository/src/data/raw-scripts/*/ultrascripts-required-template.js`
- `../../../BetterRepository/src/data/scripts.js`

### 4. Showcase Scripts

Current showcase status:

1. **Stateboy** - Requires Ultrascripts. Readable Story Card state management
   with AI update proposals, deterministic validation, State Directives, and
   Widget dashboards. Built.
2. **Brainiac** - Requires Ultrascripts. AI-powered story-card and brain-card
   management through the shipped AI module.
3. **Chronos V2** - Enhanced with Ultrascripts. A reworked Chronos that keeps a
   vanilla timekeeping path but adds BetterDungeon-powered time/weather sync and
   widgets when Ultrascripts is available.

### 5. BetterRepository V1.7 Sync

Before release, BetterRepository needs one focused pass:

- refresh Ultrascripts guides for Widget, SDK, templates, mobile expectations,
  and showcase-script examples
- keep `docs/guides/info-dumps/ultrascripts.md` aligned with the public Vue
  guide pages
- update the home-page What's New section for V1.7
- mention the design refresh, Story Card command presets, Ultrascripts guide
  refresh, and BetterDungeon V2 support without overclaiming unfinished
  showcase scripts
- keep Stateboy's script entry aligned with the raw script
- add Brainiac and Chronos V2 script entries after they exist

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
Widget polish complete
-> PC/mobile Ultrascripts resync
-> mobile build release polish
-> BetterRepository Ultrascripts guide refresh
-> BetterRepository V1.7 What's New/release wording
-> Brainiac and Chronos V2
-> Firefox Add-ons publishing
-> Reddit teasers, final bugfixes, and polish
-> BetterDungeon V2 + BetterRepository V1.7 release
```

Release prep should include:

- version bump decisions
- README/changelog polish
- BetterRepository script entries and guide links
- extension-store copy/screenshots if needed
- mobile/PC parity check for Ultrascripts runtime behavior
- mobile APK release-readiness check
- Firefox Add-ons package/listing upload
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
- BetterRepository's paired launch target is V1.7, not V2.

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
- Showcase scripts can still expose awkward Widget compositions or result fields.
- AI queries depend on player API-key setup and should fail closed with
  actionable `not_configured` errors.
- WebFetch examples must respect consent, blocked targets, and late responses.
- Mobile/PC parity should be checked after final module/template changes, not
  assumed from old smoke tests.
- BetterRepository V1.7 copy can mention Stateboy as built, but should not
  promise Brainiac or Chronos V2 until their entries are built.

## Practical Next Action

Start with PC/mobile Ultrascripts resync:

1. Confirm the mobile build carries the same Widget, SDK, state-card dispatch,
   writeback, and module-toggle behavior as PC.
2. Polish the mobile release build around the completed Widget tray/minimize
   behavior.
3. Refresh BetterRepository guide/copy surfaces for the final V2 contract.
4. Build Brainiac and Chronos V2 against the completed module set.
