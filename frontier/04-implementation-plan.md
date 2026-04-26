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

That unlocks the whole Full Frontier roadmap. Two-way comms becomes a ~40% scope increase on top of Lite instead of the 3–4× cost originally feared. V2 is therefore re-scoped from "widgets-only MVP" to the **"unshackle the sandbox" release** the vision doc promised: Scripture PLUS Full Frontier's envelope protocol PLUS first-party ops modules (WebFetch, Clock, Geolocation, Weather, Network, System, and Provider AI).

**Profile impact:** the heartbeat's `profile` field ships as `"full"` at V2 launch. Per `02-protocol.md`, this is explicitly non-breaking — Full-profile Core still runs Lite-only scripts.

## Phase breakdown

Eleven phases. Each has an acceptance criterion; "done" means criterion met, verified in a real browser, and committed with a passing build. Phases 1-3 deliver a superset of the original Lite plan; phases 4-6 deliver Full Frontier and its first ops modules; phases 7-8 close the V2 integration substrate; Phase 9 adds Provider AI; phases 10-11 are guides and release.

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
- The hunter userscript proved the Phase 0 observations and has since been removed during planning-doc cleanup. Scratch files (`ws-userscript.user.js`, `ws-find-cardchannel.js`, `ws-test-console.js`) were also removed.

**Deferred to Phase 1 (first task):**

- Port the hunter behavior into `BetterDungeon/services/frontier/ws-interceptor.js` as an MV3 page-world content script. This is effectively Phase 1's step 1 and there's no benefit to doing it under a "Phase 0 smoke test" heading.
- Snapshot `features/better_scripts_feature.js` commit SHA at the start of Phase 1 (in the first commit's message) so the Scripture migration diff is clean.

**Acceptance:** Workspace dirs in git; `ACTION_IDS.md` committed. **Phase 0 closed.**

### Phase 1 — Transport hardening (completed)

Mutation replay was proved out end-to-end earlier than the original plan anticipated — writes, creates, and cross-card template reuse all verified in a live adventure with persistence confirmed across reload. Transport still has latent bugs that would bite every module downstream. Fix them before the module layer lands on top.

**Status:** *completed 2026-04-21*. All four deliverables implemented, live-tested, and committed.

**Files:**
- `services/frontier/ws-interceptor.js` (edit)
- `services/frontier/ws-stream.js` (edit)
- `services/frontier/core.js` (edit)
- `services/frontier/write-queue.js` (new)
- `manifest.json` (edit — load order)

**Empirical findings (from live testing):**

1. **Action hydration (safety net only).** AID's GetAdventure HTTP response does NOT include an `actions` array. Adventure node keys are: `adventureId, type, memories, instructions, storySummary, lastSummarizedActionId, lastMemoryActionId, storyCards, storyCardInstructions, storyCardStoryInformation, __typename`. Actions come exclusively from the WS `ActionUpdates` subscription (delta-only, not initial state). `tail`/`liveCount` populate after the first action event (turn, undo, etc.), not on page load. The scanner code is retained as a safety net for future AID changes.
2. **Adventure-boundary detection** works via HTTP-driven `adventure:change` events + 1-second URL poll for SPA navigation. State resets confirmed clean across adventures.
3. **adventureShortId resolver** works via 3-tier resolution (explicit → enrichment → URL regex). Confirmed `shortId` is per-adventure, not per-card.
4. **Write queue** confirmed working: per-card serialization, coalescing (3+ writes), retry with exponential backoff (tested offline → online), optimistic echo.
5. **AbortError** on SPA navigation (AID aborting in-flight fetches) is silenced — expected behavior.

**Acceptance (revised after testing):**
- ~~Entering any adventure from the home page hydrates cards AND `tail` / `liveCount` within one turn of the first action.~~ → `tail`/`liveCount` hydrate after the first WS `ActionUpdates` frame. HTTP hydration is retained as a safety net but currently a no-op.
- ✅ `window.Frontier.ws.getState().adventureShortId` is non-null whenever the user is in an adventure, regardless of URL shape.
- ✅ Navigating between adventures clears stale state — no cards or enrichment from the previous adventure linger.
- ✅ Rapid `writeCard('X', 'a')` → `writeCard('X', 'b')` → `writeCard('X', 'c')` results in two outbound mutations (first dispatches immediately, second coalesced, third dispatches when first completes) with the final value `'c'`.
- ✅ A write with the network offline retries and eventually succeeds when connectivity returns; permanent failure rejects the caller's promise with a structured error.

### Phase 2 — Core + Module Registry (completed)

The substrate modules plug into. Router, heartbeat, lifecycle, shared `ctx` API.

**Status:** *completed 2026-04-21*. All deliverables implemented and manually verified.

**Files:**
- `services/frontier/core.js` (rewrite)
- `services/frontier/module-registry.js` (rewrite)
- `main.js` (edit: register first-party modules)

**Empirical findings (from live testing):**
1. **Duplicate heartbeat cards:** Rapid successive events (`adventure:enter` and `mutation:template`) caused multiple heartbeats to be created before the server returned the ID for the first one. Fixed by adding a `heartbeatPending` guard so only one write is in flight at a time.
2. **State dispatch inconsistency:** Optimistic echo in the write queue made `ws-stream` diffs "no change" when the real echo arrived, meaning `cards:diff` wouldn't fire for local writes. Fixed by adding immediate local dispatch for state cards inside `writeCard`.

**Work:**

1. **Core dispatcher.** Subscribes to `frontier:cards:diff` and `frontier:tail:change`. For each changed `frontier:state:<name>` card, finds modules whose `stateNames` include `<name>` and calls `onStateChange(name, parsed, ctx)`. On tail change, re-dispatches cached state to every module that declared `tracksLiveCount: true`. Added immediate local dispatch for state cards in `writeCard()`.
2. **Module registry.** `register(module)`, `enable(id)`, `disable(id)`. Persists enabled state in `chrome.storage.sync` under `frontier_enabled_modules`. Calls lifecycle hooks (`onEnable` / `onDisable` / `onAdventureChange`) at the right boundaries. Replays cached state upon module enable.
3. **Heartbeat emitter.** On adventure load and coalesced at most once per WS push — writes `frontier:heartbeat` via the Phase 1 write queue. Schema per [02 — Protocol](./02-protocol.md#frontierheartbeat). Protected by `heartbeatPending` guard.
4. **`ctx` API** passed to every module hook:
   ```js
   ctx = {
     id, on(event, handler),
     getState(name), getCardByTitle(title),
     get adventureShortId(), getAdventureId(),
     getActions(), getCurrentActionId(), getTail(), getLiveCount(),
     writeCard(title, value, opts),
     respond(requestId, data),         // no-op in Phase 2; wired in Phase 4
     respondError(requestId, err),     // ditto
     log(level, ...args),
     storage: { get(key), set(key, value), remove(key) },
   }
   ```
5. **Debug mode.** `frontier_debug` in `chrome.storage.sync`. Structured console logs behind the flag. `Frontier.core.setDebug(bool)`.

**Acceptance (revised after testing):**
- ✅ A stub module declaring `stateNames: ['test']` receives `onStateChange` exactly once when a `frontier:state:test` card first appears, and on every subsequent change. (Fixed via immediate local dispatch).
- ✅ `frontier:heartbeat` lands within 1 s of adventure load with the correct schema and module list. (Fixed duplicate bug).
- ✅ Toggling a module off halts dispatch to it and triggers `onDisable`; toggling on triggers `onEnable` and replays the current state.

### Phase 3 — Scripture module (state-only reference)

The first real module. Reference implementation for state-only modules (no ops).

**Status:** *completed 2026-04-22*. Scripture is implemented as a Frontier state-only module, legacy BetterScripts is removed from the extension load path, static checks pass, and the live AI Dungeon Scripture suite passed all 10 behavior checks.

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
- [x] A scenario using the live Scripture AI Dungeon test harness renders all 9 widget types through Frontier state cards.
- [x] Undo / retry / edit / continue all round-trip correctly - widgets always reflect the current live-count ordinal's values.
- [x] Refresh mid-adventure rehydrates widgets from the state card + action window.
- [x] Manifest reset clears stale DOM attributes/styles and restores normal widgets on the next output.
- [x] Sanitizer and malformed-state recovery paths pass.
- [x] Disabling and re-enabling Scripture through the module registry hides and restores widgets.

### Phase 4 — Full Frontier envelope protocol

The two-way breakthrough. Design specified in [06 — Full Frontier protocol](./06-full-frontier-protocol.md).

**Status:** *completed 2026-04-22*. The first vertical slice is implemented: envelope helpers, ops dispatcher, Core wiring, `ctx.respond` / `ctx.respondError`, heartbeat ops advertisement, and the built-in opt-in `test.echo` validation module. Static syntax checks pass, local dispatcher simulations pass, the live AI Dungeon Full Frontier suite reached `checksPass: true` on run `full-mo9ejlzk`, and the manual `ff delay` reload-mid-pending check passed.

**Files:**
- `services/frontier/envelope.js` (new — request/response schemas + request-id generator + GC policies)
- `services/frontier/ops-dispatcher.js` (new — consumes `frontier:out`, routes to module ops, writes `frontier:in:<module>`)
- `services/frontier/core.js` (edit: wire ops dispatcher and response helpers)
- `services/frontier/module-registry.js` (edit: heartbeat refresh on module mount/unmount)
- `modules/test/module.js` (new — opt-in internal `test.echo` validation module)
- `manifest.json` (edit: load Phase 4 services + test module)
- `main.js` (edit: start ops dispatcher after registry startup)
- `06-full-frontier-protocol.md` (new)
- AI-Dungeon-side Library additions: `frontierCall`, `frontierPoll`, `frontierPollAll`, tombstone-on-read semantics
- Full Frontier AI Dungeon suite scripts (removed after sign-off; outcome retained here)

**Work:**

1. **Envelope format.** Request and response schemas, request-id scheme (`<liveCount>-<moduleId>-<seq>`), status lifecycle (`pending` → `ok` / `err` / `timeout`), per-module response sharding (`frontier:in:<module>`), GC strategy (script tombstones via ack-in-`frontier:out`; Core tombstones responses after N turns as a safety net).
2. **Ops dispatcher.** Reads `frontier:out` diffs → dedupes by request id → resolves module + op handler → writes `pending` response immediately → writes terminal response when handler resolves / rejects. In-flight request ids mirrored to `sessionStorage`; after reload, safe pending ops may replay, while unsafe pending ops settle with `unsafe_replay_blocked` so external side effects are not duplicated.
3. **Module API extension.** Modules may declare `ops: { [opName]: async (args, ctx) => result }`. State-only modules (Scripture) declare none and continue to work exactly as before.
4. **Heartbeat upgrade.** `profile` flips to `"full"`. Per-module entries advertise `ops: string[]` so scripts can feature-detect specific ops.

**Acceptance:**
- [x] A test module declaring `ops: { echo(args) { return { got: args }; } }` can be called via `frontier.call('test', 'echo', { hello: 'world' })` and the script receives `{ got: { hello: 'world' } }` within one turn.
- [x] A safe in-flight op survives a BD reload — the `pending` response is preserved and the op completes on the reloaded BD without duplication. Unsafe pending ops are not replayed.
- [x] Calls to unknown module or op names produce `err` responses with structured codes (`unknown_module`, `unknown_op`).
- [x] Rewriting the same request id in `frontier:out` does not cause duplicate handler invocations.

### Phase 5 — WebFetch module (ops reference, consent flow)

The canonical two-way demo. "Scripts can now hit the internet."

**Status:** *completed 2026-04-23*. WebFetch is wired as the first real Full Frontier ops module with safe-method `fetch` and `search` ops, origin consent prompts, fail-closed consent checks, per-origin rate limiting, blocked local/private schemes and hosts, request/response header filtering, a streaming body cap in the background fetch worker, and a paste-ready live AI Dungeon test suite. Local syntax checks and module simulations passed first; then live AI Dungeon validation passed on 2026-04-23, including the denied-origin consent check.

**Files:**
- `modules/webfetch/module.js` (new)
- `modules/webfetch/consent.js` (new)
- `background.js` (new: privileged http/https fetch worker)
- `manifest.json` (edit: background worker, http/https host permissions, WebFetch load order)
- WebFetch AI Dungeon suite scripts and sign-off checklist (removed after sign-off; outcome retained here)
- `popup.html` / `popup.js` (later edit: WebFetch allowlist UI)

**Work:**

1. **`ops: { fetch(args, ctx), search(args, ctx) }`**. Fetch args: `{ url, method?, headers?, timeoutMs?, maxBodyBytes? }`, with v1 restricted to `GET`, `HEAD`, and `OPTIONS`. Returns `{ status, statusText, headers, body, bodyEncoding, truncated }`. Binary bodies are base64-encoded; text-like bodies are UTF-8 text. Search uses DuckDuckGo's instant-answer endpoint and returns a compact result object.
2. **Consent model.** First request to a new origin surfaces an in-page consent prompt. User picks allow-once / allow-always / deny. Allowlist persisted in `chrome.storage.sync` under `frontier_webfetch_allowlist`.
3. **Rate limits.** Per-origin: configurable RPM, default 20/min. Over-limit requests return `err: rate_limit` with a `retryAfterMs` hint.
4. **Security.** Block `file://`, `chrome-extension://`, `chrome://`, localhost variants, `.localhost`, `.local`, private IPv4 literals, and obvious local/private IPv6 literals. Strip `Cookie` / `Authorization` headers unless explicitly upgraded for that origin.

**Acceptance:**
- [x] Script calls `frontier.call('webfetch', 'fetch', { url: 'https://httpbin.org/get' })` and receives the JSON response envelope within one turn.
- [x] Denying consent causes all subsequent requests to that origin to fail fast with `err: consent_denied`.
- [x] 30 rapid requests to one origin: first 20 succeed, remaining receive `err: rate_limit` with a valid `retryAfterMs`. (Validated locally; live suite covered the normal WebFetch path.)
- [x] Requests to blocked schemes return `err: scheme_blocked` without touching the network.
- [x] Side-effectful methods and request bodies return `err: invalid_args` without touching the network.
- [x] Script calls `frontier.call('webfetch', 'search', { query: 'AI Dungeon Frontier' })` and receives an ok search response.

### Phase 6 — Clock module (trivial ops reference)

Low-risk, marketable, validates the ops shape on a minimal module.

**Status:** *completed 2026-04-23*. Clock now exposes `now`, `tz`, and `format` as deterministic safe ops. The module validates IANA time zones through `Intl`, returns structured zone and offset info, and uses UTC as the default time zone for `format()` so scripts get stable cross-user output for patterns like `YYYY-MM-DD`. Local syntax and behavior smoke checks passed first, then the live AI Dungeon suite passed on run `clock-mobxzre5`.

**Files:**
- `modules/clock/module.js` (new)
- `manifest.json` (edit: Clock load order)

**Work:** `ops: { now(args?), tz(args?), format({ ts, format, timeZone? }) }`. No consent needed; purely deterministic. `now` returns `{ ts, iso, timeZone, offsetMinutes, offset, local, date, time }`; `tz` returns the same shape plus `systemTimeZone`; `format` returns a single formatted string and defaults to UTC when `timeZone` is omitted.

**Acceptance:** Script calls `frontier.call('clock', 'now')` and receives `{ ts, iso, tz }` within one turn. `format({ ts: 0, format: 'YYYY-MM-DD' })` returns `'1970-01-01'`.

### Phase 7 — Feature Manager + popup integration

Standard BD plumbing, expanded for the module catalog.

**Files:**
- `core/feature-manager.js` (edit)
- `popup.html` / `popup.js` (edit)
- `main.js` (edit)

**Status:** *completed 2026-04-25*. Frontier is now managed through BetterDungeon's feature system and has its own popup tab with the module catalog, richer module descriptions, WebFetch origin controls, debug mode, and live status.

**Work:**

1. Register Frontier as a top-level managed feature. `init` boots Core; `destroy` tears down Core + all modules cleanly.
2. Popup UI:
   - Frontier master toggle.
   - Per-module toggles: Scripture, WebFetch, Clock, Geolocation, Weather, Network, System.
   - Keep the internal `test` module hidden or development-only.
   - WebFetch permissions panel (per-origin allowlist from Phase 5).
   - Debug mode toggle.
3. Chrome message types: `SET_FRONTIER_DEBUG`, `SET_FRONTIER_MODULE_ENABLED`, `GET_FRONTIER_STATE`, `SET_WEBFETCH_CONSENT`.

**Acceptance:** Popup reflects and controls every toggle. Changes persist across reloads and propagate to Core within one tick. Heartbeat payload reflects enabled modules on every refresh.

### Phase 8 — Story Card DOM + GraphQL drift investigation

**Status:** *completed 2026-04-25*. AI Dungeon's updated Story Card UI still exposes native custom type categories, including `frontier`. `SaveQueueStoryCard` did not drift. The production issue was heartbeat timing: Core could write during the post-boundary / pre-hydration gap and create duplicate `frontier:heartbeat` cards. Fixed by deferring heartbeat until first Story Card hydration, targeting a canonical heartbeat card id, and archiving exact-title duplicates.

**Files:**
- Temporary Phase 8 diagnostic harness (removed after sign-off)
- `services/frontier/ws-interceptor.js`, `ws-stream.js`, `core.js`, `write-queue.js` (inspect; edit only if drift is confirmed)
- `services/ai-dungeon-service.js` (inspect GraphQL mutation replay; edit only if mutation shape changed)
- Frontier docs (update DOM assumptions and transport risks)

**Work:**

1. Update the temporary hunter script into a Phase 8 diagnostic harness:
   - Capture the new Story Card tab DOM: selected tabs, search box, view controls, type category headers, expanded/collapsed state, visible card titles, and type badges.
   - Capture every GraphQL operation name over fetch, XHR, and GraphQL WS, with Story Card operation samples called out separately.
   - Capture Story Card mutation variable keys and response keys so we can detect `SaveQueueStoryCard` renames or shape drift.
   - Add `__frontierActions.diagnoseHeartbeat()` to distinguish "heartbeat not visible in the new UI" from "heartbeat write path did not run".
2. Document the new native AI Dungeon Story Card UI:
   - Story Cards are now a dedicated section tab.
   - Cards are grouped under collapsible type categories.
   - Custom types, including `frontier`, get their own native category.
   - Reserved Frontier cards no longer need BetterDungeon-side DOM filtering in AI Dungeon's native Story Card list.
3. Investigate heartbeat injection failure:
   - Confirm whether `SaveQueueStoryCard` is still emitted when editing/creating Story Cards.
   - Confirm whether the mutation input still accepts `type: "frontier"`, `shortId`, `contentType`, `id`, `title`, `value`, `keys`, `description`, and `useForCharacterCreation`.
   - Confirm whether the mutation response still returns a usable storyCard object or a field that `AIDungeonService._resolveResponseFieldName()` can resolve.
   - Confirm whether `ws-stream.js` still learns the adventure `shortId` and mutation templates before Core schedules `frontier:heartbeat`.

**Acceptance:** The temporary diagnostic harness reports the new DOM categories and Story Card GraphQL operation names clearly. We know whether `frontier:heartbeat` is absent because of a UI move, missing mutation-template capture, a changed mutation name, changed variables, changed response shape, or a Core/write-queue timing issue. Any confirmed production drift gets a targeted fix before Phase 9. **Completed:** no GraphQL drift; heartbeat duplication fixed in Core/write path.

### Phase 9 — Provider AI module

Hosted sidecar model calls through Frontier.

**Files:**
- `modules/provider-ai/module.js` (new)
- `background.js` (edit: privileged provider calls with stored credentials)
- `manifest.json` (edit: module load order and provider host permissions if needed)
- `popup.html` / `popup.js` (edit: Provider AI key/status/defaults)
- `Project Management/frontier/17-provider-ai-phase-plan.md` (completed plan)
- Phase 9 kickoff notes (removed after sign-off; outcome retained here)
- `Project Management/frontier/21-provider-ai-ai-dungeon-test-suite.md` (completed live suite)

**Status:** *completed 2026-04-26*. Provider AI is implemented with OpenRouter-backed `chat`, `models`, and `testConnection` ops, BetterDungeon-held keys, popup configuration, bounded request validation, background-worker provider calls, and unsafe replay protection for paid chat calls. Static checks and VM simulations passed, then live AI Dungeon validation passed on run `provider-ai-mof04zzu` using `inclusionai/ling-2.6-1t:free`.

**Work:**

1. Verify current official OpenRouter API details and model-list behavior before coding. Phase 9 uses `/chat/completions` for model calls, `/models` for discovery, and `/key` for key validation.
2. Implement `providerAI.chat`, `providerAI.models`, and `providerAI.testConnection`.
3. Keep API keys in BetterDungeon storage / background worker only; scripts never receive secrets.
4. Add strict request caps: message count, message length, total content length, max tokens, timeout, and per-adventure rate limits.
5. Normalize responses: provider, model, assistant text, usage if available, finish reason if available, and raw provider metadata only if safe.
6. Add popup settings for API key, enabled state, default model, and connection status.
7. Add static / VM coverage and a paste-ready live AI Dungeon validation suite.

**Acceptance:** Heartbeat advertises `providerAI.chat`, `providerAI.models`, and `providerAI.testConnection`. Missing key fails with `not_configured`; invalid/oversized requests fail with `invalid_args`; mocked provider success/error paths normalize cleanly; live `testConnection` and one short `chat` call succeed through `frontier:in:providerAI`. **Met on 2026-04-26** with run `provider-ai-mof04zzu`.

### Phase 10 — Guide + docs rewrite

BetterRepository content overhaul for V2.

**Files:**
- `BetterRepository/src/components/guides/BetterScriptsGuide.vue` → renamed `FrontierGuide.vue` + restructured
- `BetterRepository/src/components/guides/ScriptureGuide.vue` (new)
- `BetterRepository/src/components/guides/WebFetchGuide.vue` (new)
- `BetterRepository/src/components/guides/ClockGuide.vue` (new)
- `BetterRepository/src/components/guides/GeolocationGuide.vue` (new)
- `BetterRepository/src/components/guides/WeatherGuide.vue` (new)
- `BetterRepository/src/components/guides/NetworkGuide.vue` (new)
- `BetterRepository/src/components/guides/SystemGuide.vue` (new)
- `BetterRepository/src/components/guides/ProviderAIGuide.vue` (new)
- `BetterRepository/src/router/*` (edit)
- `Project Management/docs/01-scripting/api/story-cards-api.md` (edit)

**Work:**

1. `FrontierGuide.vue`:
   - Section 1: Introduction — what Frontier is, the script → BD channel, the BD → script response channel.
   - Section 2: Availability detection — heartbeat card, `frontierIsAvailable` pattern, profile negotiation (`lite` vs `full`), graceful degradation.
   - Section 3: Publishing state — `frontierWriteState` / `frontierReadState` / `frontierUpdateHistory`, the live-count history pattern.
   - Section 4: Calling ops — `frontierCall` / `frontierPoll` / `frontierPollAll`, request-id semantics, multi-turn examples.
   - Section 5: Included modules — Scripture, WebFetch, Clock, Geolocation, Weather, Network, System, and Provider AI (linked).
   - Section 6: Roadmap.
2. Per-module guides:
   - `ScriptureGuide.vue` — 9 widget-type reference material, config options, HTML/CSS sanitization rules, undo/retry behavior.
   - `WebFetchGuide.vue` — op reference, consent flow, rate limits, security caveats, worked examples (weather, wiki lookup, image fetch).
   - `ClockGuide.vue` — op reference, format-string table, worked examples.
   - `GeolocationGuide.vue` — permission posture, `permission`, `getCurrent`, privacy guidance, and graceful denial handling.
   - `WeatherGuide.vue` — Open-Meteo current/forecast ops, place vs coordinates, units, and worked examples.
   - `NetworkGuide.vue` — connection status hints and degraded-mode examples.
   - `SystemGuide.vue` — device/environment/power hints and platform-sensitive examples.
   - `ProviderAIGuide.vue` — OpenRouter key setup, `testConnection`, `models`, `chat`, request caps, unsafe replay behavior, and sidecar reasoning examples.
3. Update router / nav.
4. `story-cards-api.md` — new section documenting reserved `frontier:*`, `scripture:*`, `bd:*` prefixes.
5. Drop ALL ZW / TagCipher / Context Modifier sections.

**Acceptance:** BetterRepository site renders the Frontier guide and all first-party module guides with working TOC + code examples. No references to the legacy BetterScripts system remain.

### Phase 11 — Release prep

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
- [ ] BetterDungeon-owned story-card consumers ignore reserved Frontier cards where they would pollute user-facing lists, analytics, highlights, or automation.
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
| `modules/geolocation/module.js` | post-Clock | Browser geolocation permission/status and current-location ops |
| `modules/weather/module.js` | post-Clock | Open-Meteo current-weather and forecast ops |
| `modules/network/module.js` | post-Clock | Browser online/offline and connection-hint ops |
| `modules/system/module.js` | post-Clock | Coarse device, browser, locale, display, hardware, and power hints |
| `modules/provider-ai/module.js` | 9 | Hosted-model sidecar reasoning ops |
| `06-full-frontier-protocol.md` | 4 | Envelope protocol, request-id scheme, GC, idempotency spec |
| `BetterRepository/src/components/guides/ScriptureGuide.vue` | 10 | Scripture module guide |
| `BetterRepository/src/components/guides/WebFetchGuide.vue` | 10 | WebFetch module guide |
| `BetterRepository/src/components/guides/ClockGuide.vue` | 10 | Clock module guide |
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
| `features/story_card_modal_dock_feature.js` | audit | Ignore reserved-prefix cards if they would appear in BetterDungeon-owned lists |
| `features/story_card_analytics_feature.js` | audit | Ignore reserved-prefix cards if they would skew analytics |
| `features/trigger_highlight_feature.js` | audit | Ignore reserved-prefix cards if they would trigger highlights |
| `features/auto_see_feature.js` | audit | Ignore reserved-prefix cards if they would affect automation |
| `BetterRepository/src/components/guides/BetterScriptsGuide.vue` | 10 | Rename → `FrontierGuide.vue` + restructure for Full profile |
| `BetterRepository/src/router/*` | 10 | Update routes for new guide set |
| `Project Management/docs/01-scripting/api/story-cards-api.md` | 10 | Add reserved-prefix section |

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
8. **Additional modules** — LocalAI, the future `bd.sdk` helper surface, and the long tail tracked in [12 - OS Capabilities Roadmap](./12-os-capabilities-roadmap.md). Provider AI is now promoted into Phase 9. Earlier brainstorm items such as Notify, LocalStorage, Clipboard, Filesystem, Downloads, Share, Presence, and Speech are currently deprioritized or rejected for the turn-based Frontier use case. Each kept module is still an incremental addition on the Full Frontier substrate; none require Core changes.

All of these slot into the existing architecture without refactoring Core.
