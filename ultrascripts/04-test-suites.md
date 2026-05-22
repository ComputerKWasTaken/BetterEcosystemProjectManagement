# 04 - Ultrascripts Test Suites

> This document tracks the Ultrascripts regression surfaces that exist today and what each one covers. As of Phase 10, every shipped first-party module has a dedicated regression test suite.

## Current test surfaces

Ultrascripts has two main testing surfaces in the repo:

- dedicated AI Dungeon regression scripts under `BetterDungeon/tests/aid-scripts/`
- example scripts under `BetterDungeon/examples/aid-scripts/` that also serve as real-world integration checks

This is important because Ultrascripts is not validated only through unit-style local checks. A lot of the runtime depends on live AI Dungeon behavior, so scenario-driven regression scripts are still the most useful proof surface.

## Active AI Dungeon regression suites

The current `tests/aid-scripts/` directories are:

- `ai-module`
- `sdk-module`
- `scripture-module`
- `clock-module`
- `system-module`
- `network-module`
- `geolocation-module`
- `weather-module`
- `webfetch-module`

Every shipped first-party module now has a dedicated regression suite.

### `tests/aid-scripts/ai-module`

Files:

- `library.js`
- `output-modifier.js`
- `README.md`

Purpose:

- end-to-end validation of the Ultrascripts `ai` module
- validation of alias compatibility through `providerAI`
- request/response envelope behavior
- pending to terminal response flow
- ack cleanup
- dispatcher behavior around bad module names, bad op names, and invalid args
- unsafe replay protection for chat requests

Use this suite when changing:

- `modules/ai/module.js`
- `services/ultrascripts/ops-dispatcher.js`
- `services/ultrascripts/envelope.js`
- registry/heartbeat behavior that affects AI module discovery

### `tests/aid-scripts/scripture-module`

Files:

- `library.js`
- `input-modifier.js`
- `output-modifier.js`
- `README.md`
- `ROADMAP.md`

Purpose:

- behavior-focused validation of the main Scripture module surface
- rendering coverage across widget families
- interaction coverage
- manifest validation behavior
- custom widget sanitization/rendering checks
- transition behavior and edge-case scenarios

Use this suite when changing:

- `modules/scripture/module.js`
- `modules/scripture/renderer.js`
- `modules/scripture/validators.js`
- shared Scripture styles or interaction behavior

### `tests/aid-scripts/sdk-module`

Files:

- `library.js`
- `output-modifier.js`
- `README.md`

Purpose:

- end-to-end validation of the Ultrascripts `sdk` module
- heartbeat discovery of the `sdk` module and its shipped op surface
- request/response behavior on `ultrascripts:in:sdk`
- live inspection of returned SDK payloads directly in story text
- trace-card capture of the same results for easier comparison

Use this suite when changing:

- `modules/sdk/module.js`
- heartbeat payload structure in `services/ultrascripts/core.js`
- version/runtime metadata surfaced through `sdk.version`
- curated BetterDungeon configuration surfaced through `sdk.config`

### `tests/aid-scripts/clock-module`

Files:

- `library.js`
- `output-modifier.js`
- `README.md`

Purpose:

- end-to-end validation of the Ultrascripts `clock` module (10 test steps)
- `now` op with default and custom timezone arguments
- `tz` op for timezone metadata
- `format` op with ISO and custom pattern formatting
- error paths: unknown op, unknown module, invalid args
- heartbeat discovery and request/response envelope lifecycle

Use this suite when changing:

- `modules/clock/module.js`
- timezone handling or formatting logic
- ops-dispatcher request routing

### `tests/aid-scripts/system-module`

Files:

- `library.js`
- `output-modifier.js`
- `README.md`

Purpose:

- end-to-end validation of the Ultrascripts `system` module (7 test steps)
- `info` op covering device, platform, browser, screen, locale, and memory sections
- `power` op covering battery level, charging state, and time estimates
- error paths: unknown op, unknown module
- heartbeat discovery and response shape validation

Use this suite when changing:

- `modules/system/module.js`
- navigator/screen/battery API access patterns
- system metadata collection logic

### `tests/aid-scripts/network-module`

Files:

- `library.js`
- `output-modifier.js`
- `README.md`

Purpose:

- end-to-end validation of the Ultrascripts `network` module (5 test steps)
- `status` op covering online boolean, quality classification, and connection detail
- validates Navigator.connection API surface
- error paths: unknown op, unknown module
- heartbeat discovery and response shape validation

Use this suite when changing:

- `modules/network/module.js`
- connection quality classification logic
- navigator.connection API handling

### `tests/aid-scripts/geolocation-module`

Files:

- `library.js`
- `output-modifier.js`
- `README.md`

Purpose:

- end-to-end validation of the Ultrascripts `geolocation` module (5 test steps)
- `permission` op for checking geolocation permission state (granted/denied/prompt/unavailable)
- `getCurrent` op for position retrieval (latitude, longitude, accuracy, timestamp)
- high-accuracy variant of `getCurrent`
- uses `ok-or-err` expectation pattern for permission-dependent steps
- error paths: unknown op, unknown module

Use this suite when changing:

- `modules/geolocation/module.js`
- browser Geolocation API access patterns
- permission checking logic

### `tests/aid-scripts/weather-module`

Files:

- `library.js`
- `output-modifier.js`
- `README.md`

Purpose:

- end-to-end validation of the Ultrascripts `weather` module (11 test steps)
- `current` op with coordinates, place name, and imperial units
- `forecast` op with coordinates, place name, and imperial units
- validates temperature, units, location, wind, humidity fields
- validates forecast days array with temperatureMax/date
- error paths: missing location, bad place name, unknown op, unknown module
- accounts for network timeouts and geocoding failures

Use this suite when changing:

- `modules/weather/module.js`
- Open-Meteo API integration
- geocoding logic
- unit conversion handling

### `tests/aid-scripts/webfetch-module`

Files:

- `library.js`
- `output-modifier.js`
- `README.md`

Purpose:

- end-to-end validation of the Ultrascripts `webfetch` module (11 test steps)
- `fetch` op with JSON response, HEAD method, and custom headers
- `search` op for web search results
- SSRF protection: localhost and private IP blocking (scheme_blocked/invalid_args)
- uses `ok-or-consent` expectation pattern for consent-dependent steps
- error paths: missing URL, bad HTTP method, missing query, unknown op, unknown module
- accounts for consent broker delays and rate limiting

Use this suite when changing:

- `modules/webfetch/module.js`
- consent management logic
- SSRF guard implementation
- rate limiting behavior
- search provider integration

Interactive Scripture coverage currently lives inside `tests/aid-scripts/scripture-module` rather than in a separate active Ultrascripts doc file. That suite is still the place to verify widget event queue behavior, acknowledgement flow, optimistic interactions, and state round-tripping.

## Example scripts as integration checks

The current `examples/aid-scripts/` directories are:

- `aura-cards`
- `chronos-v2`

These are not formal regression suites, but they are still valuable integration checks because they exercise Ultrascripts the way real scenario authors use it.

### `examples/aid-scripts/aura-cards`

Useful as a live integration check for:

- `ai`
- Scripture-backed UI/state publishing
- mixed state plus ops workflows

### `examples/aid-scripts/chronos-v2`

Useful as a live integration check for:

- `clock`
- `weather`
- Scripture-backed dashboard behavior
- heartbeat/module detection from a real author-style script

## Current coverage picture

Coverage is now comprehensive across all shipped modules:

| Module | Suite | Steps | Key ops tested |
|--------|-------|-------|----------------|
| scripture | `scripture-module` | multi-phase | widgets, interactions, manifest, transitions |
| ai | `ai-module` | multi-step | `chat`, `models`, `testConnection`, alias, replay |
| sdk | `sdk-module` | multi-step | `version`, `config`, heartbeat/SDK separation |
| clock | `clock-module` | 10 | `now`, `tz`, `format` + timezone/pattern variants |
| system | `system-module` | 7 | `info`, `power` + device/screen/battery |
| network | `network-module` | 5 | `status` + online/quality/connection |
| geolocation | `geolocation-module` | 5 | `permission`, `getCurrent` + high accuracy |
| weather | `weather-module` | 11 | `current`, `forecast` + coords/place/units |
| webfetch | `webfetch-module` | 11 | `fetch`, `search` + SSRF guards + consent |

Additional integration coverage through Aura Cards and Chronos V2 example scripts.

## What this means in practice

When changing Ultrascripts today:

- use the dedicated module suite for the module you are changing
- use the Scripture module suite for widget/render/state work
- use the AI module suite for envelope/dispatcher changes
- use Aura Cards and Chronos V2 as realistic integration smoke checks
- run the full suite set when changing core runtime files (core.js, ops-dispatcher.js, envelope.js, write-queue.js)

## Current sign-off history

The implementation sign-offs currently reflected across the Ultrascripts docs are:

| Area | Date | Result |
|---|---:|---|
| Scripture | 2026-04-22 | Live AI Dungeon suite passed 10/10 |
| Full Ultrascripts | 2026-04-22 | Live suite passed, including reload-mid-pending |
| WebFetch | 2026-04-23 | Live suite passed, including denied-origin consent |
| Clock | 2026-04-23 | Live suite passed |
| Weather | 2026-04-23 | Live suite passed |
| Network | 2026-04-24 | Live suite passed |
| System | 2026-04-24 | Live suite passed |
| Provider AI / AI module | 2026-04-26 | Live suite passed |

All modules now have dedicated regression suites in the repo to validate future changes.

## Cleanup policy

- Keep active, high-value suites in the main Ultrascripts doc set.
- Move completed one-off live sign-off artifacts to `archive/` when they stop being part of routine regression work.
- Keep the current repo-facing truth in sync with what actually exists under `tests/aid-scripts/`.
- Do not describe a suite as active or present unless the files are really still in the repo.
