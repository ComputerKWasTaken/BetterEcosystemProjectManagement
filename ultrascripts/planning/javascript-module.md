# JavaScript Module Concept

Status: **Concept draft — not scheduled**

This is one of two module concepts (with the [Audio module](./audio-module.md))
intended to take the first-party module set from eight to ten. Per the
[current roadmap](./current-roadmap.md) sequencing rules, implementation waits
until a stage explicitly opens for it; this document only fixes the concept so
the eventual build starts from a settled contract.

## Purpose

Give scripts a way to run real JavaScript in a much less restrictive
environment than the AI Dungeon scripting sandbox.

The AI Dungeon sandbox is limited by design: no network, no timers, no DOM, a
frozen global surface, and a restricted standard library. Ultrascripts already
routes around individual gaps (WebFetch for network, Clock for time, AI for
inference). The JavaScript module generalizes that: instead of building a new
module for every missing capability, a script can ship a snippet of ordinary
JavaScript and have BetterDungeon execute it.

Operating principle: good faith. Ultrascripts authors are a small, trusted
community, and the player must install BetterDungeon and enable the module
before anything runs. The module is guarded, not paranoid — the same posture
WebFetch takes with consent and rate limiting rather than a capability
whitelist maze.

## What It Is Not

- Not a way for scripts to touch BetterDungeon internals, extension storage,
  or credentials. Code runs in an isolated worker, not the extension context.
- Not a persistence layer. Results come back through the normal
  `ultrascripts:in:<module>` path; durable state stays in Story Cards.
- Not a third-party module system. That remains parked. This executes
  script-supplied snippets per request; it does not register new modules.

## Module Shape

Ops module, id `javascript` (alias `js`).

| Op | Idempotence | Purpose |
|---|---|---|
| `run` | `unsafe` | Execute a JavaScript snippet and return its result |
| `status` | `safe` | Report availability, consent state, and execution limits |

### `run`

```js
sdk.request('javascript', 'run', {
  code: 'const r = args.values.reduce((a, b) => a + b, 0); return { sum: r };',
  args: { values: [1, 2, 3] },        // optional, JSON-serializable
  timeoutMs: 5000,                    // optional, clamped to a max (e.g. 30000)
});
```

Response:

```js
{
  ok: true,
  result: { sum: 6 },        // JSON-serializable return value
  logs: ['...'],             // captured console output, capped
  durationMs: 3,
}
```

Errors use stable codes so scripts can branch: `invalid_args`,
`consent_denied`, `timeout`, `runtime_error` (with `message` and truncated
stack), `result_not_serializable`, `rate_limited`.

Like every ops module, responses arrive on a later turn. Public examples must
not rely on same-turn results.

### `status`

Returns `{ available, consent: 'granted' | 'pending' | 'denied', limits }` so
showcase scripts can give specific setup guidance the way Stateboy does for AI.

## Execution Environment

- Code runs in a dedicated Web Worker (or sandboxed iframe where workers are
  unavailable), never in the page or extension context.
- The snippet is wrapped as an async function body: `args` is in scope,
  `return` produces the result, `await` is allowed.
- Available: full modern ECMAScript, `Math`, `JSON`, `Date`, `RegExp`,
  `Intl`, typed arrays, `crypto.getRandomValues`, `structuredClone`,
  `console` (captured), `fetch` **only if** the player has granted the same
  consent WebFetch uses (reuse its blocked-target and header rules).
- Not available: DOM, extension APIs, `chrome.*`, BetterDungeon globals,
  persistent storage, `importScripts` of arbitrary remote code.
- Hard limits: execution timeout (worker terminated on expiry), result size
  cap, captured-log cap, per-adventure rate limit.

## Consent Model

Follow the WebFetch precedent:

- First `run` request in an adventure prompts the player with the requesting
  script context; the player can allow once, allow for the adventure, or deny.
- Denial returns `consent_denied` — actionable, never silent.
- The popup's per-module settings expose the toggle and a "reset consent"
  action.

## Why This Is Worth A Module Slot

- Unblocks the long tail of author needs (parsing, math-heavy simulation,
  string processing, procedural generation) without a bespoke module each time.
- Keeps sandbox-escape pressure off the other modules: WebFetch, Clock, and
  friends stay narrow because generic computation has a home.
- Cheap to teach: authors already know JavaScript; the contract is one op.

## Open Questions

1. Should `fetch` inside snippets be in scope for v1, or should v1 be
   compute-only with network deferred to WebFetch composition?
2. Snippet size cap — enough for real utilities without inviting authors to
   ship entire applications through `run`.
3. Should repeated identical snippets be cached/precompiled per adventure?
4. Worker-per-request vs. pooled worker: isolation vs. startup cost.
5. Does Android WebView need a different isolation vehicle than desktop?

## Checklist Alignment

When implementation opens, follow the standard flow in
[modules.md](../reference/modules.md#adding-or-revising-a-module): module under
`BetterDungeon/modules/javascript/`, registry registration, load path,
`javascript-module` regression suite, BetterRepository guide
(`UltrascriptsJavaScriptGuide.vue`), and heartbeat verification.
