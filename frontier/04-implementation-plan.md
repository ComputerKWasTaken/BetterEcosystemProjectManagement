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

### Phase 0 — Pre-work (workspace prep + action-ID investigation)

**Why separate:** the entire design rests on the assumption that AI Dungeon action ids are stable across retry/edit/continue. Verify that BEFORE writing any code.

**Work:**

1. Set up a scratch scenario with a minimal Output Modifier that logs `history.map(h => h.id)` on every turn. Also log `info.actionCount`.
2. Manually walk through a matrix of operations:
   - Normal forward progression → new ids appended.
   - **Undo** → does the dropped tail keep its id if redone, or get a new one? (Do undo/redo a few times; note whether ids are preserved.)
   - **Retry** → does the tail get a new id, or does the old one stay and the text change?
   - **Continue** → does a new action get a new id, or does the previous tail extend?
   - **Edit in place** → does the edited action keep its id?
   - **Refresh the page** → do ids persist in history?
   - **Multiple adventures loaded in different tabs** → are ids unique per adventure?
3. Record findings in `services/frontier/PORT_NOTES.md` (or `ACTION_IDS.md` — rename for clarity). Flag any behavior that breaks the Scripture history assumption.
4. In parallel, instrument the AI Dungeon WebSocket in the browser console to identify which GraphQL subscription carries the action window (`adventureActionsUpdate`? `actionWindowUpdate`? something else?). Log distinct top-level `data.*` keys over a few turns.
5. Create `services/frontier/` and `modules/scripture/` directories with `.gitkeep`.
6. Confirm `world: "MAIN"` behavior on:
   - Chromium (Chrome stable + lowest supported Chromium version per `manifest.json`).
   - Firefox (stable + strict_min_version).
   - Android WebView (via the Android APK build once a dev build exists; may need a `<script>` injection fallback).
7. Snapshot `features/better_scripts_feature.js` (git history preserves this; just note the commit SHA in planning).

**Acceptance:**
- Directories exist in git.
- `ACTION_IDS.md` documents empirical behavior for every operation in the matrix; we have a confirmed green light to proceed with action-ID history OR a documented fallback if something is unstable.
- WS subscription name for the action window identified.
- Multiplatform `world: "MAIN"` status documented (which platforms work natively, which need the `<script>` fallback).

### Phase 1 — Scripture on action-ID, end-to-end

This is the big one. Delivers a working Scripture widget system using the new Frontier architecture. Smaller sub-steps land as separate commits but all ship together.

**Files:**
- `services/frontier/ws-interceptor.js` (new)
- `services/frontier/card-stream.js` (new)
- `services/frontier/core.js` (new)
- `services/frontier/module-registry.js` (new)
- `modules/scripture/module.js` (new)
- `modules/scripture/renderer.js` (new, migrated from `better_scripts_feature.js`)
- `modules/scripture/validators.js` (new, migrated)
- `services/ai-dungeon-service.js` (edit: add `upsertStoryCard` helper for heartbeat writes)
- `features/better_scripts_feature.js` (delete)
- `main.js` (edit: remove BetterScripts handlers, bootstrap Frontier + Scripture)
- `manifest.json` (edit: add MAIN-world content-script entry for ws-interceptor.js; update loaded files list)

**Work, in implementation order:**

1. **Transport (ws-interceptor + card-stream):**
   - `ws-interceptor.js`: self-contained IIFE that shims `window.WebSocket`, watches frames for `adventureStoryCardsUpdate` AND the action-window subscription identified in Phase 0. Forwards normalized payloads via `window.postMessage({ source: 'BD_FRONTIER_WS', kind: 'cards' | 'actions', payload })`. Idempotent; multiplatform (native MAIN-world where supported, `<script>` injection fallback elsewhere).
   - `card-stream.js`: content-script service. Listens on `window` for `BD_FRONTIER_WS` messages, maintains `Map<cardId, card>` + current action window. Emits `frontier:cards:full`, `frontier:cards:diff`, `frontier:actions:change` via an `EventTarget`. Exposes `writeCard(title, value, opts)` wrapping the GraphQL upsert, `getCurrentActionId()`, `isFrontierCard(card)`.
   - Update `manifest.json` to inject `ws-interceptor.js` in the MAIN world at `document_start` (with `<script>` fallback registered as `web_accessible_resources` for Firefox/WebView).

2. **GraphQL write path:**
   - In `services/ai-dungeon-service.js` (or a fresh `services/frontier/graphql-client.js` if scope feels separate), add `upsertStoryCard({ adventureId, title, value, type, keys })`. Uses AI Dungeon's own GraphQL endpoint; extracts auth from captured WS frames; retries transient failures with exponential backoff.
   - Wire `card-stream.js#writeCard` to call it.

3. **Core (thin router):**
   - `services/frontier/core.js`: singleton with `.instance`. Subscribes to `frontier:cards:diff` and `frontier:actions:change`. For each changed `frontier:state:<name>` card, looks up the registered module(s) and dispatches `onStateChange(name, parsed, ctx)`. For `frontier:actions:change`, re-dispatches `onStateChange` (with the cached parsed state) to every module that declared `tracksActionId: true`.
   - Emits `frontier:heartbeat` card on adventure load, module enable/disable, and coalesced at most once per WS push. Payload matches `02-protocol.md#frontierheartbeat`.
   - Debug mode: `chrome.storage.sync` key `frontier_debug` (migrated from `betterDungeon_betterScriptsDebug`). Exposed via popup message `SET_FRONTIER_DEBUG`.

4. **Module registry:**
   - `services/frontier/module-registry.js`: holds registered modules, persists enabled state in `chrome.storage.sync` under `frontier_enabled_modules`. Calls `onEnable` / `onDisable` on toggle. Designed so future third-party / sandboxed loaders plug into the same interface.

5. **Scripture:**
   - Lift widget DOM/CSS code from `better_scripts_feature.js` into `modules/scripture/renderer.js` as a `WidgetRenderer` class. 9 widget types, zones, density, observers — unchanged behavior.
   - Lift HTML/CSS sanitization + config validation into `modules/scripture/validators.js`.
   - Write `modules/scripture/module.js`: declares `id: 'scripture'`, `stateNames: ['scripture']`, `tracksActionId: true`. `onStateChange` reconciles manifest against renderer AND applies values from `parsed.history[ctx.currentActionId]` with fallbacks. `onEnable` / `onDisable` / `onAdventureChange` as documented in [03 — Modules](./03-modules.md#module-lifecycle-for-scripture-reference).

6. **Bootstrap + cleanup:**
   - Update `main.js` to instantiate Frontier on BD startup and register `ScriptureModule`. Delete `handleSetBetterScriptsDebug` et al; add `handleSetFrontierDebug` and `handleSetFrontierModuleEnabled`.
   - Delete `features/better_scripts_feature.js`.
   - Update `manifest.json` content_scripts list to include (in load order): `services/frontier/card-stream.js`, `services/frontier/module-registry.js`, `services/frontier/core.js`, `modules/scripture/validators.js`, `modules/scripture/renderer.js`, `modules/scripture/module.js`, `main.js`. Drop the old `features/better_scripts_feature.js` entry.

**Acceptance:**
- A scenario that pastes the base Frontier Library + Scripture adapter (from [03 — Modules](./03-modules.md#ai-dungeon-side-library)) and calls `scriptureSet([...])` each turn renders widgets **pixel-identically** to the old BetterScripts. Side-by-side screenshot comparison passes.
- **Undo/retry correctness:** advance 5 turns, each with different HP/gold values. Press Undo repeatedly. Widgets show the correct HP/gold for each reverted action. Press Retry. Widgets show new values as soon as the new action arrives. Press Continue, Edit. All work.
- **Refresh test:** reload the page mid-adventure. Widgets rehydrate correctly from the existing `frontier:state:scripture` card + the action window pushed by AI Dungeon.
- **Availability test:** with Frontier disabled in the popup, `frontierIsAvailable()` returns `false` in the script; widgets do not render; the heartbeat card is absent.
- **Multiplatform test:** the above passes on Chromium, Gecko, AND Android WebView.

### Phase 2 — Feature manager & popup integration

**Files:**
- `core/feature-manager.js` (edit)
- `popup.html` / `popup.js` (edit)
- `main.js` (edit: message handlers for module toggles)

**Work:**

1. Feature manager: register Frontier as a managed feature. `init` boots Core; `destroy` tears down Core + all modules. Module enable states persist separately (in the module registry) but gate on Frontier being enabled.
2. Popup: replace the BetterScripts toggle with a Frontier section:
   - Master toggle: Frontier on/off.
   - Nested: Scripture on/off (default on).
   - Debug toggle: Frontier debug mode.
   - (Future placeholder, not rendered in MVP:) "Manage modules…" button.
3. Chrome message types:
   - `SET_FRONTIER_DEBUG` (replaces `SET_BETTERSCRIPTS_DEBUG`)
   - `SET_FRONTIER_MODULE_ENABLED` → `{ moduleId, enabled }`
   - `GET_FRONTIER_STATE` → returns `{ enabled, modules: [{ id, enabled, version }] }`

**Acceptance:** Popup reflects and controls all toggles. Changes persist across reloads. Heartbeat payload reflects the current state on every refresh. Toggling Frontier off immediately tears down widgets; toggling back on rehydrates them.

### Phase 3 — BD UI filtering

**Files:**
- `features/story_card_modal_dock_feature.js` (edit)
- `features/story_card_analytics_feature.js` (edit)
- `features/trigger_highlight_feature.js` (edit)
- `features/auto_see_feature.js` (edit)

**Work:**

1. Each feature gains a filter step that excludes cards where `isFrontierCard(card) === true` (centralized in `card-stream.js`).
2. The Frontier prefix list lives in one place: `const FRONTIER_RESERVED_PREFIXES = ['frontier:']`.

**Acceptance:** Reserved cards (`frontier:state:*`, `frontier:heartbeat`) are hidden from the Story Card Modal Dock, Story Card Analytics, Trigger Highlight list, and Auto-See picker. They remain visible in AI Dungeon's own Story Card list (out of scope per decision #7).

### Phase 4 — Documentation & guide rewrite

**Files:**
- `BetterRepository/src/components/guides/BetterScriptsGuide.vue` → rename to `FrontierGuide.vue`
- `BetterRepository/src/components/guides/ScriptureGuide.vue` (new)
- Router / nav references in `BetterRepository/src/router/*`
- `Project Management/docs/01-scripting/api/story-cards-api.md` (edit: add Frontier reserved-prefix section)

**Work:**

1. Restructure `FrontierGuide.vue`:
   - Section 1: Introduction — what is Frontier (Lite), what it's for, what's coming later.
   - Section 2: Availability detection — heartbeat card, `frontierIsAvailable` pattern, graceful degradation.
   - Section 3: Publishing state — `frontierWriteState` / `frontierReadState` / `frontierUpdateHistory`, the action-ID history pattern explained.
   - Section 4: Included modules → link to Scripture guide.
   - Section 5: Roadmap — what Full Frontier will add.
2. Create `ScriptureGuide.vue`:
   - Lift the 9 widget-type reference material (preview tables, config options, HTML/CSS sanitization rules).
   - Drop ALL ZW / TagCipher / Context Modifier sections. There is no Context Modifier in the new flow.
   - Update all code examples to use `scriptureSet([...])`.
   - Explicitly explain the undo/retry behavior: "Your widgets just work when the user undoes/retries, because Scripture maintains a small history keyed by action id. You don't have to do anything special."
3. Update router / nav.
4. Update `story-cards-api.md` with the reserved `frontier:*` prefix section.

**Acceptance:** BetterRepository site renders both new guides with working TOC. No remaining references to ZW encoding, TagCipher, Context Modifiers, or the old `better_scripts_feature.js` file.

### Phase 5 — Version bump & release prep

**Files:**
- `manifest.json` (version: `1.2.1` → `2.0.0`)
- `README.md` (BetterDungeon + BetterRepository) — mention Frontier
- `CONTRIBUTING.md` (if it references BetterScripts) — update
- Changelog (wherever it's tracked for BD V2)

**Acceptance:** Manifest version bumped. READMEs and contrib docs reference Frontier. Changelog entry written. Coordinated with BD V2's broader release checklist.

## Testing strategy

Since BetterDungeon is a browser extension that depends on AI Dungeon's live backend, we rely on manual testing end-to-end. Add automated coverage where cheap.

### Automated (cheap wins)

- **Card diff algorithm** — unit test `card-stream.js`'s diff given fixture inputs.
- **Action-window parser** — unit test the tail-id extraction logic given captured WS payloads from Phase 0.
- **Validators** — Scripture's config validator is pure; unit test it.
- **`isFrontierCard` helper** — trivial unit test.
- **History pruning** — unit test `frontierUpdateHistory` reaches the `historyLimit` cap and evicts in insertion order.

### Manual verification checklist

A regression checklist for all phases together. Run after Phase 1, then again after Phase 5 as release sign-off.

- [ ] Load an adventure; confirm `frontier:heartbeat` card appears with correct schema.
- [ ] Publish a `frontier:state:scripture` card manually (via the script Library); confirm widgets render and pixel-match old BetterScripts output.
- [ ] **Undo correctness:** advance 5 turns with changing HP/gold; press Undo; widget values revert to the previous turn's state. Press Undo again; revert further.
- [ ] **Retry correctness:** press Retry on the current turn; once the new output lands, widgets show the new turn's values.
- [ ] **Edit correctness:** edit an earlier turn's action; the edited turn's widget values are preserved (action id didn't change) OR the next turn's write corrects them if behavior differs (document whichever applies from Phase 0 findings).
- [ ] **Continue correctness:** press Continue; widgets update for the new action.
- [ ] **Refresh correctness:** reload the page mid-adventure; widgets rehydrate with the correct values for the current action.
- [ ] Toggle Scripture off in popup; widgets disappear; heartbeat no longer advertises Scripture.
- [ ] Toggle Frontier master off; no heartbeat written; scripture card changes are ignored.
- [ ] Switch between adventures in separate tabs; widgets are scoped per adventure.
- [ ] Reserved cards hidden from BD's own UI lists (Story Card Modal Dock, Analytics, Trigger Highlight, Auto-See).
- [ ] `frontierIsAvailable()` returns correct boolean under (a) BD enabled, (b) BD disabled, (c) BD just loaded (no heartbeat yet), (d) stale heartbeat (>2 turns old — force by stopping Core temporarily).
- [ ] **Multiplatform:** the above passes on Chromium, Gecko, and Android WebView.

### Smoke harness

Optional but recommended: a minimal harness scenario committed to a private BetterDungeon-test repo containing:

- The base Frontier Library + Scripture adapter pasted as-is.
- An Output Modifier that mutates HP/gold/mana each turn and calls `scriptureSet([...])`.
- A widget-demo scenario that exercises all 9 Scripture widget types at once.

## File-by-file change summary

### New files

| Path | Purpose |
|------|---------|
| `services/frontier/ws-interceptor.js` | Page-world WebSocket shim (cards + action-window subscriptions) |
| `services/frontier/card-stream.js` | Content-script card + action-window stream; dispatches diffs and action-id changes |
| `services/frontier/core.js` | Frontier Core (Lite): thin router, heartbeat emitter, action-ID tracker |
| `services/frontier/module-registry.js` | Module registration + enable/disable persistence |
| `services/frontier/ACTION_IDS.md` | Phase 0 empirical findings on action-id behavior across undo/retry/edit/continue |
| `modules/scripture/module.js` | Scripture module definition (reads manifest + history card; applies values for current action id) |
| `modules/scripture/renderer.js` | Widget DOM/CSS (migrated from `better_scripts_feature.js`) |
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

1. **Full Frontier (two-way comms)** — adds `frontier:out` / `frontier:in:*` cards, request/response envelopes, ops dispatcher in Core, ack/TTL state machines. Unblocks WebFetch, LocalAI, etc. Largest post-MVP workstream.
2. **First real capability module** — likely WebFetch. Proves the Full Frontier extension works end-to-end; requires Full Frontier to exist first.
3. **NPM / TypeScript / bundler migration** (Robyn's pitch) — reorganize BetterDungeon into proper packages with a bundler. Declined for MVP; worth re-opening as its own epic once Frontier is stable.
4. **`story-card-scanner.js` migration** — replace DOM scrape with card-stream as source of truth. Phase 1 already hydrates the cache non-destructively; full cut-over is the follow-up.
5. **Real GraphQL client robustness** — auth token capture, endpoint discovery, CSRF handling. MVP uses a simple version that works on the current site structure.
6. **Registry UI** — browse + install vetted third-party modules. Requires Full Frontier (modules need ops to be meaningful).
7. **Sandboxed user scripts** — arbitrary JS modules in an iframe/Worker with a constrained Frontier SDK. Security-heavy; long-term.
8. **Inter-module calls** — modules invoking other modules via Core. Needs Full Frontier's op dispatcher.
9. **Richer popup UI** — per-module debug toggles, live state viewer, heartbeat inspector.
10. **Mobile APK parity testing** — automate the Android WebView smoke tests once the APK pipeline is in place.

All of these slot into the existing architecture without refactoring Core (at least, not in ways that break Lite modules).
