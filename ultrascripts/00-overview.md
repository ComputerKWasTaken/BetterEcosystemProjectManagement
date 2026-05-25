# 00 - Overview

## Mission

**Ultrascripts** is BetterDungeon's story-card-based bridge between AI Dungeon scripts and extension-side capabilities.

On the script side, Ultrascripts is represented by reserved `ultrascripts:*` story cards that a scenario script can read and write during normal AI Dungeon script hooks. On the BetterDungeon side, Ultrascripts runs continuously in the content script, watches AI Dungeon's live card and action streams, and can perform privileged work on the script's behalf such as network requests, browser capability checks, geolocation, and hosted AI calls.

Ultrascripts is not a single feature toggle in the product sense. It is a small platform made of:

- A transport layer that watches AI Dungeon's WebSocket and snoops the first successful GraphQL request to capture session credentials (Firebase `Authorization` token + endpoint URL).
- A Core runtime that tracks adventure state, card state, and module lifecycle.
- A module registry containing the shipped Ultrascripts modules.

## Current scope in the codebase

The checked-in BetterDungeon extension currently loads Ultrascripts as part of the main content-script bundle in [manifest.json](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/manifest.json).

The runtime pieces are:

- Transport: [ws-interceptor.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/ws-interceptor.js), [ws-stream.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/ws-stream.js), and [write-queue.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/write-queue.js)
- Core runtime: [core.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/core.js), [module-registry.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/module-registry.js), [ops-dispatcher.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/ops-dispatcher.js), and [envelope.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/ultrascripts/envelope.js)
- Feature lifecycle wrapper: [ultrascripts_feature.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/features/ultrascripts_feature.js)
- Shipped modules: `scripture`, `webfetch`, `clock`, `sdk`, `geolocation`, `weather`, `network`, `system`, and `ai`

## What Ultrascripts does today

Ultrascripts currently provides all of the following:

- Reads full story-card snapshots and diffs from AI Dungeon's live data stream.
- Tracks the current adventure, current tail action, and current live action count.
- Writes reserved Ultrascripts cards back via direct, hardcoded GraphQL `SaveQueueStoryCard` mutations authenticated with the captured session token, all funneled through a serialized write queue.
- Emits a `ultrascripts:heartbeat` card the moment an adventure or scenario loads (turn-0 included), advertising protocol information and the currently mounted modules.
- Routes `ultrascripts:state:<name>` cards to the modules that declared those state names.
- Processes a two-way request/response channel using `ultrascripts:out` and `ultrascripts:in:<module>` cards.
- Persists module enabled state in extension storage and replays cached state to freshly mounted modules.

This is a live two-way runtime, not a one-way widget-only prototype. In `core.js`, the heartbeat writes `protocol: 1` plus BetterDungeon/client metadata and the mounted module list. It no longer uses a profile split.

## Three-layer mental model

```text
+--------------------------------------------------------------+
| MODULES                                                      |
|   scripture  webfetch  clock  sdk  geolocation  weather      |
|   network  system  ai                                        |
+--------------------------------------------------------------+
| ULTRASCRIPTS CORE                                                |
|   event bus, state cache, adventure tracking, heartbeat,     |
|   module context, module lifecycle coordination              |
+--------------------------------------------------------------+
| TRANSPORT                                                    |
|   ws-interceptor -> ws-stream -> DOM events                  |
|   session credentials capture -> direct SaveQueueStoryCard   |
|   GraphQL writes -> write queue -> AI Dungeon backend        |
+--------------------------------------------------------------+
```

- **Transport** observes AI Dungeon traffic and turns it into a local event stream Ultrascripts can consume.
- **Core** keeps the shared runtime state and gives modules a stable API.
- **Modules** provide concrete capabilities on top of that runtime.

## Data flow

### Script -> BetterDungeon

Scripts communicate state to Ultrascripts by writing reserved story cards such as:

- `ultrascripts:state:scripture`
- `ultrascripts:state:<moduleName>`
- `ultrascripts:out`

`core.js` parses `ultrascripts:state:*` cards as JSON and dispatches them to mounted modules whose `stateNames` include that name.

`ops-dispatcher.js` parses `ultrascripts:out` as the request envelope for module operations.

### BetterDungeon -> Script

BetterDungeon writes its own reserved cards back into the same adventure:

- `ultrascripts:heartbeat`
- `ultrascripts:in:<module>`

`ultrascripts:heartbeat` advertises protocol version, enabled state, BetterDungeon version, current turn, and the currently mounted modules with their exposed ops.

`ultrascripts:in:<module>` cards carry response envelopes for Ultrascripts ops. Scripture also uses `ultrascripts:in:scripture` to store widget interaction events that can be acknowledged by the script on a later turn.

## History model: live count, not action-id keys

The current Ultrascripts widget/history model is based on **live count**, not action-id-keyed history.

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
| `scripture` | Renders script-driven widgets in BetterDungeon | `ultrascripts:state:scripture` | none |
| `webfetch` | Fetches external HTTP/HTTPS resources with consent and limits | none | `fetch`, `search` |
| `clock` | Time and formatting helpers | none | `now`, `tz`, `format` |
| `sdk` | Exposes BetterDungeon-facing metadata and safe configuration context that complement heartbeat | none | `version`, `config` |
| `geolocation` | Browser geolocation helpers | none | `permission`, `getCurrent` |
| `weather` | Open-Meteo current weather and forecast lookups | none | `current`, `forecast` |
| `network` | Connection state hints | none | `status` |
| `system` | Device, display, locale, and power hints | none | `info`, `power` |
| `ai` | Hosted AI calls through user-configured OpenRouter credentials | none | `chat`, `models`, `testConnection` |

All of these modules are registered from files under [BetterDungeon/modules](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/modules).

## Relationship to older BetterDungeon systems

Ultrascripts has clearly replaced the old invisible-text transport ideas in the documentation. The current runtime uses reserved story cards plus AI Dungeon's own subscription/mutation traffic. There is no zero-width-character transport in the Ultrascripts implementation.

At the same time, Ultrascripts does **not** replace every legacy BetterDungeon subsystem yet:

- [story-card-scanner.js](/C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web%20Dev/BetterEcosystem/BetterDungeon/services/story-card-scanner.js) is still bundled and loaded.
- Ultrascripts coexists with the rest of BetterDungeon's feature manager and popup settings.
- Scripture is implemented as a Ultrascripts module, but it still lives alongside other BetterDungeon features rather than as a standalone product boundary.

## Constraints the implementation is built around

- AI Dungeon scripts are still turn-gated. They only update Ultrascripts state when the script itself runs.
- BetterDungeon is always on while the page is open, so module work can happen between turns.
- Story cards are the persistence substrate for Ultrascripts state and request/response traffic.
- Reserved Ultrascripts card values are expected to be JSON when the runtime parses them.
- Card writes are funneled through `write-queue.js` so writes to the same card title are serialized and coalesced.
- Ops responses are pruned over time. `ops-dispatcher.js` currently keeps terminal responses for up to 10 live-count turns before garbage-collecting them.

## Glossary

| Term | Definition |
|---|---|
| **Ultrascripts** | BetterDungeon's script-to-extension bridge built on reserved story cards plus transport/runtime helpers. |
| **Transport** | The `ws-interceptor` + `ws-stream` + write-queue path that observes AI Dungeon traffic, captures session credentials, and writes cards back through direct GraphQL mutations. |
| **Base credentials** | The session `{ url, method, headers, capturedAt }` payload (Firebase `Authorization` + GraphQL endpoint) captured by `ws-interceptor.js` from the first successful GraphQL request and broadcast via `ultrascripts:baseCredentials:change`. |
| **Ultrascripts Core** | The runtime in `services/ultrascripts/core.js` that tracks adventure state, parses state cards, emits heartbeats, and provides module context. |
| **Module Registry** | The lifecycle manager in `services/ultrascripts/module-registry.js` that registers, mounts, enables, disables, and lists modules. |
| **Ops Dispatcher** | The runtime in `services/ultrascripts/ops-dispatcher.js` that consumes `ultrascripts:out` requests and writes `ultrascripts:in:<module>` responses. |
| **Envelope** | The versioned JSON request/response schema defined in `services/ultrascripts/envelope.js`. |
| **State card** | A reserved `ultrascripts:state:<name>` card whose JSON payload is routed to a module. |
| **Heartbeat card** | The `ultrascripts:heartbeat` card written by Core to advertise runtime status and mounted modules. |
| **Live count** | The number of non-undone actions currently present in the adventure action stream. |
| **Tail action** | The highest current non-undone action id observed in the action stream. |
| **Response card** | A reserved `ultrascripts:in:<module>` card containing response envelopes for module ops. |
| **Reserved Ultrascripts card** | Any story card whose title begins with `ultrascripts:`. |
