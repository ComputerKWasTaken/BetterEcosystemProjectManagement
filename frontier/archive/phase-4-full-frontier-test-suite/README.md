# Archived - Full Frontier AI Dungeon Test Suite

This is the completed Phase 4 live validation suite. The current summary page is [08 - Full Frontier Test Suite Archive](../../08-full-frontier-ai-dungeon-test-suite.md).

This is the live AI Dungeon test harness for Frontier Phase 4 / Full Frontier. It validates the request/response channel against AI Dungeon's real story-card persistence and BetterDungeon's ops dispatcher.

## Files

- `full-frontier-test-suite.library.js` - paste into the scenario **Library**.
- `full-frontier-test-suite.output-modifier.js` - paste into the scenario **Output Modifier**.

The suite writes:

- `frontier:out` - the real Full Frontier request queue.
- `frontier:test:full` - a diagnostic trace card for humans.

BetterDungeon writes:

- `frontier:in:test` - responses from the opt-in internal Phase 4 `test.echo` module.
- `frontier:in:missingmodule` - expected error responses for the unknown-module check.

## Latest Result

2026-04-22: live AI Dungeon run `full-mo9ejlzk` reached `checksPass: true`. The separate manual `ff delay` reload-mid-pending check also passed.

Passed in that run:

- Full-profile heartbeat and `test.echo` advertisement.
- `test.echo` ok response with original args.
- Ack tombstone for the completed echo response.
- `unknown_op` structured error for `test.missingOp`.
- `unknown_module` structured error for `missingmodule.echo`.
- Duplicate request-id handling for `6-test-duplicate`.

Phase 4 live validation is complete.

## Setup

1. Load BetterDungeon with the Phase 4 or later build.
2. Create or open a disposable AI Dungeon scenario/adventure.
3. Paste `full-frontier-test-suite.library.js` into **Library**.
4. Paste `full-frontier-test-suite.output-modifier.js` into **Output Modifier**.
5. Enable the opt-in internal test module from DevTools:

   ```js
   window.Frontier?.registry?.enable?.('test')
   ```

6. Start or continue the adventure.
7. Generate outputs until `frontier:test:full` reports `"checksPass": true`.

If the trace remains stuck at `waiting for test.echo heartbeat`, re-run this in DevTools and generate one more output:

```js
window.Frontier?.registry?.enable?.('test')
```

If the trace shows `ackAttempts` climbing while `echoResponseStillPresent` remains `true`, reload the AI Dungeon tab with the latest BetterDungeon build and run `ff reset`. That pattern means the script wrote the ack, but the content script did not tombstone the original response card. The Phase 4 write queue mirrors successful created cards into `window.Frontier.ws` so the next same-title write updates the existing `frontier:in:*` card instead of creating a duplicate.

## Expected Flow

The suite advances one check at a time across normal AI Dungeon turns:

1. Wait for `frontier:heartbeat` to advertise `profile: "full"`.
2. Confirm heartbeat advertises module `test` with op `echo`.
3. Write a `test.echo` request to `frontier:out`.
4. Poll `frontier:in:test` for an `ok` response.
5. Ack that response through `frontier:out` and confirm it is tombstoned.
6. Write a `test.missingOp` request and expect `err: unknown_op`.
7. Write a `missingmodule.echo` request and expect `err: unknown_module`.
8. Write the same `test.echo` request id twice and expect one terminal response.
9. Manually queue a delayed request, refresh BetterDungeon while it is pending, and confirm the reloaded dispatcher completes it.

## Test Matrix

### 1. Heartbeat Full Profile

Pass:

- `frontier:heartbeat.frontier.profile` is `full`.
- `frontier:heartbeat.modules` includes `{ id: "test", ops: ["echo"] }`.

### 2. Echo Request

Pass:

- `frontier:out` contains a request with `module: "test"` and `op: "echo"`.
- `frontier:in:test.responses[requestId].status` becomes `ok`.
- Response data includes the original args under `data.got`.

### 3. Ack Tombstone

Pass:

- After the suite sees the terminal echo response, it writes the request id to `frontier:out.acks`.
- BetterDungeon removes that response from `frontier:in:test`.
- `frontier:test:full` records `echo ack tombstone`.

### 4. Unknown Op

Pass:

- A `test.missingOp` request receives `status: "err"`.
- Error code is `unknown_op`.

### 5. Unknown Module

Pass:

- A `missingmodule.echo` request receives `status: "err"`.
- Error code is `unknown_module`.

### 6. Duplicate Request Id

Pass:

- The suite writes the same request object twice in one `frontier:out.requests` array.
- BetterDungeon produces a single keyed terminal response for that request id.
- `window.Frontier.opsDispatcher.inspect().metrics.skippedDuplicate` increases.

### 7. Reload Mid-Pending

Action:

- Type a prompt containing `ff delay` or `[[ff:delay]]`.
- Generate one output.
- Confirm `frontier:in:test` contains a `pending` response for a `delayEcho` request.
- Refresh the AI Dungeon tab before 15 seconds elapse.
- Generate or continue once after reload if needed.

Pass:

- The pending response survives reload.
- The reloaded dispatcher completes the same request with `status: "ok"`.
- The request is not duplicated into multiple response ids.

## DevTools Helpers

Useful console checks:

```js
window.Frontier?.core?.inspect?.()
window.Frontier?.registry?.inspect?.()
window.Frontier?.opsDispatcher?.inspect?.()
window.Frontier?.envelope
JSON.parse(window.Frontier.core.getCardByTitle('frontier:out').value)
JSON.parse(window.Frontier.core.getCardByTitle('frontier:in:test').value)
JSON.parse(window.Frontier.core.getCardByTitle('frontier:test:full').value)
```

## Completion Criteria

Mark the live Full Frontier test pass complete when:

- [x] Heartbeat advertises Full profile and `test.echo`.
- [x] Echo returns `ok` with the original args.
- [x] Ack tombstones the completed echo response.
- [x] Unknown op returns `err: unknown_op`.
- [x] Unknown module returns `err: unknown_module`.
- [x] Duplicate request id is skipped by the dispatcher and does not invoke a second handler response.
- [x] A delayed in-flight request survives BetterDungeon reload and completes.
- [x] No duplicate `frontier:in:test` cards appear after repeated requests or refresh.
