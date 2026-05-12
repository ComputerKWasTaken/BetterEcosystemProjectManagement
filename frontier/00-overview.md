# 00 - Overview

## Mission

**Frontier** is BetterDungeon's story-card-based bridge between AI Dungeon scripts and extension-side capabilities.

On the script side, Frontier is represented by reserved `frontier:*` story cards that a scenario script can read and write during normal AI Dungeon script hooks. On the BetterDungeon side, Frontier runs continuously in the content script, watches AI Dungeon's live card and action streams, and can perform privileged work on the script's behalf such as network requests, browser capability checks, geolocation, and hosted AI calls.

Frontier is not a single feature toggle in the product sense. It is a small platform made of:

- A transport layer that watches AI Dungeon's WebSocket and captured GraphQL mutation traffic.
- A Core runtime that tracks adventure state, card state, and module lifecycle.
- A module registry containing the shipped Frontier modules.

## Current scope in the codebase

The checked-in BetterDungeon extension currently loads Frontier as part of the main content-script bundle in [manifest.json](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/manifest.json).

The runtime pieces are:

- Transport: [ws-interceptor.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/ws-interceptor.js), [ws-stream.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/ws-stream.js), and [write-queue.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/write-queue.js)
- Core runtime: [core.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/core.js), [module-registry.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/module-registry.js), [ops-dispatcher.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/ops-dispatcher.js), and [envelope.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/frontier/envelope.js)
- Feature lifecycle wrapper: [frontier_feature.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/features/frontier_feature.js)
- Shipped modules: `scripture`, `webfetch`, `clock`, `geolocation`, `weather`, `network`, `system`, and `ai`

## What Frontier does today

Frontier currently provides all of the following:

- Reads full story-card snapshots and diffs from AI Dungeon's live data stream.
- Tracks the current adventure, current tail action, and current live action count.
- Writes reserved Frontier cards back through captured AI Dungeon mutation templates via a serialized write queue.
- Emits a `frontier:heartbeat` card that advertises protocol information and the currently mounted modules.
- Routes `frontier:state:<name>` cards to the modules that declared those state names.
- Processes a two-way request/response channel using `frontier:out` and `frontier:in:<module>` cards.
- Persists module enabled state in extension storage and replays cached state to freshly mounted modules.

This is a live two-way runtime, not a one-way widget-only prototype. In `core.js`, the heartbeat currently writes `profile: "full"` and `protocol: 1`, but that profile value is just metadata now, not a separate architecture tier.

## Three-layer mental model

```text
+--------------------------------------------------------------+
| MODULES                                                      |
|   scripture  webfetch  clock  geolocation  weather           |
|   network  system  ai                                        |
+--------------------------------------------------------------+
| FRONTIER CORE                                                |
|   event bus, state cache, adventure tracking, heartbeat,     |
|   module context, module lifecycle coordination              |
+--------------------------------------------------------------+
| TRANSPORT                                                    |
|   ws-interceptor -> ws-stream -> DOM events                  |
|   mutation template capture -> write queue -> story-card     |
|   writes back into AI Dungeon                                |
+--------------------------------------------------------------+
```

- **Transport** observes AI Dungeon traffic and turns it into a local event stream Frontier can consume.
- **Core** keeps the shared runtime state and gives modules a stable API.
- **Modules** provide concrete capabilities on top of that runtime.

## Data flow

### Script -> BetterDungeon

Scripts communicate state to Frontier by writing reserved story cards such as:

- `frontier:state:scripture`
- `frontier:state:<moduleName>`
- `frontier:out`

`core.js` parses `frontier:state:*` cards as JSON and dispatches them to mounted modules whose `stateNames` include that name.

`ops-dispatcher.js` parses `frontier:out` as the request envelope for module operations.

### BetterDungeon -> Script

BetterDungeon writes its own reserved cards back into the same adventure:

- `frontier:heartbeat`
- `frontier:in:<module>`

`frontier:heartbeat` advertises protocol version, enabled state, BetterDungeon version, current turn, and the currently mounted modules with their exposed ops.

`frontier:in:<module>` cards carry response envelopes for Frontier ops. Scripture also uses `frontier:in:scripture` to store widget interaction events that can be acknowledged by the script on a later turn.

## History model: live count, not action-id keys

The current Frontier widget/history model is based on **live count**, not action-id-keyed history.

`ws-stream.js` derives:

- `tail`: the highest non-undone action id currently present
- `liveCount`: the count of actions whose `undoneAt` is null

`scripture/module.js` then reads widget state from `parsed.history[liveCount]`, with fallback to the nearest earlier numeric entry or the newest available entry.

That means the current expected Scripture payload shape is:

```json
{
  "v": 1,
  "manifest": {
    "widgets": []
  },
  "history": {
    "12": {
      "hp": 75,
      "gold": 120
    },
    "13": {
      "hp": 70,
      "gold": 135
    }
  }
}
```

This differs from older planning language that described action-id-keyed history. The shipped code uses numeric live-count keys for lookups and refreshes modules that declare `tracksLiveCount: true` whenever live count changes.

## Current shipped modules

The checked-in module registry currently loads these built-in modules:

| Module | Purpose | State cards | Ops |
|---|---|---|---|
| `scripture` | Renders script-driven widgets in BetterDungeon | `frontier:state:scripture` | none |
| `webfetch` | Fetches external HTTP/HTTPS resources with consent and limits | none | `fetch`, `search` |
| `clock` | Time and formatting helpers | none | `now`, `tz`, `format` |
| `geolocation` | Browser geolocation helpers | none | `permission`, `getCurrent` |
| `weather` | Open-Meteo current weather and forecast lookups | none | `current`, `forecast` |
| `network` | Connection state hints | none | `status` |
| `system` | Device, display, locale, and power hints | none | `info`, `power` |
| `ai` | Hosted AI calls through user-configured OpenRouter credentials | none | `chat`, `models`, `testConnection` |

All of these modules are registered from files under [BetterDungeon/modules](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/modules).

## Relationship to older BetterDungeon systems

Frontier has clearly replaced the old invisible-text transport ideas in the documentation. The current runtime uses reserved story cards plus AI Dungeon's own subscription/mutation traffic. There is no zero-width-character transport in the Frontier implementation.

At the same time, Frontier does **not** replace every legacy BetterDungeon subsystem yet:

- [story-card-scanner.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/story-card-scanner.js) is still bundled and loaded.
- Frontier coexists with the rest of BetterDungeon's feature manager and popup settings.
- Scripture is implemented as a Frontier module, but it still lives alongside other BetterDungeon features rather than as a standalone product boundary.

## Constraints the implementation is built around

- AI Dungeon scripts are still turn-gated. They only update Frontier state when the script itself runs.
- BetterDungeon is always on while the page is open, so module work can happen between turns.
- Story cards are the persistence substrate for Frontier state and request/response traffic.
- Reserved Frontier card values are expected to be JSON when the runtime parses them.
- Card writes are funneled through `write-queue.js` so writes to the same card title are serialized and coalesced.
- Ops responses are pruned over time. `ops-dispatcher.js` currently keeps terminal responses for up to 10 live-count turns before garbage-collecting them.

## Glossary

| Term | Definition |
|---|---|
| **Frontier** | BetterDungeon's script-to-extension bridge built on reserved story cards plus transport/runtime helpers. |
| **Transport** | The `ws-interceptor` + `ws-stream` + write-queue path that observes AI Dungeon traffic and writes cards back safely. |
| **Frontier Core** | The runtime in `services/frontier/core.js` that tracks adventure state, parses state cards, emits heartbeats, and provides module context. |
| **Module Registry** | The lifecycle manager in `services/frontier/module-registry.js` that registers, mounts, enables, disables, and lists modules. |
| **Ops Dispatcher** | The runtime in `services/frontier/ops-dispatcher.js` that consumes `frontier:out` requests and writes `frontier:in:<module>` responses. |
| **Envelope** | The versioned JSON request/response schema defined in `services/frontier/envelope.js`. |
| **State card** | A reserved `frontier:state:<name>` card whose JSON payload is routed to a module. |
| **Heartbeat card** | The `frontier:heartbeat` card written by Core to advertise runtime status and mounted modules. |
| **Live count** | The number of non-undone actions currently present in the adventure action stream. |
| **Tail action** | The highest current non-undone action id observed in the action stream. |
| **Response card** | A reserved `frontier:in:<module>` card containing response envelopes for module ops. |
| **Reserved Frontier card** | Any story card whose title begins with `frontier:`. |
