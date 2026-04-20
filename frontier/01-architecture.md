# 01 — Architecture

> This document describes the MVP (Frontier Lite) architecture. Two-way comms (ops, responses, acks) are a post-MVP extension — noted where relevant but not designed here.

## Three layers, one direction of dependency

```
Modules         ─────────────────────────────────────────►  depend on Core + Transport
Frontier Core   ─────────────────────────────────────────►  depends on Transport
Transport       ─────────────────────────────────────────►  depends on nothing BD-specific
```

- **Transport** has no knowledge of modules or module semantics. It exposes one channel: story cards ("a card changed") plus a dumb write helper for the heartbeat.
- **Core** has no knowledge of specific modules' semantics. It knows about card prefixes, the current action id, and module lifecycle.
- **Modules** are built on top of Core. They subscribe to state-card changes and render / react. They don't care how cards move.

## Component responsibilities

### Transport layer

**`services/frontier/ws-interceptor.js`** — page-world script
- Injected at `document_start` with `world: "MAIN"` (Chrome MV3) or via `<script>` tag fallback on platforms where MAIN world isn't available (older Firefox, Android WebView — Phase 0 confirms which).
- Shims `window.WebSocket` using `class extends NativeWebSocket` so Apollo's `instanceof` checks remain valid. A plain function wrapper breaks Apollo silently; we proved this during the Phase 0 hunter experiments.
- Observes GraphQL-over-WebSocket frames with `type` `next` or `data` and surfaces three subscription payloads (see [02 — Protocol: observation channels](./02-protocol.md#ai-dungeon-observation-channels)):
  - `adventureStoryCardsUpdate` — full `storyCards[]` every turn.
  - `contextUpdate` — the upcoming turn's prompt context, including `actionId`.
  - `actionUpdates` — full `actions[]` snapshot on every action mutation, including user-driven edit / undo / rewind / delete.
- Forwards normalized payloads to the content script via `window.postMessage({ source: 'BD_FRONTIER_WS', kind: 'cards' | 'context' | 'actions', payload: ... })`.
- Exposes nothing to page JS beyond the shim itself.
- Idempotent: re-invoking it does nothing if already installed (guarded via a `window.__frontierWsInstalled` flag).

**`services/frontier/card-stream.js`** — content-script-side service

(Despite the legacy name, this service now routes three subscription topics. It will likely be renamed `ws-stream.js` before Phase 1 ships.)

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
- Provides `writeCard(title, value, fields)` — wraps the GraphQL write path. In MVP, only Core uses this, only for the heartbeat card.
- Helpers: `getCurrentActionId()`, `getLiveCount()`, `getActions()`, `isFrontierCard(card)`.

> **Note:** there is intentionally no text codec, no text-frame stream, and no MutationObserver on the adventure output. Frontier Lite observes cards and actions only.

### Core layer

**`services/frontier/core.js`** — `FrontierCore` class (Lite)
- Subscribes to `frontier:cards:diff` and `frontier:livecount:change` from `card-stream.js` (and optionally `frontier:tail:change` or `frontier:actions:change` if a module opts in to those granularities; no Lite module does).
- Identifies card families by title prefix:
  - `frontier:state:<name>` → persistent state published by a script. Routed to the module that declared `stateNames: ['<name>']`.
  - `frontier:heartbeat` → Core's own output. Core ignores incoming changes to it (echo suppression by id or by write-receipt correlation).
  - Everything else under `frontier:*` → ignored with a debug log (reserved for future Full-Frontier use).
- Tracks the current live count via `card-stream.getLiveCount()`. Re-dispatches `onStateChange` to interested modules when the live count changes, so modules can look up a different `history[liveCount]` entry without the state card having changed. (Retry is the special case where the tail id advances but live count does not — modules don't need to re-dispatch on retry alone because the state card itself will change on the next script write, which does fire `frontier:cards:diff`.)
- Maintains the heartbeat loop: writes `frontier:heartbeat` on adventure load, on module enable/disable, and at most once per WS push (coalesced). Heartbeat payload advertises enabled modules + protocol version (see [02 — Protocol](./02-protocol.md#frontierheartbeat)).
- Scoped per adventure: state clears on `detectCurrentAdventure` transition.
- Exposes `registerModule(moduleDef)` API.
- Handles protocol-version negotiation on incoming state cards (unknown `v` → debug warning, skip dispatch).

**What Core deliberately does NOT do in Lite:**
- No envelope parsing. No request dedup. No ack/TTL. No in-flight request tracking. No op dispatch. These are all Full-Frontier concerns; they arrive in a later phase alongside `frontier:out` / `frontier:in:*` cards.

**`services/frontier/module-registry.js`**
- Keeps the set of registered modules and their enabled/disabled state.
- Persists the enabled map in `chrome.storage.sync` under a single key (e.g. `frontier_enabled_modules`).
- Integrates with `core/feature-manager.js` so the popup's Frontier section reflects module state.
- Designed so future loaders (registry-fetched, sandboxed) register into the same interface without refactoring Core.

### Module layer

A module is an object matching the `FrontierModule` interface documented in [03 — Modules](./03-modules.md). For MVP:

**`modules/scripture/module.js`** — module definition
- Registers with `FrontierCore`. Declares `stateNames: ['scripture']`.
- Subscribes to changes on `frontier:state:scripture`. The card holds BOTH the manifest (widget schema) AND the history map (`{ [liveCount]: values }`).
- On state change OR on live-count change, recomputes `values = history[currentLiveCount] ?? fallback(history) ?? manifest-defaults`, then updates widgets in place.
- On manifest change (new/removed/changed widget definitions), rebuilds widget DOM accordingly. Values come from the history lookup as usual.
- No ops. No outbound traffic. Pure reader + renderer.

**`modules/scripture/renderer.js`** — widget DOM/CSS
- All widget element creation (`createStatWidget`, `createBarWidget`, etc.) — 9 types.
- Alignment zones (left / center / right), density recalculation, layout monitoring.
- Lifted verbatim from the existing `features/better_scripts_feature.js`. Zero behavior change.

**`modules/scripture/validators.js`**
- Widget config schema validation.
- HTML/CSS sanitization for the `custom` widget type.
- Lifted verbatim.

## File layout

```
BetterDungeon/
├── services/
│   ├── ai-dungeon-service.js          (existing, unchanged)
│   ├── loading-screen.js              (existing, unchanged)
│   ├── story-card-cache.js            (existing; card-stream optionally hydrates it, non-breaking)
│   ├── story-card-scanner.js          (existing; migration deferred)
│   └── frontier/                      ← NEW
│       ├── ws-interceptor.js          ← NEW (page-world, document_start; cards + actions)
│       ├── card-stream.js             ← NEW (content script; diff + action-id tracking)
│       ├── core.js                    ← NEW (thin router + heartbeat emitter)
│       └── module-registry.js         ← NEW
├── modules/                           ← NEW directory
│   └── scripture/
│       ├── module.js                  ← NEW (registers with Core; reads manifest + history)
│       ├── renderer.js                ← NEW (widget DOM/CSS; migrated from better_scripts_feature.js)
│       └── validators.js              ← NEW (widget schema + HTML/CSS sanitization; migrated)
├── features/
│   ├── (better_scripts_feature.js DELETED)
│   └── (other features unchanged; story-card consumers gain a frontier:* filter)
├── core/
│   └── feature-manager.js             (extended to know about Frontier modules)
├── main.js                            (update message handlers: SET_BETTERSCRIPTS_DEBUG → SET_FRONTIER_DEBUG, add module toggle messages)
├── manifest.json                      (add MAIN-world content script entry for ws-interceptor.js; update loaded files list)
├── popup.html / popup.js              (update toggles: BetterScripts → Frontier + per-module sub-toggles)
└── styles.css                         (no change expected; Scripture reuses existing widget CSS)
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
         │
         ▼
AI Dungeon backend pushes `adventureStoryCardsUpdate` over WebSocket
         │
         ▼
ws-interceptor.js captures frame, postMessage to content script
         │
         ▼
card-stream.js diffs against previous snapshot, emits frontier:cards:diff
         │
         ▼
core.js sees `frontier:state:scripture` updated, looks up the module
registered for stateName 'scripture', dispatches onStateChange(parsed)
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
card-stream.js updates its actions[], recomputes:
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
Core writes `frontier:heartbeat` card on:
  - Adventure load
  - Module enable/disable
  - Every N turns as a liveness refresh (default: every turn, coalesced)

Payload (simplified for Lite):
  {
    v: 1,
    frontier: { version, protocol: 1 },
    ts: Date.now(),
    tailActionId: <currently-known tail id, for script cross-checking>,
    modules: [
      { id, version, stateNames: ['scripture'] }
    ]
  }
```

## Integration with existing BetterDungeon components

### FeatureManager
The Frontier top-level toggle behaves like any other feature: it initializes `services/frontier/` when enabled, tears it down when disabled. Scripture's enable state is stored separately from Frontier's, but Scripture cannot be enabled if Frontier is disabled (Core is its dependency).

### Popup UI
Today: a single "BetterScripts" toggle.
V2: a collapsible "Frontier" section containing:
- The Frontier master toggle (off → Core + all modules inert).
- A nested list of modules, each with its own toggle. For MVP: just Scripture.
- A debug toggle for Frontier Core (replaces `SET_BETTERSCRIPTS_DEBUG`).
- (Future placeholder, not rendered in MVP:) "Manage modules…" button for the registry UI.

### Story Card Cache
`services/story-card-cache.js` is currently populated by `story-card-scanner.js` scraping the DOM. In the MVP, we leave the cache's existing pathway untouched and additionally hydrate it from `card-stream.js` when it fires. Full migration to card-stream as the sole source of truth happens in a later phase.

### Other features that consume story cards
`trigger_highlight_feature.js`, `story_card_modal_dock_feature.js`, `story_card_analytics_feature.js`, `auto_see_feature.js` — each gains a filter step that excludes `frontier:*` titled cards from their rendered lists. This is a small localized change per feature, centralized via `card-stream.js#isFrontierCard`.

## Why not a WebWorker or iframe?

- Core logic runs in the content script context because it needs synchronous access to `chrome.storage`, `chrome.runtime` messages, and the card stream from the page-world shim via `window.postMessage`. A Worker would add an extra hop for every envelope.
- An iframe would only be needed if we were sandboxing user code (Phase 2+). For MVP, all module code is first-party and trusted.

## Why not MutationObserver on the Story Cards UI?

- The existing `story-card-scanner.js` already does this and suffers from virtualization, search-box state bugs, and coupling to DOM changes we don't control. The WebSocket stream is lossless, instant, and schema-stable.
