# 06 — Full Frontier Protocol (v1)

Specifies the two-way extension added to the Lite protocol in [02 — Protocol](./02-protocol.md). This document covers everything needed to ship Phase 4 of the [implementation plan](./04-implementation-plan.md) and to design ops modules (Phases 5–6).

> **Relationship to Lite:** Full Frontier is strictly additive. A Lite-only script running against a Full Core continues to work unchanged — it never writes `frontier:out`, so the ops dispatcher has nothing to do. A Full-profile script running against a Lite Core sees `profile: "lite"` in the heartbeat and degrades gracefully (per the availability-detection pattern already defined in `02-protocol.md`). The `profile` flip from `"lite"` to `"full"` is explicitly a non-breaking change.

## Why a card-based envelope

Full Frontier could have been implemented over a side channel (extension-injected postMessage, a custom WebSocket, etc.) but we stick with cards for the same reasons Lite does:

- **Native wire.** Everything round-trips through AI Dungeon's own story-card + subscription system. State stays consistent with what AID itself knows.
- **Crash recovery rides on card state.** If BD reloads, safe requests still in `frontier:out` can be re-dispatched naturally, and any response still in `frontier:in:*` is still readable by the script. Unsafe requests are not replayed after reload because repeating them could duplicate external side effects.
- **Cross-tab / cross-device continuity.** If the user reloads the tab or reopens the adventure on another device, the request/response queue is already on the server.
- **Same write path.** The write queue built in Phase 1 handles response card writes identically to heartbeat writes.

The cost is latency: script-side reads are turn-gated, so responses can only be consumed once per turn. That's acceptable for the target use cases (web fetch, real-time lookups, local tool calls) because the response becomes available for the *next* `onModelContext` / `onOutput` hook — the same frame the script would have used anyway.

## Card families

Two new reserved prefixes, already listed in [02 — Protocol § Reserved namespaces](./02-protocol.md#reserved-namespaces):

| Prefix | Direction | Purpose |
|--------|-----------|---------|
| `frontier:out` | Script → BD | Single card holding the request queue + per-request ack tombstones. |
| `frontier:in:<module>` | BD → Script | One card per module carrying pending + terminal responses for that module. |

### Why one `frontier:out` card vs. many

A single card serializes the request ordering and gives us a trivial diff to consume. Per-module out-cards would complicate GC (script would have to ack across N cards) without meaningful benefit — outbound volume is low because ops are turn-gated.

### Why per-module `frontier:in:<module>`

- **Smaller diffs.** Modules with chatty responses (e.g. WebFetch streaming many pages of content) don't bloat unrelated modules' inbound cards.
- **Isolated GC.** Each module's response card can hit the size cap independently; Core evicts oldest responses per card without touching others.
- **Permission boundary.** If we ever sandbox modules per-origin, the card boundary aligns with the permission boundary.

## Envelope schemas

### Request envelope (inside `frontier:out`)

```json
{
  "v": 1,
  "requests": [
    {
      "id": "42-webfetch-1",
      "module": "webfetch",
      "op": "fetch",
      "args": { "url": "https://httpbin.org/get" },
      "ts": 1713657600000
    }
  ],
  "acks": ["41-webfetch-3", "41-clock-1"]
}
```

- `v` — schema version. Bumped on breaking changes; Core skips unknown versions.
- `requests` — all in-flight requests the script wants Core to process. Scripts append new entries; Core dedupes by `id`.
- `acks` — request ids the script has finished reading from `frontier:in:<module>`. Core uses this to tombstone the matching responses (see [GC policy](#garbage-collection)).

**`id` scheme: `<liveCount>-<moduleId>-<seq>`** — e.g. `42-webfetch-1`, `42-webfetch-2`, `43-clock-1`. `liveCount` is the script-side live-count ordinal at request time (already canonical for history lookups); `seq` resets each turn. This scheme is:

- **Idempotent on replay.** If the script re-writes the same `frontier:out` (e.g. after a refresh), request ids collide with already-processed ones and Core skips them.
- **Debuggable.** An engineer reading `frontier:out` can tell immediately which turn a request came from and which module it targets.
- **Ordered.** Ids sort lexicographically within a turn for the same module.

### Response envelope (inside `frontier:in:<module>`)

```json
{
  "v": 1,
  "responses": {
    "42-webfetch-1": {
      "status": "pending",
      "startedAt": 1713657600100
    },
    "41-webfetch-3": {
      "status": "ok",
      "data": { "body": "...", "status": 200 },
      "completedAt": 1713657590500
    },
    "40-webfetch-2": {
      "status": "err",
      "error": { "code": "consent_denied", "message": "User denied httpbin.org" },
      "completedAt": 1713657584200
    }
  }
}
```

Responses are keyed by request id for O(1) script-side lookup.

Status lifecycle: `pending` → `ok` | `err` | `timeout`. Terminal statuses (`ok`, `err`, `timeout`) never transition further.

**Error codes (reserved):**

| Code | Meaning |
|------|---------|
| `unknown_module` | No module registered with that id, or the module is disabled in the popup. |
| `unknown_op` | The module exists but declares no such op. |
| `invalid_args` | Op handler rejected the args with a validation error. |
| `consent_denied` | WebFetch-style consent was refused or revoked. |
| `rate_limit` | Per-origin / per-module rate limit exceeded. Payload may include `retryAfterMs`. |
| `timeout` | Handler did not resolve within the op's configured timeout. |
| `handler_threw` | Handler threw an unexpected exception. Payload includes sanitized message. |
| `scheme_blocked` | WebFetch-specific: disallowed URL scheme (`file://`, `chrome://`, etc.). |
| `unsafe_replay_blocked` | A pending unsafe op was found after reload and Core refused to replay it. |

Modules MAY define additional codes in their own namespace (e.g. `webfetch:cors_blocked`) but MUST NOT reuse reserved codes for different meanings.

## Request lifecycle

```
Script                    frontier:out            Core (ops-dispatcher)        frontier:in:<module>
  │                            │                          │                            │
  ├─ frontierCall() ──────────▶│                          │                            │
  │   appends {id, module,     │                          │                            │
  │           op, args}        │                          │                            │
  │                            │──── diff ───────────────▶│                            │
  │                            │                          ├── writes pending ─────────▶│
  │                            │                          │                            │
  │                            │                          ├─ invokes module.ops.op() ─ │
  │                            │                          │   (async, may span turns) │
  │                            │                          │                            │
  │                            │                          ├── writes terminal ────────▶│
  │                            │                          │                            │
  ├─ frontierPoll(id) ◀────────┼──────────────────────────┼────────────────────────────┤
  │   reads response                                                                   │
  │                                                                                    │
  ├─ next turn: append id to acks[] in frontier:out ──────▶                            │
  │                                                       ├── tombstones response ────▶│
  │                                                       │   from frontier:in cards   │
```

## Garbage collection

Two levels. Both are necessary because either can fail independently.

### Primary: script-driven ack

1. Script reads a terminal response via `frontierPoll(id)`.
2. Script's next turn appends that id to the `acks` array in `frontier:out`.
3. Core's ops dispatcher removes the matching entry from `frontier:in:<module>`.
4. Script removes the id from its local acks buffer on next write of `frontier:out` (it's now permanent in the tombstoned state).

This is the normal case. Constant-space: the request and response both vanish once the script no longer needs them.

### Safety net: Core-driven TTL

A response older than **N turns** (default: 10) is tombstoned by Core regardless of whether the script acked. Rationale:

- Script may have been uninstalled while a response was in flight → nobody will ever ack.
- Script may have crashed / errored before reaching the ack step.
- User may have refreshed mid-flight and the script's local state no longer knows the id (but `frontier:out` does, because it's server-persistent — which is why this safety net exists at all).

The TTL uses turn-count not wall-clock because scripts are turn-gated; they can't ack between turns.

### Request-side GC

Requests in `frontier:out` are cleaned up by the script-side Library: once a terminal response is observed, the Library removes that request from its local pending map and writes the smaller `frontier:out` envelope on the next ack. Core does not need to mutate `frontier:out`; it only maintains an in-memory/session dedup set for recently completed ids, pruned after the response TTL. If a script explicitly re-submits an id after that TTL, Core may process it again, which is user-level behavior rather than protocol corruption.

## Idempotency

Core MUST treat every request `id` as idempotent: seeing the same id twice triggers the handler exactly once. Implementation:

- In-memory set of known `id`s processed this session.
- Mirrored to `sessionStorage` so a BD tab reload does not re-invoke handlers that completed pre-reload.
- Crossing an adventure boundary clears the set (ids are scoped per adventure by definition — `<liveCount>` would collide otherwise).

Script authors are responsible for not reusing ids across semantically different requests. The `<liveCount>-<module>-<seq>` scheme makes accidental reuse hard because `liveCount` advances monotonically.

## Session-storage mirror (crash recovery)

On every request state change, Core mirrors to `sessionStorage` under `frontier:ops:inflight`:

```json
{
  "adventureShortId": "nGgG3mHvbLrp",
  "processed": ["40-webfetch-1", "40-webfetch-2", "41-clock-1"],
  "inflight": {
    "42-webfetch-1": { "module": "webfetch", "op": "fetch", "startedAt": 1713657600100 }
  }
}
```

On BD reload in the v1 implementation:

1. Core reads this entry and verifies `adventureShortId` matches the current adventure. If not, it's discarded — we're in a different adventure.
2. `processed` merges into the dedup set so already-completed requests aren't re-invoked.
3. Still-pending work is recovered from the persistent `frontier:out` card: if the request remains present and the matching response is still `pending`, Core re-runs the handler only when the op is marked `safe`. Unsafe ops settle to a terminal error instead of being replayed.

The `inflight` mirror is retained for diagnostics and for the future non-idempotent policy below; v1's recovery source of truth is the card state itself.

Modules declare idempotency in their metadata:

```js
{
  id: 'webfetch',
  ops: { fetch: { handler, idempotent: 'safe' } },
}
```

- `safe` — handler can be re-invoked freely (default for GET-like ops).
- `unsafe` — never re-invoke; convert pending → `err: unsafe_replay_blocked` on reload (default for POST-like ops, paid calls, or ops with side effects).

## Heartbeat changes in Full profile

The `profile` field flips to `"full"`. Per-module entries gain `ops`:

```json
{
  "v": 1,
  "protocol": 1,
  "profile": "full",
  "modules": [
    { "id": "scripture", "version": "2.0.0", "stateNames": ["scripture"] },
    { "id": "webfetch",  "version": "1.0.0", "ops": ["fetch"] },
    { "id": "clock",     "version": "1.0.0", "ops": ["now", "tz", "format"] }
  ]
}
```

Scripts feature-detect specific ops via `heartbeat.modules.find(m => m.id === 'webfetch')?.ops.includes('fetch')`. A module can add new ops without a protocol bump.

## Size limits

`frontier:out` grows with requests + acks; both are short. A reasonable worst case is:

- 10 in-flight requests × ~200 bytes each = 2 KB
- 30 acks × ~25 bytes each = ~750 bytes

Well under the card size budget even before GC.

`frontier:in:<module>` is the tighter constraint because response `data` can be arbitrarily large (e.g. a fetched web page). Modules are responsible for truncating their own responses to fit. Core warns at 80% of budget (same threshold as state cards) and hard-caps at 100% — at which point new responses replace oldest terminal responses in the card, older terminal responses are dropped even if un-acked. Scripts that need guaranteed delivery should ack more aggressively.

For WebFetch specifically, large bodies (>50 KB) SHOULD be chunked across multiple responses or offered as download URLs rather than inlined. Design TBD during Phase 5 — likely a module-side streaming helper that splits one script-side request into N BD-side responses carrying sequential chunks.

## Security posture

Cards are plaintext in AI Dungeon's database — anything written to `frontier:out` or `frontier:in:*` is readable by AID, by anyone the user shares the adventure with, and by anyone who later inspects a shared scenario. This constrains what modules SHOULD expose:

- **No secrets in responses.** API keys, auth tokens, session cookies — none of these should appear in response envelopes. WebFetch strips inbound `Set-Cookie`, inbound `Authorization` echoes, and similar headers.
- **No secrets in requests.** Likewise, scripts SHOULD NOT put secrets in request args. If a future module needs authed access (e.g. private API), BD holds the credential in `chrome.storage` and the script only references it by user-facing handle.
- **Consent is user-level, not script-level.** Scripts cannot escalate their own permissions. All consent UIs are surfaced by BD's popup, backed by `chrome.storage.sync`.
- **Rate limits are enforced by Core.** Modules can request stricter limits but cannot weaken the Core default.
- **Origin isolation.** Future Phase 11+ work. For V2, all first-party modules share a single trust boundary. Third-party modules are out of V2.

## Open questions (design not yet locked)

These must be resolved during Phase 4 implementation:

1. **`frontier:out` cap behavior.** If the script exceeds its own size budget and cannot fit new requests, what happens? Options: (a) reject `frontierCall` synchronously, (b) evict oldest un-sent request. Leaning (a) — predictable, script can fall back to degrade.
2. **Multi-turn pending UX.** Should scripts be able to show a pending indicator between turns? Requires a read-side signal that's visible mid-turn. Card writes from Core are observable via the subscription in real time, but the script can't *read* mid-turn. Likely resolved by Scripture-style rendering if BD wants to surface the pending state directly in-page.
3. **Cross-tab deduplication.** If the user has the same adventure open in two tabs and both BD instances see a new request, both will try to handle it. Options: (a) elect a primary per-adventure via `BroadcastChannel`, (b) rely on idempotency (both write `pending`, one wins on the server). Leaning (b) for simplicity, with a `BroadcastChannel` fast-path optimization later.
4. **Sensitive-op prompts inside popups.** Chrome MV3 popups close when focus leaves them, which is a UX problem for consent prompts that need user attention during an in-progress AID turn. Options: (a) in-page overlay injected by BD, (b) desktop notifications with click-through. Leaning (a) — consistent with BD's existing in-page UI patterns.

## Versioning

- `v: 1` is the MVP spec documented here.
- Breaking changes bump `v` and MUST coexist with `v: 1` for at least one release so scripts can migrate without a hard break.
- Non-breaking additions (new optional fields, new error codes) do not bump `v`. Modules that emit them advertise through heartbeat.
- Protocol-version negotiation is not needed in V2 because `v: 1` is the only version in the wild. If `v: 2` ships, Core reads both and responds in whichever version the script's requests are written as.
