# 02 — Protocol (v1)

This is the canonical wire protocol specification. Implementations on both sides (AI-Dungeon-side Library, BetterDungeon-side Core) MUST conform to this document.

## Transports

Frontier uses two transports with different semantics. Every envelope rides on exactly one.

| Transport | Wire | Persistence | Who writes | Ack/TTL |
|---|---|---|---|---|
| **card** | Reserved Story Cards (`frontier:out`, `frontier:in:<module>`, `frontier:state:<name>`) | Persistent; survives undo/retry/refresh | Script writes via `addStoryCard`/`updateStoryCard`; BD writes via GraphQL | Yes — explicit acks + TTL |
| **text** | Invisible-Unicode frames (ported codec) embedded in AI Dungeon output text | Ephemeral; reverts with the turn on undo/retry | Script only (during `onOutput`) | No — natural GC via turn history |

**Transport selection rules:**
- Each module declares a `defaultTransport` (`'card'` or `'text'`). Library helpers automatically use that when the module's scripts emit envelopes.
- Individual envelopes MAY override via a `transport` field.
- Core-internal traffic (heartbeat, `_core.*` ops) always uses card transport.
- BD-originated responses default to card transport (BD cannot reliably write text mid-turn).
- If text transport is disabled globally or for the target module, envelopes declared as `text` MUST fall back to `card` (or fail with `text_disabled` if the sender marked them text-only).

## Reserved namespaces

Story cards whose `title` matches these prefixes are reserved and handled specially:

| Prefix | Direction | Purpose |
|--------|-----------|---------|
| `frontier:out` | Script → BD | Outbound request queue from the script (card transport) |
| `frontier:in:<module>` | BD → Script | Inbound response queue from BD, one per module (card transport) |
| `frontier:state:<name>` | Script → BD (persistent) | Long-lived state the script publishes; module-specific semantics |
| `frontier:heartbeat` | BD → Script | BD liveness beacon + capability + transport-availability advertisement |
| `scripture:*` | (reserved) | Currently unused; reserved for Scripture-internal extensions |
| `bd:*` | (reserved) | Reserved for BetterDungeon-internal use outside Frontier |

All reserved cards are filtered out of BetterDungeon UI surfaces (see [01 — Architecture](./01-architecture.md#other-features-that-consume-story-cards)).

Text-transport envelopes have no reserved namespace — they ride inside the codec's frame markers embedded in arbitrary output text.

## Card families in detail

### `frontier:out`

The script writes this card during hooks to enqueue outbound envelopes. BD reads it on every WebSocket push. BD considers an envelope "handled" once it is dedup-registered by its `id`; repeated WS pushes containing the same envelopes are no-ops.

**Cardinality:** exactly one per adventure.
**Lifetime:** overwritten each turn. The script SHOULD empty or clear this card when it has no outbound traffic.
**Size:** bounded by the story card `value` size limit (see [Size limits](#size-limits)).

**Value schema (JSON):**
```json
{
  "v": 1,
  "turn": 42,
  "acks": ["req-xyz", "req-qrs"],
  "messages": [
    {
      "id": "req-abc",
      "module": "scripture",
      "op": "flashWidget",
      "payload": { "widgetId": "hp-bar" },
      "ts": 1700000000000
    }
  ]
}
```

- `v` — protocol version. Currently `1`.
- `turn` — the script's current turn number (from `info.actionCount` or similar). Used by Core to detect missed turns.
- `acks` — array of response envelope ids the script has consumed from `frontier:in:*` cards. Core drops acked responses from its tracking.
- `messages` — array of outbound envelopes.

### `frontier:in:<module>`

One card per enabled module, written by BD Core. The script reads these during its hooks.

**Cardinality:** up to one per enabled module (only created on first response).
**Lifetime:** envelopes accumulate until the script acks them or TTL expires.
**Size:** bounded; Core spills to `frontier:state:<module>-overflow-N` if a single turn's responses exceed the budget.

**Value schema (JSON):**
```json
{
  "v": 1,
  "emittedTurn": 43,
  "messages": [
    {
      "id": "res-def",
      "replyTo": "req-abc",
      "module": "scripture",
      "status": "complete",
      "payload": { "ok": true },
      "ts": 1700000005000
    }
  ]
}
```

- `emittedTurn` — the turn on which BD last updated this card. Lets the script tell "stale" from "fresh."
- `messages` — array of response envelopes. Each one either replies to a prior request (`replyTo`) or is a spontaneous push from the module.

### `frontier:state:<name>`

Persistent script-published state. Module-specific semantics. The script writes; BD reads. Unlike `frontier:out`, these are NOT drained — they are the authoritative state.

Example: **Scripture** uses `frontier:state:scripture` to publish the active widget manifest:

```json
{
  "v": 1,
  "widgets": [
    { "id": "hp-bar", "type": "bar", "label": "HP", "value": 75, "max": 100, "color": "green", "align": "center" },
    { "id": "gold", "type": "stat", "label": "Gold", "value": 1250, "align": "right" }
  ]
}
```

BD Core routes changes to these cards to the corresponding module's `onStateChange(name, parsed)` handler.

### `frontier:heartbeat`

BD Core's liveness and capability beacon. Used by scripts to detect whether Frontier is installed, enabled, which modules are available, and which transports are enabled.

**Cardinality:** exactly one per adventure.
**Lifetime:** written by Core on adventure load and refreshed at least once per turn.
**Written by:** BD only. Scripts MUST NOT write this card.

**Value schema (JSON):**
```json
{
  "v": 1,
  "frontier": { "version": "2.0.0", "protocol": 1 },
  "ts": 1700000000000,
  "turn": 42,
  "transports": {
    "card": { "enabled": true },
    "text": { "enabled": true, "codecVersion": 1 }
  },
  "modules": [
    {
      "id": "scripture",
      "version": "1.0.0",
      "ops": ["flashWidget"],
      "stateNames": ["scripture"],
      "defaultTransport": "text",
      "textEnabled": true
    }
  ]
}
```

- `frontier.version` — BetterDungeon's Frontier version (SemVer).
- `frontier.protocol` — wire protocol version. Scripts SHOULD check `protocol === 1` before issuing requests.
- `ts` — millisecond timestamp of this heartbeat.
- `turn` — turn count at which this heartbeat was written. Scripts use this to detect staleness.
- `transports` — per-transport global state. `card` is always enabled if Frontier itself is enabled; `text` reflects the global invisible-text toggle. `codecVersion` lets scripts detect codec upgrades.
- `modules` — array of enabled modules. Each entry advertises:
  - `id`, `version` — identification.
  - `ops` — the op names scripts can request.
  - `stateNames` — which `frontier:state:<name>` cards this module claims.
  - `defaultTransport` — what the module prefers for its envelopes.
  - `textEnabled` — module-specific invisible-text permission (AND'd with global). Scripts use this to tell whether invisible text is actually available for a given module.

## Envelope shape

The envelope shape is IDENTICAL across both transports; only the wire wrapping differs. Core routes card-transport and text-transport envelopes through the same dispatch.

### Request envelope

```ts
interface RequestEnvelope {
  v?: 1;                    // Optional per-envelope version override (otherwise inherits from frame/card)
  id: string;               // Unique request id (e.g. crypto.randomUUID() or `req-${++counter}`)
  module: string;           // Target module id (must be present in heartbeat.modules)
  op: string;               // Operation name; module-defined
  payload?: unknown;        // Arbitrary JSON; module-defined schema
  ts: number;               // Script's ms timestamp at enqueue time
  transport?: 'card' | 'text'; // Override the module's default transport for this envelope
  expectsResponse?: boolean; // Default true; set false for fire-and-forget
  timeoutTurns?: number;    // Default 20; Core auto-errors if not resolved in N turns (card transport only; text envelopes are GC'd naturally)
  ephemeral?: boolean;      // If true, hint that this envelope is intrinsically turn-bound; Core MAY prefer text transport
}
```

For envelopes that carry per-turn *values* rather than *requests* (e.g. Scripture's `op: 'values'` with `{ 'hp-bar': 75, 'gold': 1250 }`), the convention is: `expectsResponse: false`, `ephemeral: true`, `transport: 'text'`. The Library's `frontierEmitValues(module, values)` helper sets all three.

### Response envelope

```ts
interface ResponseEnvelope {
  v?: 1;
  id: string;               // This response's own id (for ack tracking)
  replyTo?: string;         // Id of the request being answered (omit for spontaneous pushes)
  module: string;
  status: 'accepted' | 'progress' | 'complete' | 'error' | 'cancelled';
  transport?: 'card' | 'text'; // Echoed from request if relevant; default 'card' for BD responses
  progress?: number;        // 0..1 when status === 'progress'
  payload?: unknown;        // Result when status === 'complete'
  error?: { code: string; message: string; details?: unknown }; // When status === 'error'
  ts: number;
}
```

### Control envelopes (in `frontier:out#messages`, always card transport)

Cancel an in-flight request:
```json
{ "id": "req-cancel-1", "module": "_core", "op": "cancel", "payload": { "targetId": "req-abc" }, "ts": 1700000000000 }
```

Ping Core explicitly (complements heartbeat):
```json
{ "id": "req-ping-1", "module": "_core", "op": "ping", "ts": 1700000000000 }
```

The reserved module id `_core` is routed to Frontier Core itself, not to any user-facing module. `_core` ops always use card transport.

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

### Active ping (optional)

A script can issue `{ module: '_core', op: 'ping' }` and check for a `pong` response on the next turn. Useful for explicit round-trip confirmation but higher latency than passive heartbeat detection. Prefer the heartbeat in most cases.

### Checking text-transport availability

Beyond overall Frontier availability, scripts that rely on invisible text for correctness (like Scripture for value reverting) SHOULD check `heartbeat.transports.text.enabled` AND `heartbeat.modules.find(m => m.id === moduleId).textEnabled`. If either is false, the script SHOULD fall back to card-only behavior (with the retry/undo caveat that implies).

## Text transport details

### Frame format

A single text-transport frame contains one or more envelopes serialized as JSON, wrapped in invisible-Unicode markers defined by the ported codec (`services/frontier/text-codec.js`). The exact character set and framing are inherited from Robyn's `invisible-unicode-decoder`; Frontier treats the codec as a black box.

Conceptually:
```
<START_MARKER> <codec_version> <JSON_payload_encoded_as_invisible_chars> <END_MARKER>
```

A single turn's output can contain multiple frames; the codec's `decode()` returns all of them.

### Envelope batch inside a frame

A frame's payload is a JSON object:
```json
{
  "v": 1,
  "turn": 42,
  "messages": [
    { "id": "val-1", "module": "scripture", "op": "values", "payload": { "hp-bar": 75, "gold": 1250 }, "ts": 1700000000000, "expectsResponse": false, "ephemeral": true }
  ]
}
```

- `turn` — the script's `info.actionCount` when emitted. Used by Core to correlate with adventure text position.
- `messages` — array of envelopes; identical shape to card-transport envelopes.

### Lifecycle

1. Script's `onOutput` builds a JSON envelope batch, calls `textCodec.encode(batch)`, and concatenates the resulting invisible chars onto the text it returns.
2. AI Dungeon writes the combined text to the adventure history.
3. BD's interceptor (or MutationObserver fallback) captures the output block.
4. `text-stream.js` decodes, dedups by frame hash, and emits envelopes.
5. Core routes envelopes to module handlers identically to card-transport envelopes.
6. If the user undoes the turn, AI Dungeon drops the text block; the frame is gone. If the user retries, a new text block (potentially with a new frame) replaces the old one; Core's dedup set resets for new ids.

### Context Modifier (required but trivial)

The zero-width characters ARE present in the text that AI Dungeon sends to the model unless stripped. Frontier's base Library provides `frontierContextModifier(text)` which internally calls `textCodec.strip(text)`. Scripts pass it into their Context Modifier:

```js
// Context Modifier
const modifier = (text) => ({ text: frontierContextModifier(text) });
modifier(text);
```

If the user does not install this modifier, their AI will see the raw invisible chars. The modifier is idempotent and cheap (a single regex over the text). It is safe to run even if the script emits no text frames — `strip` is a no-op on text without Frontier markers.

### Size and AI-context cost

- A text frame contributes 0 visible characters to the output but ~2× bytes of invisible chars per JSON byte (exact ratio is codec-dependent; preliminary estimate for Robyn's encoder: 4–8 invisible codepoints per JSON byte).
- That context-bloat is eliminated by the Context Modifier before the AI sees the turn.
- Per-turn text frames should stay small (value payloads, not schemas). Rule of thumb: if a payload is >500 bytes of JSON, it probably belongs in a `frontier:state:<name>` card, not in invisible text.

### Why no ack path?

Text-transport envelopes are implicitly turn-bound. Their natural garbage collection is the adventure text itself — undo/retry/continue just overwrites or drops the text block. Adding an ack would defeat the purpose: if the script has to track whether the extension has seen a text envelope across turns, we're re-introducing the persistence problem that card transport already solves.

If a module genuinely needs acknowledgment of a per-turn value, it SHOULD use card transport with `expectsResponse: true`.

## Multi-turn (long-running) requests

> This section applies to **card-transport** envelopes. Text-transport envelopes are single-shot ephemeral messages; they do not have multi-turn state.

Some module operations cannot complete within a single round-trip. The protocol supports:

- **Accepted → progress\* → complete/error/cancelled** state machine per request.
- **Progress updates** as intermediate `progress` envelopes with a `progress: 0..1` field.
- **Explicit cancellation** via the `_core.cancel` op.
- **Timeouts** via the `timeoutTurns` field on the request; Core auto-emits an `error` response if exceeded.

### State machine

```
           ┌─────────────┐
           │  accepted   │  (immediate, issued next turn after request)
           └──────┬──────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
  ┌─────────────┐   ┌─────────────┐
  │  progress   │──►│  complete   │  (terminal)
  └──────┬──────┘   └─────────────┘
         │          ┌─────────────┐
         ├─────────►│   error     │  (terminal)
         │          └─────────────┘
         │          ┌─────────────┐
         └─────────►│  cancelled  │  (terminal)
                    └─────────────┘
```

- `accepted` — Core acknowledges the request was validated and routed. Optional for very fast modules; required for any request that will take >1 turn.
- `progress` — may be emitted any number of times.
- Exactly one terminal envelope per request: `complete`, `error`, or `cancelled`.

### Example round-trip (3-turn web search)

**Turn N (script):**
```json
// frontier:out
{ "v":1, "turn":N, "acks":[], "messages":[
  { "id":"req-1", "module":"websearch", "op":"search", "payload":{"query":"..."}, "ts":..., "timeoutTurns":10 }
]}
```

**Turn N+1 (BD → script):**
```json
// frontier:in:websearch
{ "v":1, "emittedTurn":N+1, "messages":[
  { "id":"res-1a", "replyTo":"req-1", "module":"websearch", "status":"accepted", "ts":... }
]}
```

**Turn N+2 (BD → script):**
```json
// frontier:in:websearch
{ "v":1, "emittedTurn":N+2, "messages":[
  { "id":"res-1b", "replyTo":"req-1", "module":"websearch", "status":"progress", "progress":0.5, "ts":... }
]}
```

**Turn N+3 (BD → script):**
```json
// frontier:in:websearch
{ "v":1, "emittedTurn":N+3, "messages":[
  { "id":"res-1c", "replyTo":"req-1", "module":"websearch", "status":"complete", "payload":{"results":[...]}, "ts":... }
]}
```

**Turn N+4 (script acks):**
```json
// frontier:out
{ "v":1, "turn":N+4, "acks":["res-1a","res-1b","res-1c"], "messages":[...] }
```

### Ack semantics (card transport only)

- The script SHOULD include in `acks` every response id it has consumed and will not process again.
- Core drops acked responses from `frontier:in:<module>`. If a module has emitted all its responses and all are acked, Core MAY remove the card entirely.
- **TTL fallback:** Core also drops any response older than `DEFAULT_RESPONSE_TTL_TURNS` (default: 10) regardless of ack. This bounds storage if a script misbehaves or crashes mid-session.
- Responses are **at-most-once** per id: if a script sees the same response id twice (e.g. due to card-update race), it SHOULD dedup.

**Text transport does NOT use acks.** When the user undoes a turn, the text frame disappears; that IS the ack. Core does dedup text envelopes by `id` within a session (so re-observing the same output block doesn't re-fire handlers), but there is no cross-turn persistence of sent/received state.

### Cancellation

- Script sends a `_core.cancel` control envelope with `payload: { targetId }`.
- Core attempts to cancel the in-flight request:
  - If the module supports cancellation and the work hasn't committed (e.g. fetch `AbortController`), it emits `status: 'cancelled'`.
  - If the work has already finished internally but the response hasn't been written yet, Core still emits `cancelled` and discards the result.
  - If the request is unknown or already terminal, Core emits an `error` with code `cancel_unknown`.

### Timeouts

- Each request carries `timeoutTurns` (default 20).
- Core tracks turn count via the heartbeat's own turn counter.
- If `current_turn - request_start_turn >= timeoutTurns` without a terminal envelope, Core emits `{ status: 'error', error: { code: 'timeout' } }` and abandons the request.

## Versioning and negotiation

- The heartbeat advertises `protocol: 1`. Scripts compare to their Library's supported version.
- Envelopes may carry a `v` field; Core validates. Unknown versions → `{ status: 'error', error: { code: 'unsupported_version' } }`.
- Future minor versions (1.x) MUST be backward-compatible at the wire level.
- Breaking changes bump to `v: 2` and MUST coexist with `v: 1` for at least one release to allow script migration.

## Dedup and idempotency

- **Request dedup:** Core maintains a TTL-bounded set of processed request ids. Duplicate ids within the TTL are dropped silently.
- **Response dedup:** scripts dedup by response id.
- **Idempotent ops:** modules are ENCOURAGED to accept repeated requests with identical payloads idempotently. Core does not enforce this; it's a module-level concern.

## Size limits

- The story card `value` field has a practical upper bound (exact value to be empirically determined during implementation; preliminary estimate ≈ 10 KB before server-side truncation risk).
- When a single inbound card would exceed budget, Core:
  1. Splits the response array across `frontier:state:<module>-overflow-N` cards (indexed), and
  2. Leaves a pointer envelope in `frontier:in:<module>` instructing the script which overflow cards to read.
- The script Library's `pollResponses` helper transparently assembles the overflow.
- For outbound, the script is responsible for not exceeding the limit on `frontier:out`; the Library SHOULD warn if a single turn's enqueue looks too large.

## Reserved ids and ops

- Request ids starting with `_` are reserved for Core internals. Scripts MUST NOT use them.
- The module id `_core` is Frontier Core itself. Ops: `ping`, `cancel`, `capabilities` (future).

## Error codes

Normative list for Core-emitted errors:

| Code | Meaning |
|------|---------|
| `unsupported_version` | Envelope `v` not recognized |
| `unsupported_codec` | Text frame's codec version is not supported by this Core |
| `unknown_module` | Request targets a module that is not registered or enabled |
| `unknown_op` | Module does not support the requested `op` |
| `invalid_payload` | Payload fails module's validation |
| `invalid_frame` | Text frame failed to decode or contained malformed JSON |
| `timeout` | `timeoutTurns` exceeded (card transport only) |
| `cancel_unknown` | Cancel target is not in flight |
| `size_exceeded` | Payload exceeded per-card budget and module does not support spillover |
| `text_disabled` | Envelope was marked text-only but text transport is globally or per-module disabled |
| `internal` | Module or Core threw an unexpected exception |

Module-specific error codes live in the module's own namespace (e.g. `websearch.rate_limited`).
