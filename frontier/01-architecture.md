# 01 — Architecture

> This document describes the V2 architecture — Transport + Core + Modules, with both the state channel (Lite profile) and the ops channel (Full profile) as first-class concerns. The ops channel's envelope protocol detail lives in [06 — Full Frontier Protocol](./06-full-frontier-protocol.md); this document covers how Core is structured to service it.

## Three layers, one direction of dependency

```
Modules         ─────────────────────────────────────────►  depend on Core + Transport
Frontier Core   ─────────────────────────────────────────►  depends on Transport
Transport       ─────────────────────────────────────────►  depends on nothing BD-specific
```

- **Transport** has no knowledge of modules or module semantics. It exposes: a subscription stream ("a card changed", "the action list changed"), a mutation-template capture pipeline, and a write queue primitive (`upsertStoryCard`) layered on top of mutation replay. Read-side is lossless; write-side is serialized per card with retry + optimistic echo.
- **Core** has no knowledge of specific modules' semantics. It knows about card prefixes, the current tail / live-count, module lifecycle, and the envelope shape of the ops channel (request/response dispatch, idempotency, GC). Core is split into a state-channel dispatcher (`core.js`), an ops-channel dispatcher (`ops-dispatcher.js`), a heartbeat emitter (`heartbeat.js`), and a module registry (`module-registry.js`).
- **Modules** are built on top of Core. State-only modules declare `stateNames`; ops modules declare `ops`; modules may do both. They don't care how cards move.

## Component responsibilities

### Transport layer

**`services/frontier/ws-interceptor.js`** — page-world script
- Injected at `document_start` with `world: "MAIN"` (Chrome MV3) or via `<script>` tag fallback on platforms where MAIN world isn't available (older Firefox, Android WebView — Phase 0 confirms which).
- Shims `window.WebSocket` using `class extends NativeWebSocket` so Apollo's `instanceof` checks remain valid. A plain function wrapper breaks Apollo silently; we proved this during the Phase 0 hunter experiments.
- Observes GraphQL-over-WebSocket frames with `type` `next` or `data` and surfaces three subscription payloads (see [02 — Protocol: observation channels](./02-protocol.md#ai-dungeon-observation-channels)):
  - `adventureStoryCardsUpdate` — full `storyCards[]` every turn.
  - `contextUpdate` — the upcoming turn's prompt context, including `actionId`.
  - `actionUpdates` — full `actions[]` snapshot on every action mutation, including user-driven edit / undo / rewind / delete.
- Additionally shims `fetch` and `XMLHttpRequest` to capture HTTP-side traffic:
  - GraphQL subscription responses that also travel over HTTP during hydration (e.g. `GetAdventure`) — scanned for `storyCards[]` and `actions[]` to seed initial state.
  - Mutation templates for `SaveQueueStoryCard` and related ops — captured per-op with fully-formed body / headers. These templates are what the write queue replays with deep-overridden variables to perform BD-originated writes without any dedicated GraphQL client. See `services/frontier/ws-interceptor.js` for the capture and `services/ai-dungeon-service.js` for the replay.
- Forwards normalized payloads to the content script via `window.postMessage({ source: 'BD_FRONTIER_WS', kind: 'cards' | 'context' | 'actions' | 'template', payload: ... })`.
- Exposes nothing to page JS beyond the shim itself.
- Idempotent: re-invoking it does nothing if already installed (guarded via a `window.__frontierWsInstalled` flag).

**`services/frontier/ws-stream.js`** — content-script-side service

(Originally named `card-stream.js` in early planning; renamed because it routes four topics — cards, actions, context, templates — not just cards.)

- Listens for `BD_FRONTIER_WS` postMessages of kind `cards`, `context`, or `actions`.
- Maintains four pieces of state:
  - `Map<cardId, card>` of the current adventure's Story Cards.
  - Full `actions[]` array as delivered by `actionUpdates` (undone entries retained — they are the source of truth for history reverts).
  - Current **tail action id**: derived as `max(id where undoneAt === null)`. Never taken solely from `contextUpdate.actionId` because that subscription does not fire on undo / restore / delete / rewind (see [02 — Protocol: event-to-channel matrix](./02-protocol.md#event-to-channel-matrix)).
  - Current **live count**: `actions.filter(a => a.undoneAt === null).length`. This is the ordinal Scripture and other history-keyed modules look up (see [02 — Protocol: live-count history convention](./02-protocol.md#live-count-history-convention)).
- Computes diffs between consecutive card pushes: `{ added, updated, removed }` keyed by card id.
- Emits events consumed by `core.js`:
  - `frontier:cards:full` — full snapshot (on first load + adventure change).
  - `frontier:cards:diff` — diff from previous snapshot.
  - `frontier:actions:change` — raw `actions[]` changed in any way (create / edit / undo / rewind / delete). Consumers that need per-action detail inspect `undoneAt` and `retriedActionId` themselves.
  - `frontier:tail:change` — tail `actionId` moved (forward on normal turns and retry; backward on undo / rewind).
  - `frontier:livecount:change` — **live count** changed. This is the event Scripture subscribes to; its handler re-reads `history[liveCount]` and re-renders widgets. Fires on any operation that changes `actions.filter(!undoneAt).length`: normal turn (+1), continue (+1), undo (−1), rewind (−N), delete (−1), restore (+1). **Does NOT fire on retry** (retry keeps live count stable) or pure edit.
- Provides `writeCard(title, value, fields)` — wraps the write queue which in turn wraps mutation-template replay. Core and ops-dispatcher both use this; modules reach it via `ctx.writeCard`.
- Holds the in-memory enrichment index (`{ cardId: { shortId, contentType, ... } }`) harvested from both mutation inputs and scoped response walks. Used by the write queue to synthesize well-formed replays for cards the page hasn't touched in-session.
- Helpers: `getCurrentActionId()`, `getLiveCount()`, `getActions()`, `isFrontierCard(card)`, `getAllEnrichment()` (debug).

**`services/frontier/write-queue.js`** — write-path coordinator
- Serializes writes per card id (no two mutations in flight to the same card simultaneously).
- Coalesces rapid successive writes to the same card: last-write-wins while a prior request is in flight.
- Retries transient network / 5xx failures with capped exponential backoff.
- Merges optimistic echoes into `state.cards` immediately; reconciles when the real echo arrives over the subscription; rolls back on hard failure.
- Surfaces errors to callers via returned promises.

> **Note:** there is intentionally no text codec, no text-frame stream, and no MutationObserver on the adventure output. Frontier observes cards and actions only.

### Core layer

**`services/frontier/core.js`** — `FrontierCore` class (state-channel dispatcher)
- Subscribes to `frontier:cards:diff` and `frontier:livecount:change` from `ws-stream.js` (modules may opt into `frontier:tail:change` or `frontier:actions:change` if they need finer granularity).
- Identifies card families by title prefix:
  - `frontier:state:<name>` → persistent state published by a script. Routed to the module that declared `stateNames: ['<name>']`.
  - `frontier:heartbeat` → Core's own output. Core ignores incoming changes to it (echo suppression by id or by write-receipt correlation).
  - `frontier:out` → routed to the ops dispatcher (not the state-channel dispatcher). Described below.
  - `frontier:in:<module>` → Core's own output. Core ignores incoming changes to these (echo suppression).
  - Everything else under `frontier:*`, `scripture:*`, `bd:*` → reserved; logged at debug level if encountered.
- Tracks the current live count via `ws-stream.getLiveCount()`. Re-dispatches `onStateChange` to interested modules when the live count changes, so modules can look up a different `history[liveCount]` entry without the state card having changed. (Retry is the special case where the tail id advances but live count does not — modules don't need to re-dispatch on retry alone because the state card itself will change on the next script write, which does fire `frontier:cards:diff`.)
- Maintains the heartbeat loop: writes `frontier:heartbeat` on adventure load, on module enable/disable, and at most once per WS push (coalesced). Heartbeat payload advertises enabled modules + protocol version (see [02 — Protocol](./02-protocol.md#frontierheartbeat)).
- Scoped per adventure: state clears on `detectCurrentAdventure` transition.
- Exposes `registerModule(moduleDef)` API.
- Handles protocol-version negotiation on incoming state cards (unknown `v` → debug warning, skip dispatch).

**What Core does NOT do:**
- Render UI (modules do).
- Hit the network directly (modules with ops do, via their own handlers).
- Persist long-lived module-specific state outside of story cards (modules use `ctx.storage` for small per-module prefs).
- Mediate between modules (inter-module calls are a post-V2 addition).

**`services/frontier/ops-dispatcher.js`** (Full profile)
- Consumes `frontier:cards:diff` filtered to `frontier:out`.
- Parses the envelope, dedupes request ids against its in-memory + `sessionStorage`-mirrored set of already-processed ids, and for each new request: resolves `module.ops[op]`, writes a `pending` response to `frontier:in:<module>` via the write queue, invokes the handler, then writes the terminal response (`ok` / `err` / `timeout`).
- Honors the `acks` array in `frontier:out` by tombstoning matching responses.
- Applies the Core TTL safety net (configurable, default 10 turns) to forgotten responses.
- Full schema / id scheme / idempotency rules in [06 — Full Frontier Protocol](./06-full-frontier-protocol.md).

**`services/frontier/heartbeat.js`**
- Writes `frontier:heartbeat` via the write queue on adventure load, module enable/disable, and at most once per WS push (coalesced).
- Payload schema in [02 — Protocol](./02-protocol.md#frontierheartbeat). In Full profile the `ops` field on each module entry advertises dispatch-able op names.

**`services/frontier/module-registry.js`**
- Keeps the set of registered modules and their enabled/disabled state.
- Persists the enabled map in `chrome.storage.sync` under a single key (e.g. `frontier_enabled_modules`).
- Integrates with `core/feature-manager.js` so the popup's Frontier section reflects module state.
- Designed so future loaders (registry-fetched, sandboxed) register into the same interface without refactoring Core.

### Module layer

A module is an object matching the `FrontierModule` interface documented in [03 — Modules](./03-modules.md). V2 now ships a broad first-party module set covering state rendering, web access, OS-adjacent helpers, and hosted-model calls:

**`modules/scripture/module.js`** — state-only module (reference for the pattern)
- Registers with `FrontierCore`. Declares `stateNames: ['scripture']`, `tracksLiveCount: true`.
- Subscribes to changes on `frontier:state:scripture`. The card holds BOTH the manifest (widget schema) AND the history map (`{ [liveCount]: values }`).
- On state change OR on live-count change, recomputes `values = history[currentLiveCount] ?? fallback(history) ?? manifest-defaults`, then updates widgets in place.
- On manifest change, rebuilds widget DOM accordingly.
- No ops. Pure reader + renderer.

**`modules/scripture/renderer.js`** — widget DOM/CSS
- All widget element creation (`createStatWidget`, `createBarWidget`, etc.) — 9 types.
- Alignment zones (left / center / right), density recalculation, layout monitoring.
- Lifted verbatim from the existing `features/better_scripts_feature.js`.

**`modules/scripture/validators.js`**
- Widget config schema validation.
- HTML/CSS sanitization for the `custom` widget type.

**`modules/webfetch/module.js`** — ops module (reference for two-way)
- Declares `ops: { fetch }`. No `stateNames`.
- `fetch(args, ctx)` performs a background HTTP request: `{ url, method?, headers?, body?, timeoutMs? }` → `{ status, statusText, headers, body }`. Binary bodies base64-encoded.
- Per-origin consent model (see `modules/webfetch/consent.js`) with popup-surfaced allowlist.
- Per-origin rate limits enforced in-handler; excess requests return `err: rate_limit`.
- Scheme allowlist blocks `file://`, `chrome://`, localhost variants.

**`modules/clock/module.js`** — minimal ops module
- Declares `ops: { now, tz, format }`. No consent needed; purely deterministic / local.
- Validates that the ops shape works on a tiny surface area; marketable "scripts now know what time it is" demo.

## File layout

```
BetterDungeon/
├── services/
│   ├── ai-dungeon-service.js          (extended: upsertStoryCard via mutation-template replay + write queue)
│   ├── loading-screen.js              (existing, unchanged)
│   ├── story-card-cache.js            (existing; ws-stream optionally hydrates it, non-breaking)
│   ├── story-card-scanner.js          (existing; migration deferred)
│   └── frontier/
│       ├── ws-interceptor.js          (page-world, document_start; subscriptions + mutation-template capture)
│       ├── ws-stream.js               (content script; cards/actions/templates stream; diff + live-count)
│       ├── write-queue.js             ← NEW (serialized coalesced retrying writes)
│       ├── core.js                    (state-channel dispatcher, adventure scoping)
│       ├── ops-dispatcher.js          ← NEW (frontier:out consumer; ops dispatch; idempotency; GC)
│       ├── envelope.js                ← NEW (request/response schemas, id generator, GC policies)
│       ├── heartbeat.js               ← NEW (coalesced heartbeat writer)
│       └── module-registry.js         ← NEW (registration + enabled-state persistence)
├── modules/                           ← NEW directory
│   ├── scripture/
│   │   ├── module.js                  (state-only; manifest + live-count history)
│   │   ├── renderer.js                (widget DOM/CSS; migrated from better_scripts_feature.js)
│   │   └── validators.js              (widget schema + HTML/CSS sanitization; migrated)
│   ├── webfetch/
│   │   ├── module.js                  ← NEW (ops: fetch)
│   │   └── consent.js                 ← NEW (per-origin allowlist)
│   └── clock/
│       └── module.js                  ← NEW (ops: now, tz, format)
├── features/
│   ├── (better_scripts_feature.js DELETED)
│   └── (others gain an isFrontierCard filter for reserved prefixes)
├── core/
│   └── feature-manager.js             (extended to know about Frontier modules)
├── main.js                            (Frontier bootstrap; module registration; new message handlers)
├── manifest.json                      (MAIN-world entry for ws-interceptor.js; content-script load order; version 2.0.0)
├── popup.html / popup.js              (Frontier master toggle + per-module toggles + WebFetch allowlist UI)
└── styles.css                         (Scripture reuses existing widget CSS; WebFetch consent UI adds a modal)
```

## Cross-component data flow

### Script publishes state (Script → BD)

```
AI Dungeon script, during onOutput:
  - Computes the live-count key: String(history.length + 1)
  - Computes new values for its module (e.g. Scripture widget values)
  - Stores values into state.frontier.scriptureHistory[liveCountKey]
  - Prunes history to historyLimit
  - Writes `frontier:state:scripture` card with { v, manifest, history }
    (writes the card via AID's own addStoryCard/updateStoryCard sandbox APIs —
     the script-side path, unchanged from legacy BetterScripts)
         │
         ▼
AI Dungeon backend pushes `adventureStoryCardsUpdate` over WebSocket
         │
         ▼
ws-interceptor.js captures frame, postMessage to content script
         │
         ▼
ws-stream.js diffs against previous snapshot, emits frontier:cards:diff
         │
         ▼
core.js (state dispatcher) sees `frontier:state:scripture` updated,
looks up the module registered for stateName 'scripture',
dispatches onStateChange(parsed)
         │
         ▼
Scripture module's onStateChange:
  - parsed.manifest → reconcile widget DOM (create/update/remove widgets)
  - parsed.history → cached; values looked up per live-count ordinal
  - Computes values = history[String(Core.liveCount)] ?? nearestEarlier ?? defaults
  - Applies values to widgets
```

### Action mutations (undo / restore / rewind / delete / edit / retry)

```
User hits Undo in AI Dungeon
         │
         ▼
Client sends UpdateActions mutation (fetch). Server flips undoneAt.
         │
         ▼
Server broadcasts actionUpdates over the WebSocket with the full actions[]
(including undone entries). No contextUpdate fires on undo.
         │
         ▼
ws-interceptor.js captures the frame, postMessage kind='actions'
         │
         ▼
ws-stream.js updates its actions[], recomputes:
  - tail     = max(id where undoneAt === null)
  - liveCount = actions.filter(!undoneAt).length
Emits frontier:actions:change always; plus frontier:tail:change and
frontier:livecount:change when those numbers actually moved.
         │
         ▼
core.js on frontier:livecount:change re-dispatches
onStateChange(name, cachedParsed, ctx) to every module with
tracksLiveCount: true, with ctx.liveCount updated.
         │
         ▼
Scripture recomputes values = history[String(ctx.liveCount)]
(with nearest-earlier fallback) and updates widgets in place.

(The state card itself never changed. Only the key BD reads from it did.)

Variants:
 - Restore (redo):  undoneAt cleared -> live count +1 -> same path as undo but
                    BD moves to the higher key.
 - Rewind:          multiple undoneAt flips -> live count drops by N.
 - Delete:          identical to undo on the wire.
 - Edit:            text changes on a live action; live count unchanged;
                    frontier:tail:change and frontier:livecount:change do NOT
                    fire. Widgets stay as they are.
 - Retry:           original gets undoneAt, new action created at tail+1.
                    Live count unchanged (-1 + 1 = 0 net). frontier:tail:change
                    fires; frontier:livecount:change does not. Scripture waits
                    for the next frontier:cards:diff (which fires when the
                    script's next onOutput writes the state card under the
                    unchanged liveCount key) to pick up the new values.
```

### Heartbeat (BD → script)

```
heartbeat.js writes `frontier:heartbeat` via the write queue on:
  - Adventure load
  - Module enable/disable
  - Every N turns as a liveness refresh (default: every turn, coalesced)

Payload (Full profile, abbreviated; full schema in 02-protocol.md):
  {
    v: 1,
    frontier: { version, protocol: 1, profile: 'full' },
    ts: Date.now(),
    tailActionId, liveCount,
    modules: [
      { id: 'scripture', version, stateNames: ['scripture'] },
      { id: 'webfetch',  version, ops: ['fetch'] },
      { id: 'clock',     version, ops: ['now', 'tz', 'format'] }
    ]
  }
```

### Ops dispatch (Full profile: script → BD and back)

```
Script, during any hook:
  - frontierCall('webfetch', 'fetch', { url: 'https://httpbin.org/get' })
    appends { id: '42-webfetch-1', module: 'webfetch', op: 'fetch', args, ts }
    to frontier:out's `requests` array, writes the card.
         │
         ▼
 AID backend broadcasts adventureStoryCardsUpdate with the new frontier:out.
         │
         ▼
 ws-interceptor → ws-stream emits frontier:cards:diff.
         │
         ▼
 ops-dispatcher sees frontier:out changed, parses envelope:
  - For each request id not yet in its processed-set: enqueue for dispatch.
  - For each id in `acks`: tombstone the matching response in frontier:in:webfetch.
         │
         ▼
 For each new request:
  - Write `pending` response to frontier:in:webfetch via write queue.
  - Mirror id to sessionStorage so a BD reload mid-op can recover.
  - Invoke module.ops.fetch(args, ctx). Handler performs the network call.
         │
         ▼
 Handler resolves → ops-dispatcher writes terminal response
  ({ status: 'ok', data: { status: 200, body, headers }, completedAt }).
 Handler rejects → ops-dispatcher writes ({ status: 'err', error }).
 Handler times out → ops-dispatcher writes ({ status: 'timeout' }).
         │
         ▼
 Next turn, script reads frontier:in:webfetch, finds response for id '42-webfetch-1'.
  - Consumes data.
  - Appends id to `acks` in frontier:out on its next write.
         │
         ▼
 ops-dispatcher observes the ack, tombstones the response from frontier:in:webfetch.

(Crash recovery: on BD reload, ops-dispatcher reads sessionStorage,
merges processed ids, and re-dispatches any `pending` responses whose
module declared idempotent: 'safe' — or converts unsafe pending responses
to err: unsafe_replay_blocked. See 06-full-frontier-protocol.md#idempotency.)
```

## Integration with existing BetterDungeon components

### FeatureManager
The Frontier top-level toggle behaves like any other feature: it initializes `services/frontier/` when enabled, tears it down when disabled. Scripture's enable state is stored separately from Frontier's, but Scripture cannot be enabled if Frontier is disabled (Core is its dependency).

### Popup UI
Today: a single "BetterScripts" toggle.
V2: a dedicated "Frontier" tab containing:
- The Frontier master toggle (off → Core + all modules inert).
- A nested list of modules, each with its own toggle and description: Scripture, WebFetch, Clock, Geolocation, Weather, Network, System, and Provider AI.
- A WebFetch permissions sub-panel (per-origin allowlist with allow / deny / revoke controls).
- Provider AI controls for OpenRouter key storage, default model, and connection testing.
- A debug toggle for Frontier Core (replaces `SET_BETTERSCRIPTS_DEBUG`).
- (Future placeholder, not rendered in V2:) "Manage modules…" button for third-party registry browsing.

### Story Card Cache
`services/story-card-cache.js` is currently populated by `story-card-scanner.js` scraping the DOM. In V2 we leave the cache's existing pathway untouched and additionally hydrate it from `ws-stream.js` when it fires. Full migration to ws-stream as the sole source of truth is a post-V2 follow-up.

### Other features that consume story cards
Older Phase 8 planning assumed BetterDungeon would need to hide reserved Frontier cards from story-card UI surfaces. AI Dungeon's updated Story Card UI changed that calculus: cards are now grouped under native collapsible type categories, including custom types. A `frontier` card type naturally appears in its own category, so Phase 8 no longer starts with DOM filtering work.

BetterDungeon features that consume story cards should still avoid treating reserved cards (`frontier:*`, `scripture:*`, `bd:*`) as author content when running analytics, trigger suggestions, or automation logic. That filtering belongs at the data-consumer layer, not as a native Story Card list DOM mutation.

## Why not a WebWorker or iframe?

- Core logic runs in the content script context because it needs synchronous access to `chrome.storage`, `chrome.runtime` messages, and the card stream from the page-world shim via `window.postMessage`. A Worker would add an extra hop for every envelope.
- An iframe would only be needed if we were sandboxing user code. For V2, all module code is first-party and trusted; sandboxed third-party modules are a post-V2 workstream.

## Why not MutationObserver on the Story Cards UI?

- The existing `story-card-scanner.js` already does this and suffers from virtualization, search-box state bugs, and coupling to DOM changes we don't control. The WebSocket stream is lossless, instant, and schema-stable.
- Phase 8 used a temporary DOM observation harness to map AI Dungeon's updated Story Card UI. That diagnostic tool was removed after sign-off; it was never a runtime filtering strategy.
