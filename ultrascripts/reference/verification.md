# Verification Reference

## Purpose

Ultrascripts relies on live AI Dungeon behavior, browser extension behavior, and
Story Card round-tripping. Local reasoning is not enough. This document maps
the verification surfaces that currently exist and when to use each one.

## Verification Surfaces

| Surface | Location | Use |
|---|---|---|
| Module regression suites | `../../../BetterDungeon/tests/aid-scripts/` | Live AI Dungeon scripts for each shipped module |
| Enhanced template | `../../../BetterDungeon/examples/aid-scripts/ultrascripts-starter-template/` | Smoke check for optional/fallback Ultrascripts usage |
| Required template | `../../../BetterDungeon/examples/aid-scripts/ultrascripts-required-template/` | Smoke check for hard runtime/capability gating |
| Public template copies | `../../../BetterRepository/src/data/raw-scripts/` | Ensure BetterRepository ships the same helper contract |
| Public guide pages | `../../../BetterRepository/src/components/guides/Ultrascripts*.vue` | Ensure author-facing claims match the runtime |
| Popup/background settings | `../../../BetterDungeon/popup.js`, `../../../BetterDungeon/background.js` | Verify player configuration, privileged fetch transport, SDK, and AI setup |

## Module Suite Inventory

| Module | Suite | Files | Main coverage |
|---|---|---|---|
| `widget` | `widget-module` | `library.js`, `input-modifier.js`, `output-modifier.js`, `README.md`, `ROADMAP.md` | Widgets, interactions, manifest validation, custom widgets, transitions |
| `ai` | `ai-module` | `library.js`, `output-modifier.js`, `README.md` | Async status/query contract, query metadata, text output, schema-backed JSON output, thinking levels, missing-key errors |
| `sdk` | `sdk-module` | `library.js`, `output-modifier.js`, `README.md` | heartbeat discovery, `version`, `config`, response acks, trace card |
| `clock` | `clock-module` | `library.js`, `output-modifier.js`, `README.md` | `now`, `tz`, `format`, timezone variants, invalid requests |
| `system` | `system-module` | `library.js`, `output-modifier.js`, `README.md` | `info`, `power`, browser/device/screen/locale/battery shape |
| `network` | `network-module` | `library.js`, `output-modifier.js`, `README.md` | `status`, online/quality/connection hints |
| `weather` | `weather-module` | `library.js`, `output-modifier.js`, `README.md` | `current`, `forecast`, coordinates, place lookup, units, network/geocode failures |
| `webfetch` | `webfetch-module` | `library.js`, `output-modifier.js`, `README.md` | HTTPS `fetch`, redirects, content types, header stripping, rate limits, private-target blocking, truncation |
| `audio` (V2.1 development) | `audio-module` | `library.js`, `input-modifier.js`, `output-modifier.js`, `README.md` | oscillator/noise effects, pitch sweeps, envelopes, replay prevention, validation, stop lifecycle |

Every shipped first-party module has a dedicated suite.

## What Each Suite Is For

### Widget

Use when changing:

- `../../../BetterDungeon/modules/widget/module.js`
- `../../../BetterDungeon/modules/widget/renderer.js`
- `../../../BetterDungeon/modules/widget/validators.js`
- Widget CSS or widget layout
- widget event queue or `ackSeq` behavior
- public widget examples

Special attention:

- live-count history lookup
- mobile/narrow rendering
- renderer/helper bloat
- interactive widgets
- `ultrascripts:in:widget.widgetEvents`
- script-side `interactions.ackSeq`

### AI

Use when changing:

- `../../../BetterDungeon/modules/ai/module.js`
- AI status/query contract shape
- public AI setup and query examples

Special attention:

- heartbeat advertises `ai.status` and `ai.query`
- `ai.status` reports readiness, selected model, and key-configured state
- text, schema-backed JSON, query metadata, and thinking-level queries return live results when the backend is configured
- missing-key text and JSON queries return terminal `not_configured` errors
- schema-less JSON queries return terminal `invalid_args`
- invalid thinking levels return terminal `invalid_args`
- no provider alias, script-facing model setting, or provider-native payload is advertised

### SDK

Use when changing:

- `../../../BetterDungeon/modules/sdk/module.js`
- SDK config snapshots in `background.js`
- heartbeat fields used for discovery
- public SDK/config examples

Special attention:

- heartbeat owns runtime/module discovery
- SDK owns safe BetterDungeon metadata/configuration
- no API keys or session tokens may leak

### Clock

Use when changing:

- `../../../BetterDungeon/modules/clock/module.js`
- timezone normalization
- date/time formatting
- future Chronos V2 time helpers

Special attention:

- `clock.format` returns a string
- public examples should not read `data.now`

### Weather

Use when changing:

- coordinate or place-name weather flows
- future Chronos V2 real-world sync
- place lookup or Open-Meteo integration

Special attention:

- denied/prompt/unavailable permission states
- `latitude`/`longitude` names, not `lat`/`lon`
- weather fields live under `current` or `days`

### WebFetch

Use when changing:

- `../../../BetterDungeon/modules/webfetch/module.js`
- `../../../BetterDungeon/background.js`
- Android `WebFetchClient.kt` and bridge/polyfill files
- blocked target rules
- public fetch examples

Special attention:

- v1 supports HTTPS `GET` and `HEAD` only
- no public examples should teach `POST` or request bodies
- redirects must be manually bounded and revalidated at every hop
- cross-origin redirects must not forward custom headers
- declared binary content, private targets, timeouts, and rate limits must be branchable
- PC and Mobile must return equivalent response and error shapes

### Network And System

Use when changing:

- browser/environment hint logic
- fallback branching examples
- mobile/desktop adaptation examples

Special attention:

- many fields are best-effort
- public scripts should not hard-gate on fragile browser hints

## Template Smoke Checks

The two starter templates are not formal regression suites, but they are the
best smoke checks for the author-facing helper contract.

### Enhanced Template

Location:

- `../../../BetterDungeon/examples/aid-scripts/ultrascripts-starter-template/`

Verifies:

- heartbeat beat initialization, advancement, stale detection, and recovery
- optional Ultrascripts path
- fallback behavior when runtime is absent
- `bd.us` helper shape
- response polling and acknowledgements
- `sdk.config` request/caching
- `clock.now` example
- Widget dashboard publishing

### Required Template

Location:

- `../../../BetterDungeon/examples/aid-scripts/ultrascripts-required-template/`

Verifies:

- hard runtime requirement messaging
- stale heartbeat gating after an unchanged beat
- required module/op checks
- clear player-facing failures
- same helper foundation as Enhanced
- `sdk.config` and Widget dashboard publishing

## When To Run What

| Change | Minimum verification |
|---|---|
| Module implementation | that module suite |
| Widget renderer/layout | Widget suite plus mobile/narrow visual check |
| Core state dispatch/live count | Widget suite plus at least one ops suite |
| Ops dispatcher/envelope | AI contract suite plus one safe ops suite such as Clock or SDK |
| Write queue/GraphQL write path | heartbeat smoke, SDK suite, one module response suite |
| Heartbeat payload/liveness | action and Retry refresh smoke, stale/recovery template checks, SDK suite, public Quick Start claims |
| SDK config | SDK suite, AI guide/template config branches |
| Public example/helper changes | Enhanced and Required templates plus relevant module guide |
| Showcase script work | relevant module suites plus template contract check |

For release prep, re-check all eight module suites or at least the suites touched
since the last known-good pass.

## Known Historical Sign-Offs

Past live checks established that the runtime and modules work in AI Dungeon.
Keep these as context, not as a substitute for rechecking changed surfaces.

| Area | Date | Result |
|---|---:|---|
| Widget | 2026-04-22 | Live suite passed 10/10 |
| Full two-way runtime | 2026-04-22 | Live suite passed, including reload-mid-pending |
| WebFetch legacy contract | 2026-04-23 | Live suite passed before the V2.1 fetch-only transport revision |
| WebFetch 1.0 | 2026-08-05 | PC and Mobile module copies passed the expanded Node suite; native Kotlin transport compiled independently; user smoke test accepted the revision for roadmap completion |
| Clock | 2026-04-23 | Live suite passed |
| Weather | 2026-04-23 | Live suite passed |
| Network | 2026-04-24 | Live suite passed |
| System | 2026-04-24 | Live suite passed |
| AI module / legacy provider alias removal | 2026-04-26 | Live suite passed |

## Documentation Verification

When updating docs, verify:

- file paths still exist
- module names and op names match code
- public guide claims match private contract notes
- helper examples respect AI Dungeon scripting constraints
- template copies in BetterDungeon and BetterRepository stay aligned
- public examples do not rely on same-turn responses
- retired names do not reappear as recommended usage

Useful grep targets:

- retired AI provider aliases
- retired AI generation ops
- `max_tokens`
- `response_format`
- `top_p`
- `data.now`
- `lat`
- `lon`
- `accuracyMeters`
- `stat-bar`
- `badge-list`
- `checklist`
- `ultrascripts.profile`

## Cleanup Policy

- Keep active repeatable suites in the main doc set.
- Move one-off construction logs to `archive/`.
- Do not describe a test directory as active unless it exists.
- Do not claim a public guide is complete unless the BetterRepository component
  exists and matches the implementation.
- If a regression suite changes because the public helper contract changed,
  update [script-contract.md](./script-contract.md).
