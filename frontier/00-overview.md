# 00 — Overview

## Mission

**Frontier** is the standardized bidirectional communication channel between AI Dungeon scripts (running inside AI Dungeon's sandbox) and BetterDungeon (running in the browser with full extension privileges). Its purpose is to **unshackle the scripting sandbox** — giving scenario authors a well-defined way to reach the network, the browser, the operating system, or anything else BetterDungeon can mediate on their behalf.

Frontier is not a feature. It is a **platform** on which features (modules) are built. The widget system that was previously the entire purpose of BetterScripts becomes just one such module, shipped by default: **Scripture**.

## What Frontier replaces

- **BetterScripts** (`features/better_scripts_feature.js`) — the existing widget-only system. Its architecture, protocol, and API are replaced wholesale. No backward compatibility.
- **Zero-width-character encoding** (TagCipher / ZW Binary in the old BetterScripts format) — **fully removed**. Frontier carries no invisible characters in adventure text whatsoever.
- **The hand-rolled Context Modifier boilerplate** — no longer needed. Because nothing Frontier does touches the adventure's visible or model-context text, authors do not need a Context Modifier for Frontier at all.
- **DOM-scraping widget detection** — replaced by a WebSocket interceptor that reads AI Dungeon's own `adventureStoryCardsUpdate` GraphQL subscription directly.

## Vision in one example

A scenario author wants an NPC that can answer real-world questions. They:

1. Install the AI Dungeon Library half of the **WebSearch** Frontier module into their scenario's scripts.
2. Enable the WebSearch module in BetterDungeon's popup.
3. Write script logic like:
   ```js
   const handle = frontier.call('websearch', 'search', { query: 'weather in Los Angeles' });
   state.pendingSearches = state.pendingSearches ?? {};
   state.pendingSearches[handle] = { query: 'weather in Los Angeles' };
   ```
4. On a later turn, the script checks `frontier.pollResponses()` and finds the completed search result, then weaves it into the AI's context so the NPC can speak with real-world knowledge.

Frontier Core handles routing, dedup, availability detection, and turn-cycle scheduling. The WebSearch module handles the actual fetch. The script only sees a clean `call` / `pollResponses` API.

**Scripture** is exactly the same shape, but its module exists to render widget UI in the browser rather than to fetch data. Scripts "call" Scripture by publishing a widget manifest; Scripture renders it.

## Relationship to BetterDungeon V2

Frontier ships as part of the **BetterDungeon V2** major release, which bundles:

1. **Frontier** — this plan.
2. **Android APK** — mobile builds distributed outside the Chrome Web Store / Firefox Add-ons ecosystem.
3. **Firefox listing** — publication on addons.mozilla.org.
4. **Store page reworks** — refreshed listings on all distribution channels.

Frontier's implementation window is gated by BD V2's broader release timing. BetterRepository v1.6 ships first; Frontier work begins after.

## Three-layer mental model

```
┌─────────────────────────────────────────────────────────────┐
│ MODULES (one per capability)                                │
│   Scripture (widgets, built-in, MVP)                        │
│   WebFetch, Clock, Geolocation, Weather, Network,           │
│   System, Provider AI, ...                                  │
├─────────────────────────────────────────────────────────────┤
│ FRONTIER CORE (Lite)                                        │
│   Card-family routing, heartbeat emission,                  │
│   action-ID tracking, module registry, adventure scoping    │
├─────────────────────────────────────────────────────────────┤
│ TRANSPORT (cards only, read-only in MVP)                    │
│   WS interceptor → card-stream → diff events                │
│   GraphQL write path (heartbeat writes only)                │
└─────────────────────────────────────────────────────────────┘
                              ↑
                 AI Dungeon Script Sandbox
              (Library + onInput/onModelContext/onOutput)
                 writes `frontier:state:*` cards
```

- **Transport** is the wire: the WebSocket interceptor observes AI Dungeon's `adventureStoryCardsUpdate` subscription. BD reads cards for free; BD writes only the heartbeat card via GraphQL.
- **Core** is a thin router: reads the card stream, identifies `frontier:*` prefixes, dispatches state-change events to the right module. Tracks the current action ID from the WS frames so modules can look up history entries.
- **Modules** are the capabilities. A Lite module only needs an `onStateChange(name, parsed)` handler and a lifecycle pair (`onEnable` / `onDisable`). No ops, no responses.

## Action-ID history — how undo/retry works without invisible text

Every AI Dungeon action in the `actionWindow` subscription carries a stable `id`. Frontier exploits this so widget state can revert correctly without invisible characters.

**The pattern:**

1. Each turn, the script determines the current action's id (from `history` / `actionWindow` as exposed to the script).
2. The script stores its module's current values under that id inside a single reserved state card:
   ```json
   {
     "v": 1,
     "manifest": { "widgets": [ /* schema-only; ids, types, labels */ ] },
     "history": {
       "action-id-abc": { "hp-bar": 75, "gold": 1250 },
       "action-id-def": { "hp-bar": 70, "gold": 1260 }
     }
   }
   ```
3. The script prunes oldest entries to stay under a configurable cap (default: 100 most-recent entries; see [Size constraints](#constraints-that-drive-the-design)).
4. BD reads `actionWindow` from the WS stream, knows the current tail action id, looks up `history[tailId]`, and uses those values.

**Why this works:**

- **Undo** → AI Dungeon removes the tail action from `actionWindow` → BD sees a different tail id → looks up the older history entry → widgets show older values. The state card itself didn't change; only which key BD reads from it.
- **Retry** → AI Dungeon replaces the tail action with a new one (new id) → script's next `onOutput` writes new values under the new id → BD reads the new entry.
- **Edit / Continue** → same mechanism. BD always looks up whatever the current tail id is.
- **Refresh / session restore** → everything is in the story card + subscription data, so it all round-trips.

**What about gaps?** If BD sees a tail id for which the script has no history entry (e.g. the author just installed the script mid-adventure, or pruned too aggressively), BD falls back to the most-recent available entry, or to default values from the manifest if no history exists. Documented as a soft-degrade, not an error.

## V2 scope — the "unshackle the sandbox" release

> **Scope revision:** the original plan scoped V2 to Frontier Lite (one-way, Scripture only) and deferred two-way comms to a post-MVP epic. The write path was solved ahead of schedule via mutation-template replay — capturing in-flight `SaveQueueStoryCard` mutations and deep-overriding their variables. That eliminated the single biggest risk blocking Full Frontier, so V2 is now re-scoped to deliver the full two-way platform. Details in [04 — Implementation Plan § Scope revision](./04-implementation-plan.md#scope-revision--full-frontier-in-v2).

**In scope for V2:**

- **Transport foundation (landed):** WebSocket interceptor + fetch/XHR shim capturing subscriptions AND mutation templates. Content-script card + action + enrichment stream. Mutation-template replay supporting update AND create operations across any card. Verified end-to-end in a live adventure with persistence across reload.
- **Transport hardening (Phase 1):** write queue with per-card serialization, retry, optimistic echo; action-stream HTTP hydration; adventure-boundary state reset; robust `adventureShortId` resolver.
- **Core + Module Registry (Phase 2):** router, heartbeat emitter, action-ID tracker, shared `ctx` API with `writeCard` + `respond` primitives. Module lifecycle: `onEnable` / `onDisable` / `onStateChange` / `onAdventureChange` / `onOp`.
- **Scripture module (Phase 3):** widget functionality using live-count history. Pixel-identical to legacy BetterScripts. Undo / retry / edit / continue all correct from day one.
- **Full Frontier envelope protocol (Phase 4):** `frontier:out` request queue, per-module `frontier:in:<module>` response cards, request-id scheme, idempotent replay, crash-safe session-storage mirror, script-driven ack + Core-side TTL GC. Full specification in [06 — Full Frontier Protocol](./06-full-frontier-protocol.md).
- **WebFetch module (Phase 5):** HTTP requests from the sandbox, per-origin consent flow, rate limits, scheme allowlist. The canonical two-way demo.
- **Clock module (Phase 6):** real-world `now` / `tz` / `format` ops. Tiny, marketable, validates the ops shape on a minimal module.
- **Feature manager + popup (Phase 7):** Frontier master toggle, per-module toggles, WebFetch allowlist panel, debug mode.
- **Story Card DOM + GraphQL drift investigation (Phase 8):** AI Dungeon now groups Story Cards by native collapsible type categories, including custom types like `frontier`. Phase 8 verified no Story Card GraphQL drift and fixed duplicate heartbeat timing.
- **Provider AI (Phase 9):** OpenRouter-backed hosted-model calls for sidecar script reasoning, with BetterDungeon-held API keys and bounded request shapes. Live validation passed on 2026-04-26.
- **Guide + docs rewrite (Phase 10):** `FrontierGuide.vue`, `ScriptureGuide.vue`, `WebFetchGuide.vue`, `ClockGuide.vue`. Full-profile coverage including ops examples. No ZW / TagCipher / Context Modifier content.
- **Multiplatform smoke test (Phase 11):** verify on Chromium, Gecko, AND Android WebView before shipping `2.0.0`.

**Explicitly out of V2 (designed-for but not implemented):**

- **Invisible-text transport.** Dropped entirely. The undo/retry problem is solved by live-count history instead.
- **Sandboxed user scripts.** Arbitrary JS modules in an iframe / Worker with a constrained Frontier SDK. Security-heavy; post-V2.
- **Third-party module registry UI.** Architecturally unblocked by Phase 4 but the UI and trust model are their own workstream.
- **`story-card-scanner.js` cut-over.** Keep the existing DOM-scanner pathway; ws-stream can optionally hydrate the cache, but the scanner still runs. Full cut-over is a post-V2 follow-up.
- **NPM / TypeScript / bundler migration** (per decision #10 below).
- **LocalAI and broader third-party AI surfaces.** Provider AI is now in V2 Phase 9; LocalAI remains deferred for the Robyn design pass.

## Locked-in decisions

Six rounds of planning questions have produced the following commitments. Re-open only if something material changes.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **No backward compatibility** with the old BetterScripts wire protocol. ZW encoding fully removed; no invisible characters anywhere in Frontier. | Essentially no production scripts depend on the old format. Action-ID history solves undo/retry without invisible text, so we never need the codec. |
| 2 | **Cards-only transport.** `frontier:state:<name>` cards (script → BD) + `frontier:heartbeat` (BD → script, one card). | Simplest possible wire. Everything AI-Dungeon-native. No side channels. |
| 3 | **Full Frontier ships in V2** — two-way (script ↔ BD) with `frontier:out` request queue and per-module `frontier:in:<module>` response cards. ~~_(Superseded)_ Originally scoped as Lite-only; promoted after the write path was solved via mutation-template replay.~~ | The biggest risk blocking two-way comms — auth token capture / endpoint discovery / CSRF handling — was sidestepped entirely by replaying captured mutation templates. Full Frontier's remaining work (envelope protocol, ops dispatcher, ack/GC) is ~40% of Lite's scope rather than the 3-4× originally feared. V2 delivers the "unshackle the sandbox" vision the project was founded on. |
| 4 | **Action-ID history** for per-turn state that must track undo/retry. Scripts keep `{ [actionId]: values }` in their state card; BD looks up the current tail's entry. | Robyn's insight: AI Dungeon actions carry stable ids in the `actionWindow`. No invisible text needed; everything is in cards + subscriptions. |
| 5 | **File layout: `services/frontier/` + `modules/scripture/`.** | Core is infrastructure (services); modules are semantically distinct from BD features (own top-level dir). |
| 6 | **First-party modules only in V2.** Registry UI + sandboxed user scripts deferred. V2 ships Scripture, WebFetch, Clock, Geolocation, Weather, Network, System, and Provider AI; third-party trust model is a post-V2 epic. | Keeps V2 tractable while shaping the module interface so plugins can slot in later. |
| 7 | **Do not manually filter AI Dungeon's native Story Card list.** AI Dungeon now groups cards by type in native collapsible categories, including custom types. Frontier reserved cards may live in their own `frontier` category. | This keeps BetterDungeon out of brittle DOM filtering and lets the native UI organize custom transport cards for us. |
| 8 | **Multiplatform by default.** Every design choice must work on Chromium, Gecko, AND Android WebView. Fallbacks documented inline. | BD V2 ships on all three; Frontier can't be the feature that breaks platform parity. |
| 9 | **Phase ordering: transport → Core → Scripture → Full envelope → ops modules → polish.** Each phase has a standalone acceptance criterion; partial progress is always shippable if we need to cut scope under pressure. | Fastest path to visible, testable wins at each step. Scripture lands in Phase 3 (giving us a demo-able superset of Lite), Full Frontier in Phase 4 (unlocking ops modules), and WebFetch/Clock in 5–6 validate the envelope design with real modules. |
| 10 | **No NPM / TypeScript / bundler migration.** Keep pure-JS, manifest-based content scripts. | Out of scope for this plan. Robyn's pitch is acknowledged but declined for now; re-open as a separate epic later. |
| 11 | **Action-ID stability is verified empirically in Phase 0.** We commit to the cards-only design on the assumption that action ids survive retry/edit/continue as expected; Phase 0 tests it before Phase 1 starts. | The whole design rests on this. Better to verify once than debug a flaky foundation forever. |

## Constraints that drive the design

- **Script side is turn-gated.** AI Dungeon scripts only execute during `onInput`, `onModelContext`, and `onOutput` hooks. They cannot write outside of a turn cycle. All script-side writes happen at most once per turn.
- **Extension side is always-on.** BetterDungeon's content script runs continuously while the adventure tab is open. It can receive WebSocket frames (cards AND action list) and issue GraphQL mutations at any moment.
- **Story cards are persistent.** Story cards do NOT revert on undo/retry (Robyn empirically confirmed). Frontier uses this as the persistence substrate; the action-ID history pattern layers turn-sensitive lookup on top of persistent storage.
- **Actions carry stable ids.** Every AI Dungeon action in the `actionWindow` subscription has a unique id that survives retry/edit as long as the action is still in history. This is the other foundation of Frontier's correctness. (Phase 0 verifies behavior in every edge case.)
- **Card size limits apply.** A single card's `value` has practical length limits (exact bound TBD during Phase 0 instrumentation; preliminary estimate ~8 KB before server-side risk). The history map defaults to 100 most-recent entries; authors can override via `scriptureConfigure({ historyLimit: N })`. Larger modules may eventually need to spill into supplementary cards, but MVP does not.
- **Native wire only.** We deliberately do not open a side channel (direct WebSocket, new backend, custom DOM marker). All communication goes over AI Dungeon's own card + subscription system, so state is always consistent with what AI Dungeon itself knows.

## Glossary

| Term | Definition |
|------|------------|
| **Frontier** | The platform. Transport + Core + modules. |
| **Frontier Lite** | The MVP shape of Frontier — one-way (script → BD), cards-only, no ops. This is what Phase 1 ships. |
| **Full Frontier** | The post-MVP extension adding two-way comms (requests/responses, ops, multi-turn). Planned; not designed in detail yet. |
| **Frontier Core** | The routing layer. Lives in `services/frontier/core.js`. Module-agnostic. In Lite: reads card stream, tracks action id, dispatches to modules, emits heartbeat. |
| **Module** | A capability that plugs into Frontier Core. Has an AI-Dungeon-side Library adapter + a BetterDungeon-side handler. In Lite: the handler only needs `onStateChange` + lifecycle hooks. |
| **Scripture** | The first / reference module. Renders widget UI in the top bar above the story text. |
| **State card** | A reserved `frontier:state:<name>` story card that a script uses to publish module-specific state. For Scripture, this is `frontier:state:scripture`. |
| **Heartbeat card** | `frontier:heartbeat` — the card BD Core writes each turn to advertise its presence, protocol version, and enabled modules. |
| **Action ID** | The stable identifier AI Dungeon assigns to each action (turn). Frontier scripts key their per-turn history by this id so BD can look up the correct values when the tail action changes (undo, retry, edit). |
| **Action window** | AI Dungeon's subscription-pushed list of recent actions with ids. BD reads the tail (latest) id to know which history entry to display. |
| **History map** | The `{ [actionId]: values }` object a script embeds in its state card alongside the manifest. |
| **Manifest** | The schema half of a state card — widget definitions, types, labels, colors. Rarely changes. |
| **Reserved card** | Any story card whose title begins with `frontier:*`. Hidden from BD's own card-listing UI; never from AI Dungeon's native one. |
