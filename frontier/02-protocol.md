# 02 — Protocol (v1)

Canonical wire-protocol specification for Frontier v1. Implementations on both sides (AI-Dungeon-side Library, BetterDungeon-side Core) MUST conform to this document.

> **Scope:** Frontier is **cards-only, bidirectional**. Scripts publish state to `frontier:state:<name>` cards and enqueue ops on `frontier:out`; BD publishes its heartbeat on `frontier:heartbeat` and writes op responses to `frontier:in:<module>`. The protocol ships with two **profiles** advertised in the heartbeat: `"lite"` (state-only) and `"full"` (state + ops). A module that declares no `ops` works identically under both profiles. V2 ships with `profile: "full"` active. The envelope protocol for the ops channel (request schemas, id scheme, status lifecycle, GC) is documented in depth in [06 — Full Frontier Protocol](./06-full-frontier-protocol.md); this document covers the card families themselves.

## Reserved namespaces

Story cards whose `title` matches these prefixes are reserved and handled specially:

| Prefix | Direction | Purpose |
|--------|-----------|---------|
| `frontier:state:<name>` | Script → BD | Persistent state the script publishes; module-specific semantics. This is the MVP's sole script-to-BD channel. |
| `frontier:heartbeat` | BD → Script | BD liveness beacon + module advertisement. Written by Core, read by scripts. |
| `frontier:out` | Script → BD | Request queue for the ops channel. One card per adventure; holds an envelope with `requests[]` (new ops to dispatch) + `acks[]` (ids of responses the script has finished reading). Schema in [06 — Full Frontier Protocol](./06-full-frontier-protocol.md#request-envelope-inside-frontierout). |
| `frontier:in:<module>` | BD → Script | Response cards for the ops channel, sharded per module. Each card holds `{ responses: { [id]: { status, data?, error? } } }`. Sharding means large responses from one module don't bloat unrelated modules' inbound data. Schema in [06 — Full Frontier Protocol](./06-full-frontier-protocol.md#response-envelope-inside-frontierinmodule). |
| `scripture:*` | (reserved) | Unused; reserved for future Scripture-internal extensions. |
| `bd:*` | (reserved) | Reserved for BetterDungeon-internal use outside Frontier. |

All reserved cards (including the unused Full-Frontier ones) are filtered out of BetterDungeon's own UI surfaces (see [01 — Architecture](./01-architecture.md#other-features-that-consume-story-cards)). AI Dungeon's native Story Card list still shows them.

## Card families in detail

### `frontier:state:<name>`

Persistent script-published state. Module-specific semantics. The script writes; BD reads. Complemented on the ops channel by `frontier:out` for request/response traffic; state cards are the persistence layer, `frontier:out` is the RPC layer.

**Cardinality:** one per module that uses it (e.g. `frontier:state:scripture`).
**Lifetime:** persists for the adventure's lifetime unless the script deletes it. Survives undo, retry, edit, refresh.
**Size:** bounded by the story card `value` size limit (see [Size limits](#size-limits)).
**Written by:** the script, during `onOutput` (or any hook).
**Read by:** Core dispatches parse + `onStateChange(name, parsed)` to the module that declared `stateNames: ['<name>']`.

#### Live-count history convention

For modules whose displayed state must track undo/retry (e.g. Scripture widgets showing per-turn HP), the state card uses the **live-count history** pattern. The card holds two parts:

- A **manifest** — structural, schema-like; rarely changes.
- A **history map** — `{ [liveCount]: values }` entries; one per turn the script has written.

Example for Scripture:

```json
{
  "v": 1,
  "manifest": {
    "widgets": [
      { "id": "hp-bar", "type": "bar", "label": "HP", "max": 100, "color": "green", "align": "center" },
      { "id": "gold",   "type": "stat", "label": "Gold", "align": "right" }
    ]
  },
  "history": {
    "2": { "hp-bar": 100, "gold": 0 },
    "4": { "hp-bar": 95,  "gold": 25 },
    "5": { "hp-bar": 75,  "gold": 1250 }
  },
  "historyLimit": 100
}
```

**Why live-count, not wire action ids?** AI Dungeon's script environment does **not** expose wire action ids. Output Modifier `history[i]` entries expose only `{ text, type, rawText }` — no `id` field. So scripts cannot key by the same ids BD observes on the wire. The live-count ordinal is the one ordinal both sides can derive natively and agree on.

**Semantics:**

- Each key in `history` is a **live-count ordinal** — the number of live (non-undone) actions this adventure will have *after* the turn that wrote the entry completes. Both sides compute it trivially:
  - **Script-side** at Output Modifier time: `String(history.length + 1)`. `history` already excludes undone actions; adding 1 accounts for the AI response being generated.
  - **BD-side** at any moment: `String(actions.filter(a => a.undoneAt === null).length)`.
- The two formulas produce the same integer by construction. Both sides serialize it as a decimal string so JSON object keys are unambiguous.
- On each turn, the script writes values under the current key and prunes older entries to keep `history` under `historyLimit` (default 100).
- **Undo:** live count drops by 1 (or more on multi-undo) → BD reads a lower key → widgets revert to the earlier turn's values.
- **Retry:** live count is **unchanged** (one action's `undoneAt` flips, a replacement is created) → next modifier call writes under the **same** key → replacement values overwrite the original's. This matches what the user sees displayed.
- **Edit:** live count is unchanged. A pure edit does not trigger a modifier, so the script does not write; BD continues to show the previously-written values for that key, which is correct because the edit modifies `text` only, not widget state.
- **Rewind:** live count drops by the number of actions rewound past → BD reads a correspondingly earlier key.
- **Continue / Take-a-turn:** treated as normal forward turns; new key is written.
- **Missing key fallback:** if `history[currentKey]` is absent (script wasn't installed for that turn, or writes failed), BD SHOULD fall back to the nearest-earlier available entry, then to manifest-declared defaults.

**Modules that don't need per-turn history** (e.g. a future Clock widget showing real-time) can omit the `history` map entirely and put values directly inside `manifest`.

#### Non-history state cards

Modules may use a different shape if their state is not action-bound. The only hard requirement: the top-level value MUST be a JSON object with a `v` field identifying the state-card schema version.

### `frontier:heartbeat`

BD Core's liveness and capability beacon. Scripts read this to detect whether Frontier is installed, enabled, and which modules are currently active.

**Cardinality:** exactly one per adventure.
**Lifetime:** written by Core on adventure load and refreshed at least once per turn (coalesced with other Core writes when possible).
**Written by:** BD only. Scripts MUST NOT write this card.

**Value schema (JSON):**
```json
{
  "v": 1,
  "frontier": { "version": "2.0.0", "protocol": 1, "profile": "full" },
  "ts": 1700000000000,
  "turn": 42,
  "tailActionId": "42",
  "liveCount": 38,
  "modules": [
    { "id": "scripture", "version": "1.0.0", "stateNames": ["scripture"] },
    { "id": "webfetch",  "version": "1.0.0", "ops": ["fetch"] },
    { "id": "clock",     "version": "1.0.0", "ops": ["now", "tz", "format"] }
  ]
}
```

- `frontier.version` — BetterDungeon's Frontier version (SemVer).
- `frontier.protocol` — wire protocol version. Scripts SHOULD check `protocol === 1` before publishing state or enqueuing ops.
- `frontier.profile` — `"full"` in V2. A V1 `"lite"` Core (hypothetical; never released) would have omitted `frontier:out` / `frontier:in:*` handling. Scripts branch on this to avoid enqueuing ops against a Core that can't service them.
- `ts` — millisecond timestamp of this heartbeat.
- `turn` — AI Dungeon's `actionCount` at which this heartbeat was written. Scripts use this to detect staleness.
- `tailActionId` — the current tail action id Core has observed (numeric string, e.g. `"60"`). Scripts SHOULD cross-check this against their own `history[history.length-1].id` to detect misalignment.
- `liveCount` — non-undone action count at the time of write. Complements `tailActionId`; scripts keying state by live-count ordinal cross-check this rather than tail id.
- `modules` — array of currently enabled modules. Each entry:
  - `id`, `version` — identification.
  - `stateNames` — which `frontier:state:<name>` cards this module reads (present if the module consumes state).
  - `ops` — which ops the module declares (present if the module has an ops handler). Scripts feature-detect specific ops via `heartbeat.modules.find(m => m.id === 'webfetch')?.ops?.includes('fetch')`.

A module MAY advertise both `stateNames` and `ops` simultaneously; they are independent capabilities.

## AI Dungeon observation channels

BD observes AI Dungeon's backend over a single GraphQL-over-WebSocket connection to `wss://api.aidungeon.com/graphql`. Three subscription payloads drive Frontier:

| Payload key (under `data`) | Direction | Cadence | Purpose in Frontier |
|---------------------------|-----------|---------|---------------------|
| `adventureStoryCardsUpdate` | Server → Client | **Only when the server originates the write** (see note) | Carries the full `storyCards` array. BD diffs against its last snapshot to detect added / changed / removed cards. This is the channel by which BD observes Scripture's AID-script-written state cards. |
| `contextUpdate` | Server → Client | Every turn (during prompt build) | Carries `actionId` for the upcoming turn plus the prompt context. BD reads `actionId` as the current tail. |
| `actionUpdates` | Server → Client | Every action mutation (create, edit, undo, rewind, delete) | Full `actions[]` snapshot with `id`, `undoneAt`, `text`, and `retriedActionId`. This is what fires on user-initiated edits, undos, rewinds, and deletions. |

`contextUpdate` and `actionUpdates` share a `key` (UUID) field per turn, so BD can correlate them when needed.

> **`adventureStoryCardsUpdate` firing rule.** Empirically verified (Phase 1 Commit 1 smoke test). The subscription fires only for card writes the **server** originated — i.e. writes from AI Dungeon's server-side script sandbox (`storyCards[i].value = ...` or `addStoryCard(...)` inside an Input/Output Modifier). It does **not** fire for client-initiated edits via the AID UI, nor for BD's own `updateStoryCard` mutations — those travel as HTTP mutations and the initiator learns the result from the response. This is the desired behavior for Frontier: Scripture's state cards are written exclusively by its AID output-modifier script, so every state change naturally produces a push. Scripture's **manifest** card, written by BD from the popup UI, takes the HTTP path; BD updates its local cache directly and no echo is needed. See `BetterDungeon/services/frontier/ACTION_IDS.md` for the full protocol record.

### Action-ID properties (confirmed)

- **Numeric string.** Ids are strings containing a decimal integer (`"0"`, `"1"`, …).
- **Monotonic, +1 per action.** Each new action's id is the previous id plus one. Both user input and AI output count as actions — a story/do/say submit creates two ids (user input + AI response); a continue creates one (AI response only); a retry creates one (the replacement AI response).
- **Stable for life.** Edit, undo, rewind, retry, and delete never renumber. An action's id is assigned at creation and never changes.
- **Never reused.** After a rewind marks ids 2–6 as undone, the next submit gets ids 7 and 8, not recycled slots. Undone ids stay allocated forever.
- **Soft deletion.** Removal is expressed by setting `undoneAt` to an ISO timestamp; the action remains in `actions[]`. Restoring sets `undoneAt` back to `null`.
- **Retry creates, never mutates.** Confirmed via Phase 0 capture: retry emits an `actionUpdates` frame containing the original (with `undoneAt` now set) **and** a new action at `tail+1` whose `retriedActionId` points back to the original. The new action's `text` is the regenerated output. The user-visible displayed text is the new action's; the original is retained only as history.
- **Live count vs tail id.** These are different numbers. **Tail id** (`max(id where undoneAt === null)`) is the anchor for ordering actions on the wire. **Live count** (`actions.filter(a => !a.undoneAt).length`) is the anchor for script-side history lookups. On normal turns they both advance together; on retry, tail id advances but live count stays the same; on rewind, live count drops but the maximum tail id ever seen does not.

### Event-to-channel matrix

| User action | `contextUpdate` | `actionUpdates.type` | `SendEvent.eventName` |
|---|:---:|:---:|:---|
| Story / Do / Say submit | yes (tail +1) | `create`, `n=2` (user + AI) | `submit_button_pressed`, then `action_roundtrip_completed` |
| Continue | yes (tail +1) | `create`, `n=1` (AI only) | `continue_button_pressed`, then `action_roundtrip_completed` |
| Take-a-turn | yes (tail +1) | `create`, `n=1` or `n=2` depending on mode | `take_a_turn_button_pressed`, then `action_roundtrip_completed` |
| Retry | yes (tail +1) | `create`, `n=2` carrying `retriedActionId` (original + new) | `retry_button_pressed`, then `action_roundtrip_completed` |
| Edit | no | `update`, `n=1` (`text` changed) | `edit-action` with `actionId` |
| Undo | **no** | `update`, `n=1` (`undoneAt` set) | **none** |
| Restore (redo) | **no** | `update`, `n=1` (`undoneAt` cleared) | **none** |
| Delete (erase) | no | `update`, `n=1` (`undoneAt` set) | `erase_button_pressed` |
| Rewind | no | `update`, `n=count rewound past` (`undoneAt` set on each) | `rewind-to-here` with `actionId` + `position` |

Two architectural consequences fall out of this matrix:

1. **`contextUpdate.actionId` is NOT a reliable single source of truth for the tail.** It does not fire on undo / restore / delete / rewind. BD Core MUST derive the tail from `actions[]`: `tail = max(id where undoneAt === null)`. Use `contextUpdate.actionId` only as a supplementary early signal on new-turn events (it fires before the corresponding `actionUpdates` frame).
2. **Undo and restore are observable only via `actionUpdates`.** There is no `SendEvent` counterpart. BD Core MUST NOT rely on `SendEvent` to detect either.

### Observation-only

BD does NOT need to hook the client-originated `UpdateActions` mutation (edit/undo/rewind/delete). The server rebroadcasts the resulting state via `actionUpdates` over the subscription, so one observation point covers both user-initiated and server-initiated changes.

### Injection requirements

- The shim that observes these subscriptions MUST be installed before AI Dungeon's bundle constructs its WebSocket. In the extension this means a content script registered with `"world": "MAIN"` + `"run_at": "document_start"`.
- The shim MUST use the `class extends NativeWebSocket` pattern (not a function wrapper) to preserve `instanceof` checks inside Apollo Client.

## Availability detection

### Positive detection (recommended)

The Library provides a helper:

```js
function frontierIsAvailable(opts = {}) {
  const { maxStaleTurns = 2, requireModules = [] } = opts;
  const card = storyCards.find(c => c.title === 'frontier:heartbeat');
  if (!card) return false;
  let hb;
  try { hb = JSON.parse(card.entry || card.value || '{}'); } catch { return false; }
  if (hb.frontier?.protocol !== 1) return false;
  if (typeof hb.turn === 'number' && info.actionCount - hb.turn > maxStaleTurns) return false;
  if (requireModules.length) {
    const available = new Set((hb.modules || []).map(m => m.id));
    if (!requireModules.every(m => available.has(m))) return false;
  }
  return true;
}
```

**Script pattern:**

```js
const modifier = (text) => {
  if (frontierIsAvailable({ requireModules: ['scripture'] })) {
    // Enrich output with Scripture widgets
    updateScriptureManifest();
  } else {
    // Fallback: do nothing, or emit plaintext status line, etc.
  }
  return { text };
};
```

### Staleness handling

A heartbeat card can exist but be stale in three realistic scenarios:

1. **User disabled Frontier mid-session.** Heartbeat stops refreshing. Scripts should treat the feature as unavailable after `maxStaleTurns` without refresh.
2. **User installed Frontier but never loaded this adventure since.** On first load, heartbeat is absent for one turn while Core initializes. Scripts should tolerate absence on turn 1.
3. **User's BetterDungeon tab is in the background and throttled.** Heartbeats may be briefly delayed. Default `maxStaleTurns = 2` provides slack.

## Ops channel (Full profile)

When `heartbeat.frontier.profile === "full"`, the ops channel is active. Its full envelope schema, request-id scheme, status lifecycle, idempotency rules, and GC strategy live in [06 — Full Frontier Protocol](./06-full-frontier-protocol.md). This section summarizes the surface visible at the card-protocol level so readers of 02 don't need to context-switch for basic understanding.

- **`frontier:out`** is a single card holding `{ v: 1, requests: [...], acks: [...] }`. Scripts append new request envelopes (`{ id, module, op, args, ts }`) and append ids to `acks` after reading the corresponding response. Core treats request ids as idempotent — re-submitting the same id triggers exactly one handler invocation.
- **`frontier:in:<module>`** is one card per module with `{ v: 1, responses: { [id]: { status, ...} } }`. Status lifecycle: `pending` → `ok` | `err` | `timeout`. Core writes `pending` immediately on dispatch and the terminal status when the handler resolves.
- **Request ids** follow `<liveCount>-<moduleId>-<seq>` so replay after refresh is naturally idempotent and ids sort chronologically within a turn.
- **GC** is two-tier: script-driven ack (primary) and Core TTL (safety net, default 10 turns).
- **Reserved error codes** (`unknown_module`, `unknown_op`, `invalid_args`, `consent_denied`, `rate_limit`, `timeout`, `handler_threw`, plus module-namespaced codes like `webfetch:scheme_blocked`) are documented in 06. Modules MUST NOT reuse reserved codes for different meanings.

### Graceful degradation

Implementations MUST ignore unknown card prefixes and unknown heartbeat fields. Consequences:

- A Lite-profile Core encountering `frontier:out` on a card feed from a Full-profile script: ignores the card, logs debug. Script sees no responses, and on turn N+1 detects stale `pending` entries via the ack path and can degrade to Lite-only behavior.
- A Lite-profile script against a Full-profile Core: Core never sees a `frontier:out` write from the script, so nothing dispatches. Script uses state-only modules (e.g. Scripture) exactly as before.
- A future v2 protocol bump: v1 clients observe the new heartbeat version number and degrade; v2 clients continue. See [Versioning and negotiation](#versioning-and-negotiation).

## Versioning and negotiation

- The heartbeat advertises `protocol: 1` and `profile: "full"` (V2) or `"lite"` (degraded / Core-disabled modes). Scripts compare both to their Library's supported values.
- State cards carry their own `v` field at the top level. Core validates: unknown versions are logged and skipped (no dispatch).
- Request / response envelopes on the ops channel carry their own `v` field (see 06). Core skips unknown versions.
- Future minor additions (new optional heartbeat fields, new error codes, new ops) do NOT bump `protocol`. Modules advertise capabilities through `heartbeat.modules[].ops`; scripts feature-detect.
- Breaking changes bump `protocol` to `2` and MUST coexist with `protocol: 1` for at least one release so scripts can migrate without a hard break.
- The `profile` axis is orthogonal to `protocol` version. A v1-full Core can run v1-lite scripts unchanged; a v1-lite script can connect to a hypothetical v1-lite Core by never enqueuing ops.

## Size limits

- The story card `value` field has a practical upper bound (exact value to be empirically determined during Phase 0 instrumentation; preliminary estimate ≈ 8 KB before server-side truncation risk).
- Scripts using the action-ID history pattern SHOULD prune to `historyLimit` entries (default 100). Most value payloads are tiny (< 100 bytes per entry); 100 entries × 100 bytes ≈ 10 KB, well within budget.
- If a state card would exceed the limit, the script SHOULD reduce `historyLimit` before writing. Core does NOT automatically spill oversized state cards; that's a module-level concern.
- Core logs a warning for any state card that parses but exceeds 80% of the known size budget, so authors notice growth early.

## Error handling

State-channel errors are implicit — Core logs to the debug console and the script only learns indirectly (e.g. by comparing its last-written live count against `heartbeat.liveCount` on the next turn). Ops-channel errors are explicit: Core writes a terminal response with `status: "err"` and a structured `error: { code, message }` that the script reads via `frontierPoll`.

### State-channel failures

| Situation | Core behavior |
|-----------|---------------|
| State card JSON fails to parse | Debug-warn; skip dispatch this tick. |
| State card `v` is unknown | Debug-warn; skip dispatch. |
| State card targets an unknown module | Debug-warn (module not registered or disabled); skip dispatch. |
| Heartbeat write fails | Write queue retries with exponential backoff; warn after N failures. |
| `tailActionId` is `null` (no action window yet) | Modules receive `onStateChange` with whatever state the script wrote; live-count-sensitive modules fall back to nearest-earlier history entry, then manifest defaults. |

### Ops-channel failures

Full specification of the error-code table in [06 — Full Frontier Protocol § Response envelope](./06-full-frontier-protocol.md#response-envelope-inside-frontierinmodule). Summary of reserved codes:

| Code | Meaning |
|------|---------|
| `unknown_module` | No module registered with that id, or the module is disabled in the popup. |
| `unknown_op` | The module exists but declares no such op. |
| `invalid_args` | Op handler rejected args with a validation error. |
| `consent_denied` | Module-level consent was refused or revoked (e.g. WebFetch origin deny). |
| `rate_limit` | Per-module rate limit exceeded. `error.retryAfterMs` hint may be present. |
| `timeout` | Handler did not resolve within the op's configured timeout. |
| `handler_threw` | Handler threw an unexpected exception. `error.message` is sanitized. |
| `scheme_blocked` | WebFetch-specific: disallowed URL scheme (`file://`, `chrome://`, etc.). |

Modules MAY define additional codes in their own namespace (e.g. `webfetch:cors_blocked`) but MUST NOT reuse reserved codes for different meanings.
