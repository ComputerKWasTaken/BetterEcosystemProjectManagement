# 04 — Implementation Plan

## Release coordination

Frontier is part of **BetterDungeon V2**, which bundles:

1. Frontier system (this plan)
2. Android APK mobile build
3. Firefox Add-ons publication
4. Store page reworks

**Sequencing:**

- **BetterRepository v1.6** ships first (unrelated to Frontier; last major BetterRepository release before a calm period).
- BD V2 implementation then begins. Frontier is the largest single workstream inside V2.
- Frontier does NOT ship independently; it releases with BD V2.

## Phase breakdown

Each phase has an acceptance criterion. A phase is "done" when the criterion is met, verified in a real browser, and committed with a passing build.

### Phase 0 — Pre-work (workspace prep)

- [ ] Create `services/frontier/` and `modules/scripture/` directories with placeholder `.gitkeep` files.
- [ ] Confirm Chrome `world: "MAIN"` behavior on the lowest-supported version; confirm Firefox fallback path.
- [ ] Snapshot the current `better_scripts_feature.js` for easy reference during migration.
- [ ] Clone Robyn's `invisible-unicode-decoder` repo locally; read its test suite and implementation; write a short porting plan identifying:
  - Frame marker codepoints
  - Payload encoding scheme (how bytes become invisible chars)
  - Codec version byte location
  - Any TypeScript-only language features needing translation (enums, type-only imports, etc.)

**Acceptance:** directories exist in git; team decision documented on Firefox fallback (either `world: "MAIN"` works on our supported Firefox min, or we'll inject via `<script>` tag); porting plan committed in `services/frontier/PORT_NOTES.md`.

### Phase 1A — Card transport

**Files:**
- `services/frontier/ws-interceptor.js` (new)
- `services/frontier/card-stream.js` (new)
- `manifest.json` (edit)

**Work:**

1. Write `ws-interceptor.js` as a self-contained IIFE that:
   - Replaces `window.WebSocket` with a wrapper class that calls the original and observes frames.
   - Parses each frame as JSON, looks for the `adventureStoryCardsUpdate` subscription payload AND the (TBD name) output-text subscription payload.
   - Forwards normalized data via `window.postMessage({ source: 'BD_FRONTIER_WS', kind: 'cards' | 'output', payload })`.
   - Is idempotent: re-executing it does nothing if already installed.
2. Write `card-stream.js` as a content-script service:
   - Listens on `window` for `BD_FRONTIER_WS` messages of kind `cards` (validating `event.source === window` and `data.source === 'BD_FRONTIER_WS'`).
   - Maintains `this.cards = new Map()` keyed by card id.
   - On each push: compute diff, emit `frontier:cards:full` (on first push / adventure change) and `frontier:cards:diff` events via a simple EventTarget.
   - Exposes `writeCard(title, value, opts)` — stubbed to log-only for Phase 1A; wired to real GraphQL in Phase 2.
   - Exposes `isFrontierCard(card)` helper.
3. Update `manifest.json`:
   - Add a second entry to `content_scripts` with `"world": "MAIN"`, `"run_at": "document_start"`, `"js": ["services/frontier/ws-interceptor.js"]`, same matches.
   - Add `services/frontier/card-stream.js` to the existing isolated-world content script list (loaded before `main.js`).
   - Add `services/frontier/ws-interceptor.js` to `web_accessible_resources` for Firefox fallback.

**Acceptance:** With the extension loaded on `play.aidungeon.com`, the browser console logs a `frontier:cards:diff` event (with realistic card data) after each turn in an adventure.

### Phase 1B — Text transport

**Files:**
- `services/frontier/text-codec.js` (new, ported from Robyn's `invisible-unicode-decoder`)
- `services/frontier/text-stream.js` (new)
- `manifest.json` (edit: add new files)

**Work:**

1. Port Robyn's `invisible-unicode-decoder` to plain JS:
   - Translate TypeScript sources file-by-file to ES2020 JS. Remove type annotations; preserve logic exactly.
   - Preserve her test fixtures; port her Jest tests to a minimal in-browser or Node-runnable harness. Rerun all tests to confirm byte-level parity.
   - Export `encode(obj)`, `decode(text) -> { frames, cleanText }`, `strip(text)`, `CODEC_VERSION`.
   - Document the port in `services/frontier/PORT_NOTES.md`. Include a pinned upstream commit SHA for future re-porting.
2. Write `text-stream.js` as a content-script service:
   - Listens on `window` for `BD_FRONTIER_WS` messages of kind `output`.
   - As a fallback, installs a MutationObserver on `#gameplay-output` (same target that old BetterScripts used) so text capture works even if the WS interceptor misses an output subscription.
   - For each captured output block, calls `textCodec.decode`, dedups frames by id+hash, emits `frontier:text:frames` events.
   - Exposes `textCodec` module-level for Core and modules.
3. Update `manifest.json` content_scripts list to include `text-codec.js` and `text-stream.js` (both in the isolated world, loaded before `card-stream.js` since Core will depend on both).

**Acceptance:**
- Running the ported test suite passes byte-identically to Robyn's upstream.
- Manually-inserted invisible-char frames in AI Dungeon output are captured, decoded, and emitted as `frontier:text:frames` events in the browser console.

### Phase 2 — Core

**Files:**
- `services/frontier/core.js` (new)
- `services/frontier/module-registry.js` (new)
- `services/ai-dungeon-service.js` (edit: add GraphQL mutation helpers for story-card upsert)
- `card-stream.js` (edit: wire `writeCard` to real GraphQL)

**Work:**

1. Implement GraphQL write path:
   - In `ai-dungeon-service.js` (or a new `services/frontier/graphql-client.js` if the scope feels better isolated), add `upsertStoryCard({ adventureId, title, value, type, keys, id? })`.
   - Uses AI Dungeon's own GraphQL endpoint. Extract auth headers from captured WS frames during Phase 1 if needed.
   - Returns a Promise; retries transient failures with exponential backoff.
2. Implement `FrontierCore`:
   - Singleton with `.instance` accessor.
   - Subscribes to BOTH `frontier:cards:diff` (card transport) and `frontier:text:frames` (text transport).
   - Parses `frontier:out`, `frontier:state:*`, and `frontier:heartbeat` (read-back of own writes ignored) from the card stream.
   - Text frames are parsed directly as envelope batches; same dispatch as card envelopes.
   - Maintains `processedRequestIds: Map<id, ts>` with TTL cleanup. **Shared across transports** so a request id can't double-fire even if the same envelope hits both channels.
   - Routes request envelopes to registered module handlers (transport-agnostic).
   - Provides `FrontierContext` instances to handlers, including `ctx.textEnabled`.
   - Emits heartbeat on adventure load, module enable/disable, and every turn (coalesced — one emit per WS push max). Heartbeat payload includes `transports` block and per-module `defaultTransport` / `textEnabled` fields.
   - Tracks in-flight CARD-TRANSPORT requests per `requestId` with `{ module, op, startTurn, timeoutTurns, lastProgressTurn }`. Text-transport ephemeral envelopes are not tracked (nothing to track).
   - Implements `respond(reqId, partial)` and `emit(...)` — both buffer envelopes per-module and trigger a coalesced `upsertStoryCard` call for `frontier:in:<module>`.
   - Handles ack processing: drops acked responses from in-memory tracking and triggers a prune of the card on next flush.
   - Implements timeout sweep: once per WS push, scan in-flight card-transport requests and auto-error any that exceeded `timeoutTurns`.
3. Implement `module-registry.js`:
   - Registration API: `registerModule(moduleDef)`.
   - Enable/disable persistence: `chrome.storage.sync` key `frontier_enabled_modules`.
   - Per-module text-transport enable: `chrome.storage.sync` key `frontier_module_text_enabled` (map of moduleId → bool).
   - Global text-transport enable: `chrome.storage.sync` key `frontier_text_enabled` (bool, default true).
   - `setEnabled(id, bool)` → calls `module.onDisable` / `onEnable`, updates heartbeat.
   - `setTextEnabled(id, bool)` (per-module) and `setGlobalTextEnabled(bool)` → update heartbeat.
4. Add a stub `_core.echo` op implemented inside Core (no separate module). Mirrors its request payload as a `complete` response. Used for internal testing.
5. Debug mode: `chrome.storage.sync` key `frontier_debug` (migrated from `betterDungeon_betterScriptsDebug`). Exposed via popup message `SET_FRONTIER_DEBUG`.

**Acceptance:** A manually-crafted `frontier:out` card containing `{ module: '_core', op: 'echo', payload: { hello: 'world' } }` produces a `frontier:in:_core` card with a matching `complete` response within one turn, end-to-end, on the real site. Additionally, a text-encoded envelope inserted into adventure output with `{ module: '_core', op: 'echo' }` is routed to the same handler and (since text envelopes don't have a response card) logs via debug mode.

### Phase 3 — Scripture module

**Files:**
- `modules/scripture/module.js` (new)
- `modules/scripture/renderer.js` (new — migrated from `better_scripts_feature.js`)
- `modules/scripture/validators.js` (new — migrated)
- `features/better_scripts_feature.js` (delete)
- `main.js` (edit: remove BetterScripts handlers, add Frontier + Scripture wiring)
- `manifest.json` (edit: remove `features/better_scripts_feature.js`, add `modules/scripture/*` and `services/frontier/*`)

**Work:**

1. Lift widget rendering code from `better_scripts_feature.js`:
   - All `create*Widget` / `updateWidget` / `destroyWidget` methods → `renderer.js`, exposed as a `WidgetRenderer` class.
   - Container creation, zone management, density calculation, layout observers → `renderer.js`.
   - HTML/CSS sanitization → `validators.js`.
   - Preset colors, allowed tags/attrs/styles, etc. → constants at top of `renderer.js`.
   - **Split widget state**: the renderer tracks **structure** (from manifest) and **current values** (from text frames) separately. When only values change, update in place without re-rendering.
2. Write `module.js`:
   - Implements the `FrontierModule` interface.
   - Declares `id: 'scripture'`, `defaultTransport: 'text'`, `usesText: true`, `stateNames: ['scripture']`.
   - `onStateChange('scripture', parsed)` → reconciles widget **structure** against renderer (create/update/destroy widgets; does NOT touch current values).
   - Text-frame handler for `op: 'values'` → applies the values map to existing widgets (`renderer.setValue(widgetId, value)`).
   - If the script sends `op: 'values'` via card transport (because text is disabled), module accepts it with a console warning so users notice the fallback.
   - `ops`: `flashWidget` as a demo of the card-transport request path (fire-and-forget animation).
   - `onEnable`: instantiate `WidgetRenderer`, hydrate manifest from current `frontier:state:scripture` if present, wait for first text frame for values.
   - `onDisable`: tear down renderer, remove container.
   - `onAdventureChange`: clear renderer; re-hydrate manifest.
3. Update `main.js`:
   - Delete `handleSetBetterScriptsDebug`, add `handleSetFrontierDebug`.
   - Add `handleSetFrontierTextEnabled` (global) and `handleSetFrontierModuleTextEnabled` (per-module).
   - Replace `BetterScripts`-named event wiring with Frontier-named equivalents.
4. Update `manifest.json` content_scripts list to include (in load order):
   - `services/frontier/text-codec.js`
   - `services/frontier/text-stream.js`
   - `services/frontier/card-stream.js`
   - `services/frontier/module-registry.js`
   - `services/frontier/core.js`
   - `modules/scripture/validators.js`
   - `modules/scripture/renderer.js`
   - `modules/scripture/module.js`
   - `main.js`

**Acceptance:** A scenario script that pastes the base Frontier Library + Scripture adapter (as documented in `03-modules.md`) and publishes a manifest via `scriptureSetManifest(...)` + values via `scriptureSetValues(...)` each turn renders widgets identically to how BetterScripts renders them today. Pixel-level parity is the goal. Additionally, hitting undo in AI Dungeon reverts the widget VALUES to what they were the previous turn (previously impossible). Structural changes to the manifest do NOT revert on undo — they persist, by design.

### Phase 4 — Feature manager & popup integration

**Files:**
- `core/feature-manager.js` (edit)
- `popup.html` / `popup.js` (edit)
- `main.js` (edit: new message types for module toggles)

**Work:**

1. Feature manager: add Frontier as a managed feature. Its `init` boots `FrontierCore`; its `destroy` tears down Core and all modules. Module enable states are persisted independently.
2. Popup: replace the BetterScripts toggle with a Frontier section:
   - Master toggle: Frontier on/off.
   - **Global "Enable invisible text transport" toggle** (default on). Disables text transport for all modules when off.
   - Nested: Scripture on/off (default: on). For modules that use text, a sub-toggle controls whether THIS module may use text (AND'd with the global toggle).
   - Debug toggle: Frontier debug mode.
   - (Future placeholder, not rendered in MVP:) "Manage modules…" button.
3. Chrome message types:
   - `SET_FRONTIER_DEBUG` (replaces `SET_BETTERSCRIPTS_DEBUG`)
   - `SET_FRONTIER_MODULE_ENABLED` → `{ moduleId, enabled }`
   - `SET_FRONTIER_TEXT_ENABLED` → `{ enabled }` (global)
   - `SET_FRONTIER_MODULE_TEXT_ENABLED` → `{ moduleId, enabled }` (per-module)
   - `GET_FRONTIER_STATE` → returns `{ enabled, globalTextEnabled, modules: [{ id, enabled, textEnabled, version, ... }] }`

**Acceptance:** The popup's Frontier section correctly reflects and controls all toggles (master, per-module, global text, per-module text). Changes persist across page reloads. Heartbeat payload reflects the current settings on every refresh.

### Phase 5 — BD UI filtering

**Files:**
- `features/story_card_modal_dock_feature.js` (edit)
- `features/story_card_analytics_feature.js` (edit)
- `features/trigger_highlight_feature.js` (edit)
- `features/auto_see_feature.js` (edit)

**Work:**

1. Each feature gains a filter step that excludes cards where `isFrontierCard(card) === true`.
2. Centralize the predicate in `card-stream.js` so any future prefix additions are one-file changes.

**Acceptance:** Protocol cards (`frontier:out`, `frontier:in:*`, `frontier:state:*`, `frontier:heartbeat`) do NOT appear in the Story Card Modal Dock, Story Card Analytics, Trigger Highlight list, or Auto-See trigger picker. They DO still appear in AI Dungeon's native Story Card list (out of scope per locked-in decision #7).

### Phase 6 — Documentation & guide rewrite

**Files:**
- `BetterRepository/src/components/guides/BetterScriptsGuide.vue` → rename to `FrontierGuide.vue`
- `BetterRepository/src/components/guides/ScriptureGuide.vue` (new; lifted widget reference from old guide)
- Router / nav references in `BetterRepository/src/router/*`
- `Project Management/docs/01-scripting/api/story-cards-api.md` (edit: add Frontier reserved-prefix section)

**Work:**

1. Restructure `FrontierGuide.vue`:
   - Section 1: Introduction (what is Frontier, the modular vision)
   - Section 2: The Two Transports (card vs text, when to use each, undo/retry semantics)
   - Section 3: Availability Detection (heartbeat, the `frontierIsAvailable` pattern, text-transport checks)
   - Section 4: The Base Library (pasting the snippet, API overview including text helpers + Context Modifier)
   - Section 5: Protocol Reference (envelopes, card families, text frames, multi-turn)
   - Section 6: Writing a Module (placeholder for now — link to 03-modules.md)
   - Section 7: Included Modules → link to Scripture guide
2. Create `ScriptureGuide.vue`:
   - Lift all widget reference material (9 widget types, preview tables).
   - Document the new `scriptureSetManifest` + `scriptureSetValues` split.
   - Explicitly explain the undo/retry behavior and why it works (text transport for values).
   - Drop the original ZW / TagCipher Context Modifier section; replace with the one-line `frontierContextModifier(text)` pattern.
   - Update all code examples to use the Scripture adapter API.
3. Update router entries; update nav/TOC components.
4. Update `story-cards-api.md` with a subsection naming the reserved `frontier:*` prefix and advising scenario authors not to create cards with that prefix manually.

**Acceptance:** The BetterRepository site renders two new guide pages (Frontier Guide + Scripture Guide) with working TOC navigation, correct code blocks, coverage of both transports, and up-to-date Context Modifier guidance.

### Phase 7 — Version bump & release prep

**Files:**
- `manifest.json` (version: `1.2.1` → `2.0.0`)
- `README.md` (BetterDungeon + BetterRepository) — mention Frontier
- `CONTRIBUTING.md` (if it references BetterScripts) — update
- Changelog (wherever it's tracked for BD V2)

**Acceptance:** Manifest version bumped; README & contrib docs reference Frontier; changelog entry written.

## Testing strategy

Since BetterDungeon is a browser extension that depends on AI Dungeon's live backend, we rely on manual testing end-to-end. Add automated coverage where cheap.

### Automated (cheap wins)

- **Envelope dedup logic** — unit test Core's `processedRequestIds` tracker in isolation. Pure function; no DOM.
- **Diff algorithm** — unit test `card-stream.js`'s diff given fixture inputs.
- **Validators** — Scripture's config validator is pure; unit test it.
- **`isFrontierCard` helper** — trivial unit test.

### Manual verification checklist per phase

Each phase's acceptance criterion above defines the manual test. A regression checklist for all phases together:

- [ ] Load an adventure; confirm heartbeat card appears with correct shape.
- [ ] Write a `frontier:out` card manually; confirm Core routes it and responds.
- [ ] Publish `frontier:state:scripture` with widget data; confirm rendering matches the old behavior pixel-by-pixel.
- [ ] Toggle Scripture off in popup; confirm widgets disappear, heartbeat no longer advertises scripture, subsequent state changes are ignored.
- [ ] Toggle Frontier master off; confirm no heartbeat, no card writes, Scripture-published state is ignored.
- [ ] Switch between adventures; confirm widgets reset, heartbeat refreshes for the new adventure.
- [ ] Protocol cards hidden from BD UI lists (visual check).
- [ ] Script-side: `frontierIsAvailable()` returns correct boolean under (a) BD enabled, (b) BD disabled, (c) BD just loaded (no heartbeat yet), (d) stale heartbeat (>2 turns old — force by stopping Core temporarily).
- [ ] Script-side: multi-turn flow with the `_core.echo` op returns a `complete` envelope within one turn; envelope is correctly acked on next turn.

### Smoke harness

Optional but recommended: a minimal harness page or test scenario committed to a private BetterDungeon-test repo containing:

- The base Library snippet + a diagnostic Output Modifier that calls `_core.echo` every turn and logs the round-trip.
- A widget-demo scenario that exercises all 9 Scripture widget types.

## File-by-file change summary

### New files

| Path | Purpose |
|------|---------|
| `services/frontier/ws-interceptor.js` | Page-world WebSocket shim (captures cards AND output text) |
| `services/frontier/card-stream.js` | Content-script story-card stream + GraphQL write helper |
| `services/frontier/text-codec.js` | Invisible-text encoder/decoder (port of Robyn's invisible-unicode-decoder) |
| `services/frontier/text-stream.js` | Content-script text-frame extractor with MutationObserver fallback |
| `services/frontier/core.js` | Frontier Core (routing, dedup, heartbeat, multi-turn state, transport selection) |
| `services/frontier/module-registry.js` | Module registration + enable/disable persistence (incl. text-transport toggles) |
| `services/frontier/PORT_NOTES.md` | Dev notes on the text-codec port (upstream commit SHA, diffs from upstream) |
| `modules/scripture/module.js` | Scripture module definition (dual-transport: manifest card + values text) |
| `modules/scripture/renderer.js` | Widget DOM/CSS (migrated; split structure vs values) |
| `modules/scripture/validators.js` | Widget config + HTML/CSS sanitization (migrated) |
| `Project Management/frontier/*` | These planning docs |

### Modified files

| Path | Change |
|------|--------|
| `manifest.json` | Add MAIN-world content script; update file list; bump version to 2.0.0 |
| `main.js` | Remove BetterScripts handlers; add Frontier handlers |
| `core/feature-manager.js` | Register Frontier as top-level feature |
| `popup.html` / `popup.js` | Replace BetterScripts toggle with Frontier section |
| `services/ai-dungeon-service.js` | Add GraphQL story-card upsert |
| `services/story-card-cache.js` | Optional hydrate from card-stream (non-breaking addition) |
| `features/story_card_modal_dock_feature.js` | Filter `frontier:*` cards |
| `features/story_card_analytics_feature.js` | Filter `frontier:*` cards |
| `features/trigger_highlight_feature.js` | Filter `frontier:*` cards |
| `features/auto_see_feature.js` | Filter `frontier:*` cards |
| `BetterRepository/src/components/guides/BetterScriptsGuide.vue` | Rename → `FrontierGuide.vue` + restructure |
| `BetterRepository/src/router/*` | Update routes |
| `Project Management/docs/01-scripting/api/story-cards-api.md` | Add Frontier reserved-prefix section |

### Deleted files

| Path | Rationale |
|------|-----------|
| `features/better_scripts_feature.js` | Fully superseded by `modules/scripture/*` + `services/frontier/*` |

## Out-of-MVP, tracked for later

1. **Schema compression for text transport** — declare per-widget field types in the manifest card; tightly-pack values in text frames (protobuf-style). Dramatically shrinks text footprint. Requires a schema DSL and codec-version bump to `v: 2`.
2. **`story-card-scanner.js` migration** — replace DOM scrape with card-stream as source of truth.
3. **Real GraphQL client robustness** — auth token capture, endpoint discovery, CSRF handling. MVP uses a simple version that works on the current site structure; hardening comes later.
4. **Real capability modules** — WebFetch, Clock, Geolocation, LocalAI, etc. Each is its own PR.
5. **Registry UI** — browse + install vetted third-party modules.
6. **Sandboxed user scripts** — arbitrary JS modules in an iframe/Worker.
7. **Inter-module calls** — modules invoking other modules via Core.
8. **Richer popup UI** — per-module debug toggles, request inspector, envelope log viewer.
9. **Upstream tracking** for Robyn's codec — process for pulling her improvements into our port (tag-based release notifications, re-port runbook).

All of these slot into the existing architecture without refactoring Core or the protocol.
