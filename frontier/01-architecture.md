# 01 - Architecture

> This document describes Frontier's current architecture as it exists in BetterDungeon today. Frontier is one unified runtime: the same system handles published state cards, heartbeat discovery, and request/response module calls.

## The actual shape of Frontier

Frontier is split into three layers:

```text
Modules        -> depend on Core
Core           -> depends on Transport + write path
Transport      -> observes AI Dungeon traffic and exposes normalized events
```

- Transport watches AI Dungeon's live traffic and turns it into stable Frontier events.
- Core keeps the shared runtime state: current adventure, current tail, current live count, state-card dispatch, heartbeat writes, and module lifecycle.
- Modules sit on top of Core. Some only read state cards. Some expose ops. Some can do both.

There is no separate "Lite" runtime anymore. There is also no split where one architecture is only for state publishing and another is for two-way communication. If a script only wants to publish state, it can. If it wants to call modules and read responses back, it can. The runtime is the same either way.

## Transport

The transport layer is spread across three files:

### `services/frontier/ws-interceptor.js`

This is the page-side interception layer.

- It shims `WebSocket` so BetterDungeon can observe AI Dungeon's GraphQL-over-WebSocket traffic without breaking the app's own checks.
- It also watches `fetch` and `XMLHttpRequest` so Frontier can capture mutation templates and initial hydration data.
- It forwards normalized payloads into the content-script side with `window.postMessage`.
- The important payload families are story cards, actions, context, and captured mutation templates.

This file does not know Frontier module semantics. Its job is observation and normalization.

### `services/frontier/ws-stream.js`

This is the content-script-side stream service.

- It receives the normalized payloads from `ws-interceptor.js`.
- It keeps the current in-memory card map.
- It keeps the current action list.
- It derives the current tail action id.
- It derives the current live count by counting actions that are not undone.
- It emits Frontier DOM events such as:
  - `frontier:cards:full`
  - `frontier:cards:diff`
  - `frontier:actions:change`
  - `frontier:tail:change`
  - `frontier:livecount:change`
  - `frontier:adventure:change`
  - `frontier:mutation:template`

This live-count model is the important historical correction: Frontier's current state is keyed around live count, not around an older action-id-keyed history model.

### `services/frontier/write-queue.js`

This is the shared write coordinator.

- It serializes writes per card id.
- It coalesces rapid repeat writes.
- It handles optimistic local updates.
- It retries transient failures.

Core writes through it, ops responses write through it, and module code reaches it through `ctx.writeCard`.

## Core

Core is mostly implemented in two files:

### `services/frontier/core.js`

This is the main runtime surface that modules consume.

Its current responsibilities are:

- subscribe to the normalized Frontier events emitted by `ws-stream.js`
- track shared runtime state:
  - current adventure id
  - current tail
  - current live count
- parse and dispatch `frontier:state:<name>` cards to the module that declared that state name
- re-dispatch live-count-aware modules when the live count changes, even if the card itself did not change
- write `frontier:heartbeat`
- expose the shared module context API, including:
  - `getState`
  - `getCardByTitle`
  - `getActions`
  - `getTail`
  - `getLiveCount`
  - `writeCard`
  - `storage`
  - structured logging
  - advanced response helpers for ops modules

Important correction: the heartbeat writer lives in `core.js`. There is no separate runtime file named `heartbeat.js` in the current architecture.

The heartbeat currently advertises:

- `frontier.protocol`
- `frontier.enabled`
- `frontier.client`
- `frontier.clientVersion`
- current `turn`
- the mounted module list with each module's `stateNames` and `ops`

It no longer advertises a `profile` field.

### `services/frontier/ops-dispatcher.js`

This is the request/response side of Frontier.

- It watches `frontier:out`.
- It parses request envelopes using `services/frontier/envelope.js`.
- It dedupes request ids.
- It routes each request to the target module op.
- It writes pending and terminal responses to `frontier:in:<module>`.
- It honors `acks`.
- It garbage-collects stale terminal responses based on live-count age.

This is part of the same runtime as state cards. It is not a separate Frontier mode.

### `services/frontier/envelope.js`

This file contains the shared helpers for the request/response envelope:

- envelope parsing
- response helpers
- title helpers
- terminal-response pruning
- version handling

It is a protocol helper, not a dispatcher.

### `services/frontier/module-registry.js`

This owns module registration and enabled state.

- Modules register one definition object.
- The registry persists module enabled state in `chrome.storage.sync` under `frontier_enabled_modules`.
- Built-in modules default to enabled unless their definition says otherwise.
- Third-party-style ids default to disabled.
- When a module is enabled, the registry mounts it, gives it a Core context, replays cached state, and schedules a fresh heartbeat.
- When a module is disabled, the registry tears it down cleanly.

Core owns dispatch. The registry owns lifecycle.

## Modules

Frontier's shipped first-party modules are:

- `scripture`
- `webfetch`
- `clock`
- `sdk`
- `geolocation`
- `weather`
- `network`
- `system`
- `ai`

The pattern is simple:

- A state-reading module declares `stateNames`.
- An ops module declares `ops`.
- A module can do both if needed.

### `modules/scripture/module.js`

Scripture is the reference state module.

- It declares `stateNames: ['scripture']`.
- It declares `tracksLiveCount: true`.
- It reads the `frontier:state:scripture` card.
- It selects values from that card's history using the current live count.
- It rerenders when either the state card changes or the live count changes.

This is the clearest example of why live count matters in the current architecture.

### `modules/webfetch/module.js`

WebFetch is the clearest reference ops module.

- It currently exposes `fetch` and `search`.
- It enforces consent and rate limits.
- It runs through the shared request/response envelope path.

### Other shipped ops modules

- `clock`: `now`, `tz`, `format`
- `sdk`: `version`, `config`
- `geolocation`: `permission`, `getCurrent`
- `weather`: `current`, `forecast`
- `network`: `status`
- `system`: `info`, `power`
- `ai`: `chat`, `models`, `testConnection`

## File layout

```text
BetterDungeon/
|-- services/
|   |-- ai-dungeon-service.js
|   |-- story-card-cache.js
|   |-- story-card-scanner.js
|   `-- frontier/
|       |-- ACTION_IDS.md
|       |-- core.js
|       |-- envelope.js
|       |-- module-registry.js
|       |-- ops-dispatcher.js
|       |-- write-queue.js
|       |-- ws-interceptor.js
|       `-- ws-stream.js
|-- modules/
|   |-- ai/
|   |-- clock/
|   |-- geolocation/
|   |-- network/
|   |-- sdk/
|   |-- scripture/
|   |-- system/
|   |-- weather/
|   `-- webfetch/
|-- features/
|   `-- frontier_feature.js
|-- main.js
|-- background.js
|-- popup.js
`-- styles.css
```

Important correction: `frontier_feature.js` is the BetterDungeon feature wrapper that starts and stops Frontier. The old planning doc shape that treated this as a future concern is no longer accurate.

## How data actually flows

### 1. Script publishes state

```text
Script writes a Frontier state card in AI Dungeon
-> AI Dungeon broadcasts updated story cards
-> ws-interceptor.js captures the traffic
-> ws-stream.js updates its card map and emits cards events
-> core.js parses frontier:state:<name>
-> the matching module receives onStateChange(...)
```

For live-count-aware modules like Scripture, a later undo/rewind can trigger a new render even if the card itself did not change, because the current history key changed.

### 2. Undo, rewind, restore, retry, and edit

```text
AI Dungeon action state changes
-> ws-interceptor.js captures updated actions
-> ws-stream.js recomputes tail + live count
-> core.js updates shared runtime state
-> live-count-aware modules are refreshed when needed
```

The important behavior today:

- undo/restore/rewind/delete can change live count
- retry can change tail without changing live count
- plain edits may change neither

That is why Frontier tracks both tail and live count.

### 3. Heartbeat

```text
Frontier starts or module state changes
-> core.js writes frontier:heartbeat
-> scripts can inspect heartbeat to see protocol version and available modules
```

The heartbeat is the discovery surface for the unified runtime. It is not a profile selector.

### 4. Ops request/response

```text
Script writes a request into frontier:out
-> AI Dungeon broadcasts the updated card
-> ops-dispatcher.js parses the envelope
-> target module handler runs
-> response is written to frontier:in:<module>
-> script reads it and later acks it
```

## Integration with BetterDungeon

### Feature lifecycle

`features/frontier_feature.js` is the wrapper BetterDungeon uses to start and stop Frontier.

- On init, it injects the AI Dungeon service into Core, enables Core, starts the module registry, and starts the ops dispatcher.
- On destroy, it stops the ops dispatcher, stops the registry, and disables Core.

### Popup controls

The popup already has live Frontier controls for:

- Frontier on/off
- per-module toggles
- Frontier debug mode
- WebFetch consent management
- AI module configuration/testing

This is not speculative architecture. It is already part of the shipped BetterDungeon surface.

### Heartbeat versus SDK

The current separation is deliberate:

- `frontier:heartbeat` is the one source of truth for Frontier availability
- the `sdk` module is reserved for BetterDungeon-facing metadata that does not need a second discovery system

That means scripts should inspect heartbeat when they need to know which modules or ops are available, and only call `sdk` when they want BetterDungeon metadata such as version information or curated configuration context.

### Existing story-card systems

`story-card-scanner.js` and `story-card-cache.js` still exist.

Frontier does not require them for its own runtime path, but they still coexist with the broader BetterDungeon codebase. That means the architecture doc should describe coexistence, not pretend the older systems are already gone.

## What this architecture is intentionally not doing

- It is not scraping the Story Card UI as Frontier's source of truth.
- It is not using a separate Lite profile.
- It is not splitting "state publishing Frontier" from "ops Frontier".
- It is not moving module code into a worker or iframe today.

Those may have been planning discussions earlier, but they are not the live Frontier architecture we have now.
