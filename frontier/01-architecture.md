# 01 — Architecture

## Three layers, one direction of dependency

```
Modules         ─────────────────────────────────────────►  depend on Core + Transport
Frontier Core   ─────────────────────────────────────────►  depends on Transport
Transport       ─────────────────────────────────────────►  depends on nothing BD-specific
```

- **Transport** has no knowledge of envelopes, modules, or heartbeats. It exposes two channels: story cards ("a card changed" / "write a card") and invisible text ("these chars appeared in adventure output" / "encode these chars into output we're emitting").
- **Core** has no knowledge of specific modules' semantics. It knows about envelopes, routing, dedup, transport selection, and module lifecycle.
- **Modules** are built on top of Core. They register handlers, publish state, and optionally declare a default transport. They don't care how bytes move — Core routes for them.

## Component responsibilities

### Transport layer

#### Story-card channel

**`services/frontier/ws-interceptor.js`** — page-world script
- Injected at `document_start` with `world: "MAIN"` (Chrome MV3) or via `<script>` tag fallback (older Firefox).
- Shims `window.WebSocket` to observe every frame.
- Identifies frames carrying `adventureStoryCardsUpdate` in the GraphQL subscription response.
- Also forwards AI-Dungeon output text frames (for text-transport decoding). Exact subscription/event names TBD during Phase 1 instrumentation; anything carrying the current turn's output text is in scope.
- Forwards normalized payloads to the content script via `window.postMessage({ source: 'BD_FRONTIER_WS', kind: 'cards' | 'output', payload: ... })`.
- Exposes nothing to page JS beyond the shim itself.

**`services/frontier/card-stream.js`** — content-script-side service
- Listens for `BD_FRONTIER_WS` postMessages of kind `cards`.
- Maintains an authoritative `Map<cardId, card>` of the current adventure's Story Cards.
- Computes diffs between consecutive WS pushes: `{ added, updated, removed }`.
- Emits events consumed by `core.js`:
  - `frontier:cards:full` — full snapshot (on first load + adventure change)
  - `frontier:cards:diff` — diff from previous snapshot
- Exposes the card state synchronously for Core and any future consumers (scanner migration).
- Provides `writeCard(title, value, fields)` — wraps the GraphQL write path. Used by Core for heartbeat and inbound responses.
- Helper: `isFrontierCard(card)` for UI-filtering consumers.

#### Invisible-text channel

**`services/frontier/text-codec.js`** — encoder/decoder ported from Robyn's `invisible-unicode-decoder`
- Pure, module-agnostic. No BD or AI-Dungeon dependencies.
- Exports:
  - `encode(obj) → string` — encodes a JSON-serializable object as an invisible-Unicode frame (frame markers + encoded payload).
  - `decode(text) → { frames: unknown[], cleanText: string }` — extracts all Frontier frames from an arbitrary text blob, returns the decoded frames and the text with all Frontier-owned invisible chars removed.
  - `strip(text) → string` — cheap stripper for use in the Context Modifier; same as `decode(...).cleanText` without the parse.
- Frame format and character set are whatever Robyn's upstream defines; the port preserves her encoding precisely so frames written by her reference implementations are decoded correctly.
- Carries a codec-version byte in the frame so future re-ports can stay compatible.
- Exposed to modules via `FrontierContext.text` helpers; Core uses it directly.

**`services/frontier/text-stream.js`** — content-script-side service
- Listens for `BD_FRONTIER_WS` postMessages of kind `output` (and a MutationObserver fallback on `#gameplay-output` for robustness).
- For each new output block, runs `textCodec.decode` to extract Frontier frames.
- Dedups frames by an embedded `turn` or frame id (the decoder attaches a hash) so re-observations of the same block don't re-fire.
- Emits `frontier:text:frames` events with the decoded envelope list.
- Also maintains a per-turn outbound buffer: Core calls `textStream.queue(envelope)` during handler execution (for BD → script text writes, if any module ever needs that), but in MVP Core only *reads* text frames; text-transport writes are purely the script's job.

### Core layer

**`services/frontier/core.js`** — `FrontierCore` class
- Subscribes to `frontier:cards:diff` (card transport) AND `frontier:text:frames` (text transport) events.
- **Card path:** identifies card families by title prefix:
  - `frontier:out` → inbound request queue from the script (card transport)
  - `frontier:state:*` → persistent state published by the script (module-specific semantics)
  - `frontier:in:*` → response queue we ourselves wrote (used mostly for ack reconciliation)
  - `frontier:heartbeat` → our own output; we write it, we ignore incoming changes to it
- **Text path:** every decoded text frame is an envelope. Unified envelope shape with card-transport envelopes; Core routes both identically once parsed.
- Parses envelopes, dedups by `id` (shared dedup set across transports), routes to module handlers.
- **Transport selection** for outbound (BD → script): by default, Core writes responses via card transport (`frontier:in:<module>`). Modules can override via `ctx.respond(id, { transport: 'text' })` — though MVP expects almost all BD-side responses to use card transport since text-transport writes require coordinating with the next turn's output, which BD doesn't own.
- Maintains the heartbeat loop: writes `frontier:heartbeat` on adventure load, on module enable/disable, and on a periodic interval or on every WS turn (whichever is cheaper). Heartbeat payload advertises which transports are enabled globally + per-module.
- Tracks in-flight multi-turn requests: `Map<reqId, { module, op, startTurn, status, lastEmittedTurn, sourceTransport }>`.
- Scoped per adventure: state clears on `detectCurrentAdventure` transition.
- Exposes `registerModule(id, moduleDef)` API.
- Handles protocol-version negotiation (reject unknown `v` in envelopes with a structured error).

**`services/frontier/module-registry.js`**
- Keeps the set of registered modules and their enabled/disabled state.
- Persists the enabled map in `chrome.storage.sync` under a single key (e.g. `frontier_enabled_modules`).
- Integrates with `core/feature-manager.js` so the popup's Frontier section reflects module state.
- Designed so future loaders (registry-fetched, sandboxed) register into the same interface without refactoring Core.

### Module layer

A module is an object matching the `FrontierModule` interface documented in [03 — Modules](./03-modules.md). For MVP:

**`modules/scripture/module.js`** — module definition
- Registers with `FrontierCore`. Declares `defaultTransport: 'text'` for its value envelopes.
- Subscribes to changes on `frontier:state:scripture` (the widget **manifest** — schema-only, rarely changes: ids, types, labels, colors, zones).
- Listens for `frontier:text:frames` envelopes targeting `scripture` with `op: 'values'` — these carry the per-turn dynamic data (current HP, current gold, etc.) and are what reverts naturally on undo/retry.
- Reconciles: manifest change → rebuild widget DOM; values change → update live values in existing widgets. No re-render when only values change.
- Also accepts card-transport request envelopes via `frontier:out` for on-demand operations (e.g. `op: 'flashWidget'` for animations).

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
│   ├── story-card-cache.js            (existing; consumed by card-stream in follow-up work)
│   ├── story-card-scanner.js          (existing; migration deferred)
│   └── frontier/                      ← NEW
│       ├── ws-interceptor.js          ← NEW (page-world, document_start)
│       ├── card-stream.js             ← NEW (content script, card transport)
│       ├── text-codec.js              ← NEW (port of Robyn's invisible-unicode-decoder)
│       ├── text-stream.js             ← NEW (content script, text transport)
│       ├── core.js                    ← NEW
│       └── module-registry.js         ← NEW
├── modules/                           ← NEW directory
│   └── scripture/
│       ├── module.js                  ← NEW (registers with Core; declares defaultTransport)
│       ├── renderer.js                ← NEW (migrated from better_scripts_feature.js)
│       └── validators.js              ← NEW (migrated)
├── features/
│   ├── (better_scripts_feature.js DELETED)
│   └── (other features unchanged)
├── core/
│   └── feature-manager.js             (extended to know about Frontier modules)
├── main.js                            (update message handlers: SET_BETTERSCRIPTS_DEBUG → SET_FRONTIER_DEBUG, add module + text-transport toggle messages)
├── manifest.json                      (add MAIN-world content script entry for ws-interceptor.js; update loaded files list)
├── popup.html / popup.js              (update toggles: BetterScripts → Frontier + Scripture sub-toggle + global invisible-text toggle)
└── styles.css                         (no change expected; Scripture reuses existing widget CSS)
```

## Cross-component data flow

### Inbound via card transport (Script → BD)
```
AI Dungeon script writes `frontier:out` card (during onOutput)
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
core.js sees `frontier:out` updated, parses envelopes, dedups by id
         │
         ▼
For each envelope: looks up module by `module` field, invokes handler
         │
         ▼
Module handler processes request (sync or kicks off async work)
```

### Inbound via text transport (Script → BD, ephemeral)
```
AI Dungeon script encodes envelope(s) via textCodec.encode(...) during onOutput,
concatenates the invisible-char frame onto the output text it returns
         │
         ▼
AI Dungeon backend emits the combined text to the player's UI and back-channel
         │
         ▼
ws-interceptor.js (or MutationObserver fallback) captures the output block
         │
         ▼
text-stream.js decodes Frontier frames via textCodec.decode(),
dedups by frame hash, emits frontier:text:frames
         │
         ▼
core.js receives frames (same envelope shape as card path),
dedups by id against shared set, routes to module handlers
         │
         ▼
Module handler processes. No ack path — if the user undoes the turn,
the text block (and its frames) vanishes, and Core's dedup set will
re-accept a new frame if the script re-emits on a replayed turn.
```

### Outbound via card transport (BD → Script)
```
Module calls ctx.respond(reqId, payload) or ctx.emit(...)
         │
         ▼
Core appends envelope to in-memory `frontier:in:<module>` queue
         │
         ▼
Core batches queued envelopes + issues GraphQL UpdateStoryCard mutation
         │
         ▼
AI Dungeon backend accepts, broadcasts update
         │
         ▼
(Eventually) Script reads storyCards array on its next hook run,
finds the frontier:in:<module> card, dedups consumed envelopes by id,
processes fresh ones, writes ack ids into its next `frontier:out`
```

### Outbound via text transport (BD → Script)

Not used in MVP. BD cannot insert text into the player's adventure history; the only way a BD-originated envelope could reach the script via text is if it were piggy-backed onto something the user types, which is out of scope. MVP uses card transport for all BD-side writes.

### Heartbeat
```
Core writes `frontier:heartbeat` card on:
  - Adventure load
  - Module enable/disable
  - Every N turns as a liveness refresh (default: every turn)
Payload: { v: 1, ts: Date.now(), modules: [{ id, version, ops: [...] }] }
```

## Integration with existing BetterDungeon components

### FeatureManager
The Frontier top-level toggle behaves like any other feature: it initializes `services/frontier/` when enabled, tears it down when disabled. Scripture's enable state is stored separately from Frontier's, but Scripture cannot be enabled if Frontier is disabled (Core is its dependency).

### Popup UI
Today: a single "BetterScripts" toggle.
V2: a collapsible "Frontier" section containing:
- The Frontier master toggle.
- A global "Enable invisible text transport" toggle (default on). When off, text transport is disabled for every module regardless of per-module preference.
- A nested list of modules, each with its own module toggle AND (for modules that use text transport) a per-module invisible-text sub-toggle. Hierarchical: global=off disables everything; global=on defers to per-module.
- A debug toggle for Frontier Core (replaces `SET_BETTERSCRIPTS_DEBUG`).
- (Future) A "Manage modules…" button for the registry UI.

### Story Card Cache
`services/story-card-cache.js` is currently populated by `story-card-scanner.js` scraping the DOM. In the MVP, we leave the cache's existing pathway untouched and additionally hydrate it from `card-stream.js` when it fires. Full migration to card-stream as the sole source of truth happens in a later phase.

### Other features that consume story cards
`trigger_highlight_feature.js`, `story_card_modal_dock_feature.js`, `story_card_analytics_feature.js`, `auto_see_feature.js` — each gains a filter step that excludes `frontier:*` titled cards from their rendered lists. This is a small localized change per feature, centralized via `card-stream.js#isFrontierCard`.

## Why not a WebWorker or iframe?

- Core logic runs in the content script context because it needs synchronous access to `chrome.storage`, `chrome.runtime` messages, and the card stream from the page-world shim via `window.postMessage`. A Worker would add an extra hop for every envelope.
- An iframe would only be needed if we were sandboxing user code (Phase 2+). For MVP, all module code is first-party and trusted.

## Why not MutationObserver on the Story Cards UI?

- The existing `story-card-scanner.js` already does this and suffers from virtualization, search-box state bugs, and coupling to DOM changes we don't control. The WebSocket stream is lossless, instant, and schema-stable.
