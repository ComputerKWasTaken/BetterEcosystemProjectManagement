# 00 — Overview

## Mission

**Frontier** is the standardized bidirectional communication channel between AI Dungeon scripts (running inside AI Dungeon's sandbox) and BetterDungeon (running in the browser with full extension privileges). Its purpose is to **unshackle the scripting sandbox** — giving scenario authors a well-defined way to reach the network, the browser, the operating system, or anything else BetterDungeon can mediate on their behalf.

Frontier is not a feature. It is a **platform** on which features (modules) are built. The widget system that was previously the entire purpose of BetterScripts becomes just one such module, shipped by default: **Scripture**.

## What Frontier replaces

- **BetterScripts** (`features/better_scripts_feature.js`) — the existing widget-only system. Its architecture, protocol, and API are replaced wholesale. No backward compatibility with the old BetterScripts wire format.
- **TagCipher / ZW Binary encodings** (the old BetterScripts invisible-character format) — replaced by Robyn's redesigned, significantly more efficient `invisible-unicode-decoder` codec, ported into Frontier as the **text transport**.
- **The hand-rolled Context Modifier boilerplate** that every BetterScripts author had to paste into their scenario — replaced by a trivial one-line call to a Frontier Library helper (`frontierContextModifier(text)`).

**Note:** invisible-text encoding is *not* going away — it's fundamental to Scripture's correctness. The reason is covered under [Two transports](#two-transports) below.

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
│ MODULES (pluggable, one per capability)                     │
│   Scripture (widgets, built-in)                             │
│   (future) WebFetch, Clock, Geolocation, LocalAI, ...       │
├─────────────────────────────────────────────────────────────┤
│ FRONTIER CORE                                               │
│   Envelope routing, transport selection, request dedup,     │
│   availability heartbeat, multi-turn state, ack/TTL         │
├─────────────────────────────────────────────────────────────┤
│ TRANSPORT (two channels)                                    │
│   ▸ Story-card channel: WS interceptor (read) + GraphQL     │
│     mutations (write). Persistent.                          │
│   ▸ Invisible-text channel: Robyn's ZW codec ported to JS.  │
│     Ephemeral — reverts with adventure text on undo/retry.  │
└─────────────────────────────────────────────────────────────┘
                              ↕
                 AI Dungeon Script Sandbox
              (Library + onInput/onModelContext/onOutput)
```

- **Transport** is the wire: how bytes move between the script and the extension. Two channels with complementary semantics (see [Two transports](#two-transports)). Agnostic to any module.
- **Core** is the protocol: envelope shape, transport routing, request/response correlation, heartbeat, multi-turn state.
- **Modules** are the capabilities: concrete features built on top of Core. Each module is a matched pair — an AI-Dungeon-side Library and a BetterDungeon-side handler. Modules declare a default transport; individual envelopes can override.

## Two transports

The single most important architectural property of Frontier is that it uses **two different transports** for two different kinds of data:

| Property | Story-card channel | Invisible-text channel |
|---|---|---|
| **Persistence** | Persistent across undo / retry / edit / refresh | Tied to the turn's output; reverts with turn history |
| **Cost to AI context** | None (story cards aren't in the model context unless the user adds them as triggers) | Zero visible text, but the raw ZW chars ARE in context unless stripped. A one-line Context Modifier helper handles this. |
| **Writable by** | Script (hooks) + BD (GraphQL, always-on) | Script only (during `onOutput`) |
| **Natural use** | Schemas, long-lived state, request/response queues, large payloads | Per-turn *values* (current HP, gold count, timers), ephemeral metadata |
| **Example (Scripture)** | Widget manifest: ids, types, labels, colors, layout — the schema | Per-turn widget values: current HP = 75, current gold = 1250 |

**Why both?** Robyn's empirical test confirmed that story cards do *not* revert on undo/retry, while adventure text does. If widget *values* live in story cards, hitting undo leaves the widgets stuck showing post-undo values while the narrative has rolled back. If values live in invisible text embedded in the turn's output, they naturally revert alongside the text. Schemas (rarely changing) belong in cards; values (per-turn) belong in text. This maps cleanly onto a protobuf-style mental model: the card is the `.proto` definition, the invisible text is the wire-encoded message.

**For MVP**, invisible-text payloads are serialized as plain JSON (no schema compression yet). Schema compression — where the card defines field types and the text carries only tightly-packed values — is a Phase 2 improvement that can dramatically shrink text footprint.

## MVP scope

**In scope for the first shippable release:**

- Transport (card channel): WebSocket interceptor (page world) + story-card stream service + GraphQL write path for BD-to-script writes.
- Transport (text channel): manual port of Robyn's `invisible-unicode-decoder` to `services/frontier/text-codec.js`; encode/decode of per-turn value envelopes; Context Modifier helper in the base Library.
- Core: module registry, envelope routing across both transports, transport selection (per-module default + per-envelope override), dedup, heartbeat emission, multi-turn state tracking, ack/TTL machinery (card-transport only — text-transport envelopes are naturally GC'd by turn reversion).
- Scripture module: widget functionality split across both transports — manifest (schema/structure) in card, values (dynamic data) in invisible text. Correct undo/retry behavior from day one.
- Feature manager integration: Frontier master toggle + per-module toggles. Global invisible-text toggle (default on) + per-module invisible-text toggle. Hierarchical.
- Popup UI updates.
- BD UI filtering: hide `frontier:*` story cards from BetterDungeon-rendered views.
- Guide + docs rewrite.

**Explicitly out of MVP (designed for, not implemented):**

- **Schema compression** for invisible-text envelopes. MVP text payloads are plain JSON; Phase 2 adds protobuf-style schema definitions in the manifest card with tightly-packed value encoding.
- No new capability modules (no WebFetch, Clock, Geolocation, etc.). Core's write path works but only the internal heartbeat exercises it; a stub `echo` module exists for internal testing only.
- No migration of `story-card-scanner.js` (originally locked in for an earlier round — deferred).
- No module registry or sandboxed user-scripts — APIs shaped so they can slot in later without refactoring.

## Locked-in decisions

Five rounds of planning questions have produced the following commitments. Re-open only if something material changes.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **No backward compatibility** with the old BetterScripts wire protocol. ZW encoding returns in a new, Robyn-designed form as one of two transports. | Essentially no production scripts depend on the old BetterScripts format. The *technique* (invisible text) is still the best tool for ephemeral per-turn data because of undo/retry semantics. |
| 2 | **Hybrid card model** — dedicated protocol cards + optional persistent state cards | Matches the asymmetry between request/response traffic and long-lived UI state (Scripture) |
| 3 | **MVP: Transport + Core + Scripture only** (no scanner migration, no new capability modules) | Smallest safe ship that repackages existing functionality under the new platform |
| 4 | **File layout: `services/frontier/` + `modules/scripture/`** | Core is infrastructure (services); modules are semantically distinct from BD features (own top-level dir) |
| 5 | **Modules are built-in for MVP**, registry + sandboxed user scripts deferred | Keeps MVP tractable while ensuring APIs don't paint us into a corner |
| 6 | **One outbound card + one inbound card per module** | Clean asymmetry matching turn-gated writes vs. always-on reads; matches Robyn's "one card per enabled script" intuition |
| 7 | **Hide `frontier:*` cards in BetterDungeon UI surfaces only** | Minimal intrusion; don't touch AI Dungeon's native Story Card list |
| 8 | **Dual-transport MVP** — story cards + invisible text, with plain JSON in the text channel (schema compression deferred to Phase 2) | Correct undo/retry behavior from day one for Scripture; schema compression is a pure optimization that can land later without protocol breakage |
| 9 | **Per-module default transport + per-envelope override** | Minimizes Library boilerplate (Scripture's Library can pick the right transport automatically) while keeping escape hatches open |
| 10 | **Manual port** of Robyn's `invisible-unicode-decoder` (TS) to vendored plain JS at `services/frontier/text-codec.js` | Zero build-tooling overhead for BetterDungeon's current pure-JS setup; accept periodic manual re-ports as Robyn iterates upstream |
| 11 | **Global + per-module hierarchical toggle** for invisible text, surfaced in the popup AND advertised in the heartbeat | Users who dislike invisible chars can opt out entirely; scripts can read the heartbeat to degrade gracefully when text transport is disabled |

## Constraints that drive the design

- **Script side is turn-gated.** AI Dungeon scripts only execute during `onInput`, `onModelContext`, and `onOutput` hooks. They cannot write outside of a turn cycle. Outbound protocol traffic from the script happens in bursts, one per turn.
- **Extension side is always-on.** BetterDungeon's content script runs continuously while the adventure tab is open. It can receive WebSocket frames and issue GraphQL mutations at any moment.
- **Story cards are persistent. Adventure text is history-linked.** Story cards do NOT revert on undo/retry (empirically confirmed). Adventure text blocks are turn-history-bound: when a turn is undone, that turn's text block (and anything embedded in it) disappears. Frontier exploits both properties: persistent things live in cards, ephemeral turn-bound things live in invisible text.
- **Both transports are AI-Dungeon-native.** We deliberately do not try to open a side channel (direct WebSocket, new backend, custom DOM marker). Cards go over AI Dungeon's GraphQL / Story Card system; text rides inside AI Dungeon's own output blocks. State is always consistent with what AI Dungeon itself knows.
- **Card size limits apply.** A single card's `value` has practical length limits (exact number TBD during implementation). Large payloads spill into separate state cards.
- **Invisible text is visible to the AI.** Zero-width chars ARE in the model context unless stripped. A one-line Context Modifier (provided by the Frontier base Library as `frontierContextModifier`) handles this.

## Glossary

| Term | Definition |
|------|------------|
| **Frontier** | The platform. The whole thing: transport + core + modules. |
| **Frontier Core** | The protocol layer. Lives in `services/frontier/core.js`. Module-agnostic. |
| **Module** | A capability that plugs into Frontier Core. Has an AI-Dungeon-side Library + a BetterDungeon-side handler. |
| **Scripture** | The first / reference module. Renders widget UI in the top bar above the story text. |
| **Envelope** | A single message on the wire. JSON object with `id`, `module`, `op`/`replyTo`, `payload`, `ts`, etc. Carries an optional `transport` field. |
| **Transport** | How a message crosses between the script and BD. Two options: **card transport** and **text transport**. |
| **Card transport** | Messages flow through reserved Story Cards (`frontier:out`, `frontier:in:*`, `frontier:state:*`). Persistent; survives undo. |
| **Text transport** | Messages flow as invisible zero-width characters embedded in the AI Dungeon output text. Ephemeral; reverts with the turn. |
| **Text codec** | The encoder/decoder at `services/frontier/text-codec.js`, ported from Robyn's `invisible-unicode-decoder`. Handles framing, encoding, decoding. |
| **Protocol card** | A Story Card whose title is in a reserved `frontier:*` / `scripture:*` namespace. Not meant for user consumption. |
| **Heartbeat card** | `frontier:heartbeat` — the card BD Core writes each turn to advertise its presence, capabilities, and which transports are enabled. |
| **Ephemeral envelope** | An envelope sent over text transport; has no ack or TTL because natural turn-history GC handles cleanup. |
| **Persistent envelope** | An envelope sent over card transport; subject to ack/TTL rules. |
