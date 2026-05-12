# 04 - Frontier Test Suites

> This document tracks the Frontier regression surfaces that actually exist today, what each one is for, and where current coverage is still thin.

## Current test surfaces

Frontier currently has two main testing surfaces in the repo:

- dedicated AI Dungeon regression scripts under `BetterDungeon/tests/aid-scripts/`
- example scripts under `BetterDungeon/examples/aid-scripts/` that also serve as real-world integration checks

This is important because Frontier is not validated only through unit-style local checks. A lot of the runtime depends on live AI Dungeon behavior, so scenario-driven regression scripts are still the most useful proof surface.

## Active AI Dungeon regression suites

The current `tests/aid-scripts/` directories are:

- `ai-module`
- `sdk-module`
- `scripture-module`

These are the real, active per-module test suites currently present in the codebase.

### `tests/aid-scripts/ai-module`

Files:

- `library.js`
- `output-modifier.js`
- `README.md`

Purpose:

- end-to-end validation of the Frontier `ai` module
- validation of alias compatibility through `providerAI`
- request/response envelope behavior
- pending to terminal response flow
- ack cleanup
- dispatcher behavior around bad module names, bad op names, and invalid args
- unsafe replay protection for chat requests

Use this suite when changing:

- `modules/ai/module.js`
- `services/frontier/ops-dispatcher.js`
- `services/frontier/envelope.js`
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

- end-to-end validation of the Frontier `sdk` module
- heartbeat discovery of the `sdk` module and its four public ops
- request/response behavior on `frontier:in:sdk`
- live inspection of returned SDK payloads directly in story text
- trace-card capture of the same results for easier comparison

Use this suite when changing:

- `modules/sdk/module.js`
- heartbeat payload structure in `services/frontier/core.js`
- registry fields surfaced through `sdk.modules`
- capability/runtime metadata surfaced through `sdk.capabilities` and `sdk.frontier`

Interactive Scripture coverage currently lives inside `tests/aid-scripts/scripture-module` rather than in a separate active Frontier doc file. That suite is still the place to verify widget event queue behavior, acknowledgement flow, optimistic interactions, and state round-tripping.

## Example scripts as integration checks

The current `examples/aid-scripts/` directories are:

- `aura-cards`
- `chronos-v2`

These are not formal regression suites, but they are still valuable integration checks because they exercise Frontier the way real scenario authors use it.

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

Coverage is strongest in these areas:

- Scripture
- AI module
- SDK module
- core request/response behavior as exercised by the AI suite
- real example-script usage through Aura Cards and Chronos V2

Coverage is weaker in these areas:

- WebFetch
- Clock as a dedicated standalone suite
- Geolocation
- Weather as a dedicated standalone suite
- Network
- System

Those modules are implemented and shipped, but they do not yet have the same dedicated `tests/aid-scripts/<module>/` coverage footprint that Scripture and AI currently have.

## What this means in practice

When changing Frontier today:

- use the Scripture module suite for widget/render/state work
- use the Scripture module suite for queue/ack/coalescing work as well
- use the AI module suite for envelope/dispatcher/AI module changes
- use Aura Cards and Chronos V2 as realistic integration smoke checks

If work touches WebFetch, Clock, Geolocation, Weather, Network, or System heavily, that is a signal that dedicated regression coverage for that module would be worth adding rather than relying only on ad hoc manual checks.

## Current sign-off history

The implementation sign-offs currently reflected across the Frontier docs are:

| Area | Date | Result |
|---|---:|---|
| Scripture | 2026-04-22 | Live AI Dungeon suite passed 10/10 |
| Full Frontier | 2026-04-22 | Live suite passed, including reload-mid-pending |
| WebFetch | 2026-04-23 | Live suite passed, including denied-origin consent |
| Clock | 2026-04-23 | Live suite passed |
| Weather | 2026-04-23 | Live suite passed |
| Network | 2026-04-24 | Live suite passed |
| System | 2026-04-24 | Live suite passed |
| Provider AI / AI module | 2026-04-26 | Live suite passed |

This is useful historical confidence, but it should not be confused with "there is a still-maintained dedicated regression suite for every one of these modules in the repo today." That is not yet true.

## Cleanup policy

- Keep active, high-value suites in the main Frontier doc set.
- Move completed one-off live sign-off artifacts to `archive/` when they stop being part of routine regression work.
- Keep the current repo-facing truth in sync with what actually exists under `tests/aid-scripts/`.
- Do not describe a suite as active or present unless the files are really still in the repo.

## Recommended next testing work

The next useful testing expansion would be dedicated `tests/aid-scripts/` coverage for:

- `webfetch`
- `clock`
- `sdk`
- `geolocation`
- `weather`
- `network`
- `system`

That would bring the per-module testing story in line with the shipped module catalog.
