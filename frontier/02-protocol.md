# 02 — Protocol (v1, Lite)

This is the canonical wire protocol specification for Frontier Lite. Implementations on both sides (AI-Dungeon-side Library, BetterDungeon-side Core) MUST conform to this document.

> **Scope:** Frontier Lite (MVP) is **cards-only, one-way (script → BD)**. There are no envelopes, no requests, no responses, no acks. This document reflects that. Two-way comms land as a future protocol extension and will be specified separately when Full Frontier is planned.

## Reserved namespaces

Story cards whose `title` matches these prefixes are reserved and handled specially:

| Prefix | Direction | Purpose |
|--------|-----------|---------|
| `frontier:state:<name>` | Script → BD | Persistent state the script publishes; module-specific semantics. This is the MVP's sole script-to-BD channel. |
| `frontier:heartbeat` | BD → Script | BD liveness beacon + module advertisement. Written by Core, read by scripts. |
| `frontier:out` | (reserved, unused in Lite) | Reserved for Full Frontier's script → BD request queue. Scripts MUST NOT write this card in MVP; Core will log and ignore. |
| `frontier:in:<module>` | (reserved, unused in Lite) | Reserved for Full Frontier's BD → script response queue. Never written by MVP Core. |
| `scripture:*` | (reserved) | Unused; reserved for future Scripture-internal extensions. |
| `bd:*` | (reserved) | Reserved for BetterDungeon-internal use outside Frontier. |

All reserved cards (including the unused Full-Frontier ones) are filtered out of BetterDungeon's own UI surfaces (see [01 — Architecture](./01-architecture.md#other-features-that-consume-story-cards)). AI Dungeon's native Story Card list still shows them.

## Card families in detail

### `frontier:state:<name>`

Persistent script-published state. Module-specific semantics. The script writes; BD reads. This is the only script-to-BD wire in Lite.

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
  "frontier": { "version": "2.0.0", "protocol": 1, "profile": "lite" },
  "ts": 1700000000000,
  "turn": 42,
  "tailActionId": "42",
  "modules": [
    { "id": "scripture", "version": "1.0.0", "stateNames": ["scripture"] }
  ]
}
```

- `frontier.version` — BetterDungeon's Frontier version (SemVer).
- `frontier.protocol` — wire protocol version. Scripts SHOULD check `protocol === 1` before publishing state.
- `frontier.profile` — `"lite"` for MVP; `"full"` once two-way comms ship. Scripts can branch on this to avoid trying to use features that aren't available yet.
- `ts` — millisecond timestamp of this heartbeat.
- `turn` — AI Dungeon's `actionCount` at which this heartbeat was written. Scripts use this to detect staleness.
- `tailActionId` — the current tail action id Core has observed (numeric string, e.g. `"60"`). Scripts SHOULD cross-check this against their own `history[history.length-1].id` to detect misalignment (e.g. Core is behind a turn).
- `modules` — array of currently enabled modules. Each entry:
  - `id`, `version` — identification.
  - `stateNames` — which `frontier:state:<name>` cards this module reads.

## AI Dungeon observation channels

BD observes AI Dungeon's backend over a single GraphQL-over-WebSocket connection to `wss://api.aidungeon.com/graphql`. Three subscription payloads drive Frontier Lite:

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

## Future extensions (Full Frontier)

When two-way comms are added in a future phase, the following protocol elements will be introduced alongside Lite. They are listed here so Lite implementations leave room for them without future-breaking refactors:

- `frontier:out` card: script → BD request queue with envelopes (`{ id, module, op, payload }`).
- `frontier:in:<module>` cards: BD → script response queues with acks.
- Module `ops` dictionary + dispatcher in Core.
- Ack / TTL / multi-turn state machines for long-running requests.
- `_core` pseudo-module for protocol control (ping, cancel, capabilities).
- Heartbeat `profile` flips from `"lite"` to `"full"`; additional capability fields added.

Lite implementations MUST ignore unknown card prefixes and unknown heartbeat fields so that Full Frontier deployments remain backward-compatible with Lite-only scripts.

## Versioning and negotiation

- The heartbeat advertises `protocol: 1` and `profile: "lite"`. Scripts compare both to their Library's supported values.
- State cards carry their own `v` field at the top level. Core validates: unknown versions are logged and skipped (no dispatch).
- Future minor versions of the Lite protocol (1.x) MUST be backward-compatible at the wire level.
- Breaking changes bump to `v: 2` and MUST coexist with `v: 1` for at least one release to allow script migration.
- The `profile` flip from `"lite"` to `"full"` is NOT breaking: Full Frontier scripts MUST work against Lite Core (ignoring unsupported ops silently), and Lite scripts MUST work against Full Core (Full Core simply never sees traffic on the unused `frontier:out` card).

## Size limits

- The story card `value` field has a practical upper bound (exact value to be empirically determined during Phase 0 instrumentation; preliminary estimate ≈ 8 KB before server-side truncation risk).
- Scripts using the action-ID history pattern SHOULD prune to `historyLimit` entries (default 100). Most value payloads are tiny (< 100 bytes per entry); 100 entries × 100 bytes ≈ 10 KB, well within budget.
- If a state card would exceed the limit, the script SHOULD reduce `historyLimit` before writing. Core does NOT automatically spill oversized state cards; that's a module-level concern.
- Core logs a warning for any state card that parses but exceeds 80% of the known size budget, so authors notice growth early.

## Error handling in Lite

Lite has no request/response envelopes, so there are no wire-level error codes. Problems are logged by Core to the debug console and never returned to the script. Common failure modes:

| Situation | Core behavior |
|-----------|---------------|
| State card JSON fails to parse | Debug-warn; skip dispatch this tick. |
| State card `v` is unknown | Debug-warn; skip dispatch. |
| State card targets an unknown module | Debug-warn (module not registered or disabled); skip dispatch. |
| Heartbeat write fails (GraphQL error) | Retry with exponential backoff; warn after N failures. |
| `tailActionId` is `null` (no action window yet) | Modules receive `onStateChange` with whatever state the script wrote; action-ID-sensitive modules SHOULD fall back to the most-recent history entry. |

Scripts in Lite do not see these errors directly. If a script needs to know whether its state was accepted, it can read the heartbeat's `tailActionId` next turn and compare to its own last-written action id. That's the closest thing Lite has to an ack, and it's implicit.

When Full Frontier lands, a proper error-code table (unsupported version, unknown op, timeout, etc.) will be added here.
