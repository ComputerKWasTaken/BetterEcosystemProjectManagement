# 04 — Implementation Plan

## Release coordination

Frontier is part of **BetterDungeon V2**, which bundles:

1. Frontier system (this plan)
2. Android APK mobile build
3. Firefox Add-ons publication
4. Store page reworks

**Sequencing:**

- **BetterRepository v1.6** shipped (unrelated to Frontier; last major BetterRepository release before a calm period).
- BD V2 implementation now begins. Frontier is the largest single workstream inside V2.
- Frontier does NOT ship independently; it releases with BD V2.

## Scope revision — Full Frontier in V2

The original plan scoped V2 to **Frontier Lite** (one-way, Scripture only) and deferred two-way comms to a post-MVP epic. That rested on an assumption that proved wrong in the best possible way: the GraphQL write path — formerly out-of-MVP item #5, "real GraphQL client robustness" — was solved ahead of schedule via **mutation-template replay**. We capture any in-flight `SaveQueueStoryCard` mutation, deep-override its variables, and re-send it. Auth-token capture, endpoint discovery, and CSRF handling are all sidestepped. Update AND create operations work for any card, including ones never touched in-session.

That unlocks the whole Full Frontier roadmap. Two-way comms becomes a ~40% scope increase on top of Lite instead of the 3–4× cost originally feared. V2 is therefore re-scoped from "widgets-only MVP" to the **"unshackle the sandbox" release** the vision doc promised: Scripture PLUS Full Frontier's envelope protocol PLUS reference ops modules (WebFetch, Clock).

**Profile impact:** the heartbeat's `profile` field ships as `"full"` at V2 launch. Per `02-protocol.md`, this is explicitly non-breaking — Full-profile Core still runs Lite-only scripts.

## Phase breakdown

Ten phases. Each has an acceptance criterion; "done" means criterion met, verified in a real browser, and committed with a passing build. Phases 1–3 deliver a superset of the original Lite plan; phases 4–6 deliver Full Frontier and its first two ops modules; phases 7–10 are integration and release.

### Phase 0 — Pre-work (closed)

**Why separate:** the entire design rests on the assumption that AI Dungeon action ids are stable across retry/edit/continue. Verify that BEFORE writing any code.

**Status:** *investigation complete*. The protocol-design work that Phase 0 exists to unblock is done; the remaining items are workspace plumbing.

**Findings (canonical record: `BetterDungeon/services/frontier/ACTION_IDS.md`; summaries in [02 — Protocol](./02-protocol.md#ai-dungeon-observation-channels) and [05 — Risks](./05-risks-and-open-questions.md#r9--action-id-stability-assumption-resolved)):**

- **Observation channels:** `adventureStoryCardsUpdate`, `contextUpdate`, `actionUpdates` — all on `wss://api.aidungeon.com/graphql`. Event-to-channel matrix documented.
- **Action ids:** numeric-string, monotonic +1, stable for life, never reused, soft-deleted via `undoneAt`.
- **Retry:** Behavior A — new action at `tail+1` with `retriedActionId`; original gets `undoneAt`.
- **Script-side limitation:** `history[i]` has no `id` field. Scripts cannot see wire action ids.
- **Design resolution:** both sides key history by **live-count ordinal** (`history.length + 1` script-side ≡ `actions.filter(!undoneAt).length` BD-side). Documented in [02 — Protocol: live-count history convention](./02-protocol.md#live-count-history-convention).
- **Injection:** `class extends NativeWebSocket` at `document-start` is required; function wrappers break Apollo's `instanceof` checks silently.

**Workspace prep (done):**

- `BetterDungeon/services/frontier/` exists and contains `ACTION_IDS.md` (the canonical Phase 0 record).
- `BetterDungeon/modules/scripture/` exists with a `.gitkeep`.
- `Project Management/frontier/action-hunter.user.js` is the canonical hunter userscript; scratch files (`ws-userscript.user.js`, `ws-find-cardchannel.js`, `ws-test-console.js`) have been removed.

**Deferred to Phase 1 (first task):**

- Port `action-hunter.user.js` into `BetterDungeon/services/frontier/ws-interceptor.js` as an MV3 page-world content script. This is effectively Phase 1's step 1 and there's no benefit to doing it under a "Phase 0 smoke test" heading.
- Snapshot `features/better_scripts_feature.js` commit SHA at the start of Phase 1 (in the first commit's message) so the Scripture migration diff is clean.

**Acceptance:** Workspace dirs in git; `ACTION_IDS.md` committed. **Phase 0 closed.**

### Phase 1 — Transport hardening

Mutation replay was proved out end-to-end earlier than the original plan anticipated — writes, creates, and cross-card template reuse all verified in a live adventure with persistence confirmed across reload. Transport still has latent bugs that would bite every module downstream. Fix them before the module layer lands on top.

**Files:**
- `services/frontier/ws-interceptor.js` (edit)
- `services/frontier/ws-stream.js` (edit)
- `services/ai-dungeon-service.js` (edit)
- `services/frontier/write-queue.js` (new)

**Work:**

1. **Action-stream hydration.** `tail` / `liveCount` stay at `null` / `0` even when cards hydrate via HTTP, because actions are currently sourced only from the `actionUpdates` subscription channel. Add HTTP hydration for `actions[]` parallel to the existing card hydration scanner — same path-scoped scanner pattern, watching for `actions` / `actionWindow` arrays on `GetAdventure` responses.
2. **Adventure-boundary detection.** Watch URL changes + each `GetAdventure` response's `adventureId` / `shortId`. On transition, reset `state.cards`, `state.actions`, and `state.enrichment`. Mutation templates stay — they're per-op not per-adventure, and a fresh adventure will refresh them as AID's autosave runs.
3. **`adventureShortId` resolver.** URL regex expanded to cover `/adventure(s)?/<slug>`, `/play/<slug>`, and `/scenarios?/<slug>`. Fallback: most-recent enrichment entry carrying a `shortId`, independent of whether that entry's card id is still in the live snapshot.
4. **Write queue (`write-queue.js`).** Thin wrapper around `upsertStoryCard`:
   - Per-card serialize (no concurrent writes to the same card id).
   - Coalesce rapid successive writes — last-write-wins while a request is in flight.
   - Retry on transient network / 5xx with exponential backoff (capped attempts).
   - Optimistic local echo — merge the write into `state.cards` immediately; reconcile on server echo or roll back on hard failure.
   - Surface errors via the returned promise; never silently swallow.

**Acceptance:**
- Entering any adventure from the home page hydrates cards AND `tail` / `liveCount` within one turn of the first action.
- `window.Frontier.ws.getState().adventureShortId` is non-null whenever the user is in an adventure, regardless of URL shape.
- Navigating between adventures clears stale state — no cards or enrichment from the previous adventure linger.
- Rapid `writeCard('X', 'a')` → `writeCard('X', 'b')` results in exactly one outbound mutation with value `'b'`.
- A write with the network offline retries and eventually succeeds when connectivity returns; permanent failure rejects the caller's promise with a structured error.

### Phase 2 — Core + Module Registry

The substrate modules plug into. Router, heartbeat, lifecycle, shared `ctx` API.

**Files:**
- `services/frontier/core.js` (major edit — currently skeletal)
- `services/frontier/module-registry.js` (new)
- `services/frontier/heartbeat.js` (new)
- `main.js` (edit: register first-party modules)

**Work:**

1. **Core dispatcher.** Subscribes to `frontier:cards:diff` and `frontier:tail:change`. For each changed `frontier:state:<name>` card, finds modules whose `stateNames` include `<name>` and calls `onStateChange(name, parsed, ctx)`. On tail change, re-dispatches cached state to every module that declared `tracksActionId: true`.
2. **Module registry.** `register(module)`, `enable(id)`, `disable(id)`. Persists enabled state in `chrome.storage.sync` under `frontier_enabled_modules`. Calls lifecycle hooks (`onEnable` / `onDisable` / `onAdventureChange`) at the right boundaries.
3. **Heartbeat emitter.** On adventure load, module enable/disable, and coalesced at most once per WS push — writes `frontier:heartbeat` via the Phase 1 write queue. Schema per [02 — Protocol](./02-protocol.md#frontierheartbeat).
4. **`ctx` API** passed to every module hook:
   ```js
   ctx = {
     cardId, cardTitle,                // set on card-scoped hooks
     getActions(), getCurrentActionId(), getLiveCount(),
     writeCard(title, value, opts),    // wraps the write queue
     respond(requestId, data),         // no-op in Phase 2; wired in Phase 4
     respondError(requestId, err),     // ditto
     log(level, ...args),
     storage: { get(key), set(key, value) },
   }
   ```
   `respond` / `respondError` are present from day one so module code doesn't branch when Full Frontier ships.
5. **Debug mode.** `frontier_debug` in `chrome.storage.sync` (migrated from `betterDungeon_betterScriptsDebug`). Structured console logs behind the flag.

**Acceptance:**
- A stub module declaring `stateNames: ['test']` receives `onStateChange` exactly once when a `frontier:state:test` card first appears, and on every subsequent change.
- `frontier:heartbeat` lands within 1 s of adventure load with the correct schema and module list.
- Toggling a module off halts dispatch to it and triggers `onDisable`; toggling on triggers `onEnable` and replays the current state.

### Phase 3 — Scripture module (state-only reference)

The first real module. Reference implementation for state-only modules (no ops).

**Files:**
- `modules/scripture/module.js` (new)
- `modules/scripture/renderer.js` (new, migrated from `better_scripts_feature.js`)
- `modules/scripture/validators.js` (new, migrated)
- `features/better_scripts_feature.js` (delete)
- `manifest.json` (edit: drop `better_scripts_feature.js` entry, add Scripture module files in load order)

**Work:**

1. Lift DOM/CSS and 9 widget types from `better_scripts_feature.js` into `renderer.js` as a `WidgetRenderer` class. Zones, density, observers — unchanged behavior.
2. Lift HTML/CSS sanitization + config validation into `validators.js`.
3. Write `module.js`: declares `id: 'scripture'`, `stateNames: ['scripture']`, `tracksActionId: true`. `onStateChange` reconciles manifest against renderer AND applies values from `parsed.history[ctx.getLiveCount()]` with manifest-default fallback.
4. Delete `better_scripts_feature.js`; remove its `main.js` handlers; add `handleSetFrontierDebug` / `handleSetFrontierModuleEnabled`.

**Acceptance:**
- A scenario using the base Frontier Library + Scripture adapter renders **pixel-identically** to the old BetterScripts. Side-by-side screenshot diff passes.
- Undo / retry / edit / continue all round-trip correctly — widgets always reflect the current live-count ordinal's values.
- Refresh mid-adventure rehydrates widgets from the state card + action window.
- With Frontier disabled in popup, widgets do not render and `frontierIsAvailable()` returns `false` in scripts.

### Phase 4 — Full Frontier envelope protocol

The two-way breakthrough. Design specified in [06 — Full Frontier protocol](./06-full-frontier-protocol.md).

**Files:**
- `services/frontier/envelope.js` (new — request/response schemas + request-id generator + GC policies)
- `services/frontier/ops-dispatcher.js` (new — consumes `frontier:out`, routes to module ops, writes `frontier:in:<module>`)
- `services/frontier/core.js` (edit: wire ops dispatcher)
- `06-full-frontier-protocol.md` (new)
- AI-Dungeon-side Library additions: `frontierCall`, `frontierPoll`, `frontierPollAll`, tombstone-on-read semantics

**Work:**

1. **Envelope format.** Request and response schemas, request-id scheme (`<liveCount>-<moduleId>-<seq>`), status lifecycle (`pending` → `ok` / `err` / `timeout`), per-module response sharding (`frontier:in:<module>`), GC strategy (script tombstones via ack-in-`frontier:out`; Core tombstones responses after N turns as a safety net).
2. **Ops dispatcher.** Reads `frontier:out` diffs → dedupes by request id (idempotent replay-safe) → resolves module + op handler → writes `pending` response immediately → writes terminal response when handler resolves / rejects. In-flight request ids mirrored to `sessionStorage` so a BD reload mid-op can resume cleanly.
3. **Module API extension.** Modules may declare `ops: { [opName]: async (args, ctx) => result }`. State-only modules (Scripture) declare none and continue to work exactly as before.
4. **Heartbeat upgrade.** `profile` flips to `"full"`. Per-module entries advertise `ops: string[]` so scripts can feature-detect specific ops.

**Acceptance:**
- A test module declaring `ops: { echo(args) { return { got: args }; } }` can be called via `frontier.call('test', 'echo', { hello: 'world' })` and the script receives `{ got: { hello: 'world' } }` within one turn.
- An in-flight op survives a BD reload — the `pending` response is preserved and the op completes on the reloaded BD without duplication.
- Calls to unknown module or op names produce `err` responses with structured codes (`unknown_module`, `unknown_op`).
- Rewriting the same request id in `frontier:out` does not cause duplicate handler invocations.

### Phase 5 — WebFetch module (ops reference, consent flow)

The canonical two-way demo. "Scripts can now hit the internet."

**Files:**
- `modules/webfetch/module.js` (new)
- `modules/webfetch/consent.js` (new)
- `popup.html` / `popup.js` (edit: WebFetch allowlist UI)

**Work:**

1. **`ops: { fetch(args, ctx) }`**. Args: `{ url, method?, headers?, body?, timeoutMs? }`. Returns `{ status, statusText, headers, body }`. Binary bodies base64-encoded (detected via `Content-Type`); text otherwise.
2. **Consent model.** First request to a new origin surfaces a consent prompt. User picks allow-once / allow-always / deny. Allowlist persisted in `chrome.storage.sync` under `frontier_webfetch_allowlist`.
3. **Rate limits.** Per-origin: configurable RPM, default 20/min. Over-limit requests return `err: rate_limit` with a `retryAfterMs` hint.
4. **Security.** Block `file://`, `chrome-extension://`, `chrome://`, localhost variants. Strip `Cookie` / `Authorization` headers unless explicitly upgraded for that origin.

**Acceptance:**
- Script calls `frontier.call('webfetch', 'fetch', { url: 'https://httpbin.org/get' })` and receives the JSON response envelope within one turn.
- Denying consent causes all subsequent requests to that origin to fail fast with `err: consent_denied`.
- 30 rapid requests to one origin: first 20 succeed, remaining receive `err: rate_limit` with a valid `retryAfterMs`.
- Requests to blocked schemes return `err: scheme_blocked` without touching the network.

### Phase 6 — Clock module (trivial ops reference)

Low-risk, marketable, validates the ops shape on a minimal module.

**Files:**
- `modules/clock/module.js` (new)

**Work:** `ops: { now(), tz(), format({ ts, format }) }`. No consent needed; purely deterministic.

**Acceptance:** Script calls `frontier.call('clock', 'now')` and receives `{ ts, iso, tz }` within one turn. `format({ ts: 0, format: 'YYYY-MM-DD' })` returns `'1970-01-01'`.

### Phase 7 — Feature Manager + popup integration

Standard BD plumbing, expanded for the module catalog.

**Files:**
- `core/feature-manager.js` (edit)
- `popup.html` / `popup.js` (edit)
- `main.js` (edit)

**Work:**

1. Register Frontier as a top-level managed feature. `init` boots Core; `destroy` tears down Core + all modules cleanly.
2. Popup UI:
   - Frontier master toggle.
   - Per-module toggles: Scripture, WebFetch, Clock.
   - WebFetch permissions panel (per-origin allowlist from Phase 5).
   - Debug mode toggle.
3. Chrome message types: `SET_FRONTIER_DEBUG`, `SET_FRONTIER_MODULE_ENABLED`, `GET_FRONTIER_STATE`, `SET_WEBFETCH_CONSENT`.

**Acceptance:** Popup reflects and controls every toggle. Changes persist across reloads and propagate to Core within one tick. Heartbeat payload reflects enabled modules on every refresh.

### Phase 8 — BD UI filtering

**Files:**
- `features/story_card_modal_dock_feature.js`, `story_card_analytics_feature.js`, `trigger_highlight_feature.js`, `auto_see_feature.js` (edit)

**Work:**

1. Each feature filters out cards where `isFrontierCard(card) === true` (helper lives in `ws-stream.js`).
2. Prefix list is a single constant: `const FRONTIER_RESERVED_PREFIXES = ['frontier:', 'scripture:', 'bd:']`.

**Acceptance:** All reserved cards (`frontier:state:*`, `frontier:heartbeat`, `frontier:out`, `frontier:in:*`) are hidden from Story Card Modal Dock, Analytics, Trigger Highlight, and Auto-See. They remain visible in AI Dungeon's native Story Card list (per locked decision #7).

### Phase 9 — Guide + docs rewrite

BetterRepository content overhaul for V2.

**Files:**
- `BetterRepository/src/components/guides/BetterScriptsGuide.vue` → renamed `FrontierGuide.vue` + restructured
- `BetterRepository/src/components/guides/ScriptureGuide.vue` (new)
- `BetterRepository/src/components/guides/WebFetchGuide.vue` (new)
- `BetterRepository/src/components/guides/ClockGuide.vue` (new)
- `BetterRepository/src/router/*` (edit)
- `Project Management/docs/01-scripting/api/story-cards-api.md` (edit)

**Work:**

1. `FrontierGuide.vue`:
   - Section 1: Introduction — what Frontier is, the script → BD channel, the BD → script response channel.
   - Section 2: Availability detection — heartbeat card, `frontierIsAvailable` pattern, profile negotiation (`lite` vs `full`), graceful degradation.
   - Section 3: Publishing state — `frontierWriteState` / `frontierReadState` / `frontierUpdateHistory`, the live-count history pattern.
   - Section 4: Calling ops — `frontierCall` / `frontierPoll` / `frontierPollAll`, request-id semantics, multi-turn examples.
   - Section 5: Included modules — Scripture, WebFetch, Clock (linked).
   - Section 6: Roadmap.
2. Per-module guides:
   - `ScriptureGuide.vue` — 9 widget-type reference material, config options, HTML/CSS sanitization rules, undo/retry behavior.
   - `WebFetchGuide.vue` — op reference, consent flow, rate limits, security caveats, worked examples (weather, wiki lookup, image fetch).
   - `ClockGuide.vue` — op reference, format-string table, worked examples.
3. Update router / nav.
4. `story-cards-api.md` — new section documenting reserved `frontier:*`, `scripture:*`, `bd:*` prefixes.
5. Drop ALL ZW / TagCipher / Context Modifier sections.

**Acceptance:** BetterRepository site renders all four new guides with working TOC + code examples. No references to the legacy BetterScripts system remain.

### Phase 10 — Release prep

**Files:**
- `manifest.json` (version: `1.2.x` → `2.0.0`)
- `README.md` (BetterDungeon + BetterRepository) — Frontier section
- `CONTRIBUTING.md` (if it references BetterScripts) — update
- Changelog

**Work:** version bump, multiplatform smoke (Chromium + Gecko + Android WebView), store pages refreshed, changelog entry, coordinated with BD V2's broader release checklist.

**Acceptance:** Manifest bumped. READMEs updated. Changelog entry written. Multiplatform smoke passes. Store pages live.

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

| Path | Phase | Purpose |
|------|:-:|---------|
| `services/frontier/ws-interceptor.js` | ✓ landed | Page-world WebSocket + fetch/XHR shim; subscriptions + mutation template capture |
| `services/frontier/ws-stream.js` | ✓ landed | Content-script card + action-window + template stream; emits diffs |
| `services/frontier/core.js` | ✓ scaffolded / 2 | Thin router, heartbeat emitter, action-ID tracker, ops wiring |
| `services/frontier/ACTION_IDS.md` | ✓ landed | Phase 0 empirical findings on action-id behavior |
| `services/frontier/write-queue.js` | 1 | Serialized/coalesced/retrying wrapper around `upsertStoryCard` |
| `services/frontier/module-registry.js` | 2 | Module registration + enable/disable persistence |
| `services/frontier/heartbeat.js` | 2 | Heartbeat card emitter (coalesced) |
| `services/frontier/envelope.js` | 4 | Request/response schemas, request-id generator, GC policies |
| `services/frontier/ops-dispatcher.js` | 4 | Consumes `frontier:out`, invokes module ops, writes `frontier:in:<module>` |
| `modules/scripture/module.js` | 3 | Scripture module definition |
| `modules/scripture/renderer.js` | 3 | Widget DOM/CSS (migrated from `better_scripts_feature.js`) |
| `modules/scripture/validators.js` | 3 | Widget config + HTML/CSS sanitization (migrated) |
| `modules/webfetch/module.js` | 5 | WebFetch ops module |
| `modules/webfetch/consent.js` | 5 | Per-origin consent + allowlist |
| `modules/clock/module.js` | 6 | Clock ops module (now / tz / format) |
| `06-full-frontier-protocol.md` | 4 | Envelope protocol, request-id scheme, GC, idempotency spec |
| `BetterRepository/src/components/guides/ScriptureGuide.vue` | 9 | Scripture module guide |
| `BetterRepository/src/components/guides/WebFetchGuide.vue` | 9 | WebFetch module guide |
| `BetterRepository/src/components/guides/ClockGuide.vue` | 9 | Clock module guide |
| `Project Management/frontier/*` | ongoing | Planning docs |

### Modified files

| Path | Phase(s) | Change |
|------|:-:|--------|
| `manifest.json` | 3, 10 | Drop `better_scripts_feature.js`; add Scripture + module files; bump version to 2.0.0 |
| `main.js` | 2, 3, 7 | Wire Frontier Core + register first-party modules; add Frontier message handlers; remove BetterScripts handlers |
| `core/feature-manager.js` | 7 | Register Frontier as top-level feature |
| `popup.html` / `popup.js` | 5, 7 | Frontier master toggle, per-module toggles, WebFetch allowlist panel, debug toggle |
| `services/ai-dungeon-service.js` | 1 | Write queue integration; optimistic echo reconciliation |
| `services/story-card-cache.js` | optional | Hydrate from ws-stream (non-breaking) |
| `features/story_card_modal_dock_feature.js` | 8 | Filter reserved-prefix cards |
| `features/story_card_analytics_feature.js` | 8 | Filter reserved-prefix cards |
| `features/trigger_highlight_feature.js` | 8 | Filter reserved-prefix cards |
| `features/auto_see_feature.js` | 8 | Filter reserved-prefix cards |
| `BetterRepository/src/components/guides/BetterScriptsGuide.vue` | 9 | Rename → `FrontierGuide.vue` + restructure for Full profile |
| `BetterRepository/src/router/*` | 9 | Update routes for new guide set |
| `Project Management/docs/01-scripting/api/story-cards-api.md` | 9 | Add reserved-prefix section |

### Deleted files

| Path | Rationale |
|------|-----------|
| `features/better_scripts_feature.js` | Fully superseded by `modules/scripture/*` + `services/frontier/*` |

## Promoted into V2

These were originally out-of-MVP; the write-path breakthrough moved them into scope:

1. **Full Frontier (two-way comms)** — Phase 4.
2. **First capability module (WebFetch)** — Phase 5.
3. **Real GraphQL client robustness** — resolved by mutation-template replay; no dedicated phase needed. See `services/ai-dungeon-service.js` for the replay logic and `services/frontier/ws-interceptor.js` for the template capture pipeline.

## Still out-of-V2, tracked for later

1. **NPM / TypeScript / bundler migration** (Robyn's pitch) — reorganize BetterDungeon into proper packages with a bundler. Its own epic, post-V2.
2. **`story-card-scanner.js` migration** — replace DOM scrape with card-stream as the single source of truth. Phase 1 already hydrates the cache non-destructively; full cut-over is the follow-up.
3. **Registry UI** — browse + install vetted third-party modules. Architecturally unblocked by Full Frontier; UI and trust model are their own workstream.
4. **Sandboxed user scripts** — arbitrary JS modules in an iframe / Worker with a constrained Frontier SDK. Security-heavy; long-term.
5. **Inter-module calls** — modules invoking other module ops via Core. Shape mostly falls out of Phase 4; ergonomics pass is deferred.
6. **Richer popup UI** — live state viewer, heartbeat inspector, request-log panel. Phase 7 ships the minimum; the rest waits for feedback.
7. **Mobile APK parity testing automation** — once the APK pipeline is in place, automate the Android WebView smoke tests.
8. **Additional modules** — LocalAI, LocalStorage, Geolocation, Notify, and the long tail. Each is an incremental addition on the Full Frontier substrate; none require Core changes.

All of these slot into the existing architecture without refactoring Core.
