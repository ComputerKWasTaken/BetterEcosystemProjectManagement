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

#### Action-ID history convention

For modules whose displayed state must track undo/retry (e.g. Scripture widgets showing per-turn HP), the state card uses the **action-ID history** pattern. The card holds two parts:

- A **manifest** — structural, schema-like; rarely changes.
- A **history map** — `{ [actionId]: values }` entries; one per recent action.

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
    "a-0000001": { "hp-bar": 100, "gold": 0 },
    "a-0000002": { "hp-bar": 95,  "gold": 25 },
    "a-0000003": { "hp-bar": 75,  "gold": 1250 }
  },
  "historyLimit": 100
}
```

**Semantics:**

- Each key in `history` is a stable AI Dungeon action id (as observed in `history[i].id` from the script side and in the `actionWindow` subscription from BD's side).
- On each turn, the script writes the values for the current action id and prunes older entries to keep `history` under `historyLimit` (default 100).
- BD determines the current tail action id from the WS action-window stream and looks up `history[tailId]` to get the active values.
- On **undo**, the tail id changes to an earlier action → BD reads the corresponding older entry → widgets revert automatically.
- On **retry**, the tail id is replaced with a new id → the next `onOutput` writes fresh values under the new id → BD reads them.
- On **edit** / **continue** → same lookup mechanism.
- If `history[tailId]` is missing (gap in recorded history), BD SHOULD fall back to the most recent available entry, then to manifest defaults.

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
  "tailActionId": "a-0000042",
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
- `tailActionId` — the current tail action id Core has observed. Scripts SHOULD cross-check this against their own `history[history.length-1].id` to detect misalignment (e.g. Core is behind a turn).
- `modules` — array of currently enabled modules. Each entry:
  - `id`, `version` — identification.
  - `stateNames` — which `frontier:state:<name>` cards this module reads.

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
