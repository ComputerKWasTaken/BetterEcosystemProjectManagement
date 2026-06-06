# Current Roadmap

## Status Snapshot

Ultrascripts is in final polish. Treat the runtime as shipped infrastructure.

Done:

- core runtime
- transport and write path
- heartbeat discovery
- state-card dispatch
- request/response ops
- module registry
- popup integration
- 9 first-party modules
- 9 dedicated module regression suites
- Enhanced and Required starter templates
- BetterRepository public Ultrascripts guide set
- Chromium, Gecko/Firefox, and Android WebView support

Not done:

- final module quality pass, led by Scripture
- three production showcase scripts
- BetterDungeon V2 release prep
- BetterRepository V2 release prep
- any final PC/mobile sync needed after showcase-script fallout

## Shipped Runtime Capabilities

### Transport

Shipped files:

- `../../../BetterDungeon/services/ultrascripts/ws-interceptor.js`
- `../../../BetterDungeon/services/ultrascripts/ws-stream.js`

Current capabilities:

- observes AI Dungeon WebSocket/fetch/XHR traffic
- captures Story Cards and action updates
- detects adventure boundaries
- derives tail and live count
- captures `baseCredentials` for authenticated writeback

### Write Path

Shipped files:

- `../../../BetterDungeon/services/ultrascripts/write-queue.js`
- `../../../BetterDungeon/services/ai-dungeon-service.js`

Current capabilities:

- direct `SaveQueueStoryCard` GraphQL writes
- captured session credentials
- per-card write serialization
- coalescing and retry behavior
- optimistic local updates
- turn-0 heartbeat write once cards and credentials are ready

### Core Runtime

Shipped files:

- `../../../BetterDungeon/services/ultrascripts/core.js`
- `../../../BetterDungeon/services/ultrascripts/module-registry.js`
- `../../../BetterDungeon/services/ultrascripts/ops-dispatcher.js`
- `../../../BetterDungeon/services/ultrascripts/envelope.js`

Current capabilities:

- shared module context
- state cache and state dispatch
- live-count-aware re-dispatch
- heartbeat writing
- mounted-module discovery
- request validation/routing
- pending/ok/error/timeout responses
- acknowledgements and stale response pruning
- module enabled-state persistence

### BetterDungeon Integration

Shipped files:

- `../../../BetterDungeon/features/ultrascripts_feature.js`
- `../../../BetterDungeon/popup.js`
- `../../../BetterDungeon/background.js`
- `../../../BetterDungeon/manifest.json`

Current capabilities:

- master Ultrascripts toggle
- per-module toggles
- debug toggle
- Scripture display preferences
- WebFetch consent management
- AI/OpenRouter settings and cost controls
- SDK background config snapshots
- extension load integration for all first-party modules

## Shipped Modules

| Module | Status | Notes |
|---|---|---|
| `scripture` | shipped, active polish focus | Needs final UI/helper review before showcase scripts |
| `webfetch` | shipped | Review consent/error ergonomics if showcase scripts need it |
| `clock` | shipped | Ready for Chronos V2 time helpers |
| `sdk` | shipped | Keep heartbeat/SDK separation crisp |
| `geolocation` | shipped | Review with Weather if Chronos V2 uses location |
| `weather` | shipped | Ready for Chronos V2 weather sync after field-shape check |
| `network` | shipped | Best used for fallback hints, not hard gating |
| `system` | shipped | Best used for layout/device hints, not brittle UA branches |
| `ai` | shipped | Ready for Brainiac/Statboy after config/cost/fallback review |

## Documentation Status

Private docs:

- This folder is the canonical private Ultrascripts planning set.
- The active files now describe current implementation, not construction-era
  debates.
- Archive files are historical and should not steer new work.

Public docs:

- BetterRepository contains public Ultrascripts guides for overview, Quick
  Start, Cookbook, Architecture, Building Modules, and all 9 shipped modules.
- The public docs should remain scenario-author oriented.
- Detailed implementation decisions belong here unless public authors need them.

Template docs:

- Enhanced and Required templates exist in both BetterDungeon examples and
  BetterRepository raw-script data.
- Template/helper changes must be synced in both places.

## Active Workstream

### 1. Module Quality Pass

Goal: make each shipped module feel clean in real scripts, not merely prove that
it works.

Current priority:

- finish Scripture first
- only pull other module work forward when it improves Brainiac, Statboy, or
  Chronos V2
- avoid reopening architecture unless a concrete showcase requirement exposes a
  real gap

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

After module polish, build:

1. **Brainiac** - Requires Ultrascripts. AI-powered story-card and brain-card
   management derived from Auto Cards plus Inner Self patterns. Remove the old
   memory-system framing and use the `ai` module plus well-structured cards.
2. **Statboy** - Requires Ultrascripts. Schema-based stat management where
   authors define stats, `ai.chat` proposes structured updates, script logic
   validates/clamps them, and Scripture renders current state.
3. **Chronos V2** - Enhanced with Ultrascripts. A reworked Chronos that keeps a
   vanilla timekeeping path but adds BetterDungeon-powered time/weather sync and
   widgets when Ultrascripts is available.

## Release Path

```text
Module quality pass
-> Showcase scripts
-> BetterDungeon V2 release plan
-> BetterRepository V2 release plan
-> final PC/mobile sync check
-> launch prep
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
- Live count is the Scripture history key.
- Direct `SaveQueueStoryCard` writeback is the production write path.
- Mutation-template priming is retired.
- Lite/full profiles are retired.
- `ai` is the canonical module id; `providerAI` is only a legacy alias.
- AI Dungeon scripts must expect module responses on later turns.

## Intentional Future Work

Good ideas, not required for V2:

- third-party module registry UI
- sandboxed user-authored modules
- richer runtime inspector/debugger
- deeper AI provider expansion beyond the current OpenRouter bridge
- full migration of every older BetterDungeon Story Card consumer
- TypeScript/NPM/bundler migration

## Risks To Keep Visible

- Public examples can drift from the helper/template contract.
- Showcase scripts may expose awkward module result fields or error codes.
- Scripture mobile/narrow rendering can make otherwise-good scripts feel rough.
- AI flows depend on player configuration and must stay opt-in, bounded, and
  clear.
- WebFetch examples must respect consent, blocked targets, and late responses.
- Mobile/PC parity should be checked after final module/template changes, not
  assumed from old smoke tests.

## Practical Next Action

Start with Scripture:

1. Review current widget layout and interaction behavior on desktop, narrow
   sidebar, and mobile-sized surfaces.
2. Compare public Scripture examples against the live helper contract.
3. Fix only issues that affect real showcase usage.
4. Run or live-check the Scripture regression suite.
5. Update public/private docs only if the actual contract changes.
