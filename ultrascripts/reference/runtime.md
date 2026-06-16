# Runtime Reference

## Architectural Shape

Ultrascripts is one unified runtime. The same runtime handles state cards,
heartbeat discovery, and two-way module operations.

```text
Modules        depend on Core
Core           depends on Transport and the write path
Transport      observes AI Dungeon and exposes normalized events
Write path     writes Ultrascripts cards back to AI Dungeon
```

There is no Lite profile, Full profile, separate one-way mode, or separate
two-way runtime. A script can use only state publishing, only ops, or both.

## File Map

```text
../../../BetterDungeon/
|-- services/
|   |-- ai-dungeon-service.js
|   |-- ultrascripts/
|   |   |-- ACTION_IDS.md
|   |   |-- core.js
|   |   |-- envelope.js
|   |   |-- module-registry.js
|   |   |-- ops-dispatcher.js
|   |   |-- write-queue.js
|   |   |-- ws-interceptor.js
|   |   `-- ws-stream.js
|-- modules/
|   |-- ai/
|   |-- clock/
|   |-- geolocation/
|   |-- network/
|   |-- sdk/
|   |-- widget/
|   |-- system/
|   |-- weather/
|   `-- webfetch/
|-- features/
|   `-- ultrascripts_feature.js
|-- background.js
|-- main.js
|-- manifest.json
|-- popup.js
`-- popup.html
```

Legacy BetterDungeon services such as `story-card-cache.js` and
`story-card-scanner.js` still exist for the broader extension. Ultrascripts does
not depend on them as its source of truth.

## Transport Layer

### `ws-interceptor.js`

Runs in the page context and observes AI Dungeon traffic.

Responsibilities:

- shim `WebSocket` so BetterDungeon can observe GraphQL-over-WebSocket traffic
- observe `fetch` and `XMLHttpRequest` where needed for hydration and
  credentials capture
- normalize Story Card, action, context, adventure, and credentials payloads
- post normalized messages back to the content-script side
- capture `baseCredentials`: GraphQL endpoint URL, method, headers, and
  captured timestamp

Boundaries:

- it does not know module semantics
- it does not parse Ultrascripts state
- it does not build mutation templates
- it does not wait for user-initiated Story Card edits

### `ws-stream.js`

Runs in the content script and converts page messages into stable local state.

Responsibilities:

- maintain the current card map
- maintain the current action map
- derive `tail`
- derive `liveCount`
- track the current adventure short id
- retain the latest captured `baseCredentials`
- emit DOM events consumed by Core

Important emitted events:

- `ultrascripts:cards:full`
- `ultrascripts:cards:diff`
- `ultrascripts:actions:change`
- `ultrascripts:tail:change`
- `ultrascripts:livecount:change`
- `ultrascripts:adventure:change`
- `ultrascripts:baseCredentials:change`

## Write Path

All Ultrascripts-owned writes funnel through the write queue, which calls
`AIDungeonService.upsertStoryCard()`.

### `write-queue.js`

Responsibilities:

- serialize writes per card title/id
- coalesce rapid repeated writes
- apply optimistic local updates
- retry transient failures
- use the injected write function from `ai-dungeon-service.js`

The queue is used by:

- heartbeat writes
- ops response writes
- Widget interaction inbox writes
- module writes through `ctx.writeCard`

### Production Mutation

The current write path uses a direct, hardcoded GraphQL mutation:

```graphql
mutation SaveQueueStoryCard($input: UpdateStoryCardInput!) {
  updateStoryCard(input: $input) {
    success
    message
    storyCard {
      id
      type
      title
      description
      keys
      value
      useForCharacterCreation
      updatedAt
      __typename
    }
    __typename
  }
}
```

Key details:

- operation name: `SaveQueueStoryCard`
- resolver field: `updateStoryCard`
- input type: `UpdateStoryCardInput!`
- authentication: captured `baseCredentials`
- Story Card type for production Ultrascripts cards: `Ultrascripts`

This replaced the old snoop-and-replay mutation-template approach. Do not
reintroduce mutation-template priming or fallback guessed mutations.

## Core Runtime

### `core.js`

Core is the runtime surface that modules consume.

Responsibilities:

- subscribe to `ws-stream.js` DOM events
- track adventure id, tail, live count, and card hydration
- parse `ultrascripts:state:<name>` card values as JSON
- cache parsed state by state name
- dispatch state changes to mounted modules
- re-dispatch cached state to `tracksLiveCount` modules when live count changes
- expose the scoped module context
- write `ultrascripts:heartbeat`
- coordinate heartbeat updates when modules mount/unmount or live count changes

Core owns dispatch and shared runtime state. It does not own module enablement
preferences; the registry does.

### Heartbeat

The heartbeat card is the discovery surface:

```json
{
  "ultrascripts": {
    "protocol": 1,
    "enabled": true,
    "client": "BetterDungeon",
    "clientVersion": "2.0.0"
  },
  "turn": 12,
  "modules": [
    {
      "id": "clock",
      "version": "1.0.0",
      "stateNames": [],
      "ops": ["now", "tz", "format"]
    }
  ],
  "writtenAt": "2026-06-06T20:00:00.000Z"
}
```

Heartbeat rules:

- discovery belongs here, not in `sdk`
- the module list includes mounted modules only
- each module advertises state names and ops
- `turn` mirrors live count
- there is no `profile` field
- duplicate heartbeat cards are archived under `ultrascripts:archived:heartbeat:<id>`

### `module-registry.js`

Owns module definitions and lifecycle.

Responsibilities:

- register and unregister module definitions
- support aliases only when a module deliberately declares them
- persist enabled-state preferences under `ultrascripts_enabled_modules`
- default first-party module ids to enabled
- default dotted third-party-style ids to disabled
- mount enabled modules with scoped contexts
- call lifecycle hooks
- replay cached state to newly mounted state modules
- schedule heartbeat updates when the mounted module set changes

### `ops-dispatcher.js`

Owns request/response routing.

Responsibilities:

- watch `ultrascripts:out`
- normalize the v1 request envelope
- process response acknowledgements
- route requests to module op handlers
- write pending responses
- write terminal `ok`, `err`, or `timeout` responses
- block unsafe replay where appropriate
- garbage-collect stale terminal responses by live-count age

The dispatcher treats op handlers as plain async boundaries: return serializable
data for success, throw structured errors for failures.

### `envelope.js`

Owns pure protocol helpers:

- request normalization
- response envelope normalization
- response-card title helpers
- pending/ok/error response builders
- error normalization
- terminal-response pruning

This file deliberately has no module or DOM dependencies.

## Runtime Flows

### Adventure Load And Heartbeat

```text
AI Dungeon page loads or adventure changes
-> ws-interceptor captures hydration/traffic
-> ws-stream emits adventure and cards events
-> ws-interceptor captures baseCredentials
-> ws-stream emits baseCredentials change
-> Core waits for card hydration plus credentials
-> Core writes or updates ultrascripts:heartbeat through write-queue
```

The heartbeat can be written at turn 0. It does not require the player to edit a
Story Card first.

### State Card Dispatch

```text
Script writes ultrascripts:state:widget
-> AI Dungeon broadcasts card update
-> ws-stream emits card diff
-> Core parses JSON and caches state
-> Core dispatches to Widget because stateNames includes "widget"
-> Widget renders history[liveCount] with fallback behavior
```

For live-count-aware modules, Core can call `onStateChange` again without a card
change when live count changes.

### Ops Request/Response

```text
Script writes request batch into ultrascripts:out
-> ops-dispatcher normalizes the envelope
-> dispatcher writes pending response
-> dispatcher invokes module op
-> dispatcher writes terminal response to ultrascripts:in:<module>
-> script reads response on a later turn
-> script acknowledges consumed response ids through ultrascripts:out.acks
```

### Widget Interactions

```text
Player interacts with a widget
-> Widget queues a widget event
-> Widget writes widgetEvents to ultrascripts:in:widget
-> script reads events on a later turn
-> script updates its own state
-> script advances interactions.ackSeq in ultrascripts:state:widget
-> Widget prunes acknowledged events
```

Widget-event acknowledgement is separate from ops response acknowledgement.

## BetterDungeon Integration

### Feature Lifecycle

`features/ultrascripts_feature.js` starts and stops the runtime.

On init:

- injects `AIDungeonService` into Core and the write queue
- enables Core
- starts the module registry
- starts the ops dispatcher

On destroy:

- stops the dispatcher
- stops the registry
- disables Core

### Popup And Background

The popup and background surfaces already support:

- Ultrascripts master toggle
- per-module toggles
- debug toggle
- WebFetch consent state
- AI status/query contract module toggle
- SDK background config snapshots

### Supported Platforms

Current supported surfaces:

- Chromium extension
- Gecko/Firefox extension path
- BetterDungeon Android WebView

iOS remains out of scope because there is no suitable extension/WebView surface
for this runtime.

## Architectural Non-Goals

Do not plan current work around these unless a new project explicitly reopens
them:

- scraping the Story Card UI as the source of truth
- using invisible characters as a transport
- splitting the runtime into Lite and Full profiles
- moving modules into a worker or iframe
- exposing user-authored modules through a public registry UI
- exposing private credentials to AI Dungeon scripts
- replacing every older BetterDungeon Story Card consumer before V2
