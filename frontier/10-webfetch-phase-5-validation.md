# 10 - WebFetch Phase 5 Validation

This is the final sign-off record for Frontier Phase 5 after the WebFetch hardening pass. It covers the local checks, behavior matrix, and live AI Dungeon run used to mark Phase 5 complete.

## Final Result

Phase 5 is complete as of 2026-04-23.

Recorded live results:

- `webfetch-mobut1t0`: `checksPass: true`
- `webfetch-mobv39rw`: `checksPass: true`, `manualDeniedPass: true`

This closes the original hardening review items:

- Safe-method-only WebFetch v1
- Fail-closed consent handling
- Streaming body cap in the background worker

## Scope

Phase 5 WebFetch v1 is intentionally conservative:

- `webfetch.fetch` supports `GET`, `HEAD`, and `OPTIONS` only.
- `webfetch.fetch` rejects request bodies.
- `webfetch.search` uses DuckDuckGo's instant-answer endpoint.
- Web access requires the WebFetch consent broker. Missing consent infrastructure fails closed.
- Private/local targets are blocked before the background worker is called.
- The background worker streams response bodies up to `maxBodyBytes` and reports `truncated: true` when it stops early.
- Broad `http` / `https` host permissions remain for Phase 5 and are gated by per-origin consent. Popup allowlist management is Phase 7 work.

## Files Under Test

- `BetterDungeon/background.js`
- `BetterDungeon/modules/webfetch/consent.js`
- `BetterDungeon/modules/webfetch/module.js`
- `BetterDungeon/manifest.json`
- `Project Management/frontier/archive/phase-5-webfetch-test-suite/webfetch-test-suite.library.js`
- `Project Management/frontier/archive/phase-5-webfetch-test-suite/webfetch-test-suite.output-modifier.js`
- `Project Management/frontier/09-webfetch-ai-dungeon-test-suite.md`

## Static Checks

Run from the repository workspace:

```powershell
node --check "BetterDungeon/background.js"
node --check "BetterDungeon/modules/webfetch/consent.js"
node --check "BetterDungeon/modules/webfetch/module.js"
node --check "Project Management/frontier/archive/phase-5-webfetch-test-suite/webfetch-test-suite.library.js"
node --check "Project Management/frontier/archive/phase-5-webfetch-test-suite/webfetch-test-suite.output-modifier.js"
node -e "JSON.parse(require('fs').readFileSync('BetterDungeon/manifest.json','utf8')); console.log('manifest ok')"
```

Pass criteria:

- Every `node --check` command exits cleanly.
- Manifest parse prints `manifest ok`.

## Local Behavior Matrix

Use a VM harness or mocked browser environment to validate these module-level behaviors before going live:

| Area | Action | Expected result |
|---|---|---|
| Safe GET | Call `webfetch.fetch` with `https://example.com/`, method `GET` | Background worker is called and an `ok` response is returned |
| Unsafe methods | Call `POST`, `PUT`, `PATCH`, and `DELETE` | Each returns `err: invalid_args`; no background request is sent |
| Bodies | Call safe method with `body` present | Returns `err: invalid_args`; no background request is sent |
| Missing consent broker | Remove or hide `window.FrontierWebFetchConsent` | Returns `err: consent_denied`; no background request is sent |
| Denied consent | Make `ensureAllowed` reject with `consent_denied` | Returns `err: consent_denied`; no background request is sent |
| Blocked schemes | Request `file://`, `chrome://`, or `chrome-extension://` | Returns `err: scheme_blocked` |
| Local/private hosts | Request `localhost`, `*.localhost`, `*.local`, private IPv4, loopback IPv6, ULA IPv6, or link-local IPv6 | Returns `err: scheme_blocked` |
| Rate limit | Send 21 requests to one origin inside one minute | First 20 pass consent/routing, 21st returns `err: rate_limit` |
| Stream cap | Mock a streamed response larger than `maxBodyBytes` | Response body is capped, `returnedBytes` equals the cap, and `truncated: true` |
| Dispatcher path | Queue a real `frontier:out` WebFetch request | BetterDungeon writes a terminal response to `frontier:in:webfetch` |

## Live AI Dungeon Setup

1. Reload the BetterDungeon extension after changing `manifest.json`, `background.js`, or WebFetch module files.
2. Open a disposable AI Dungeon scenario or adventure.
3. Paste `archive/phase-5-webfetch-test-suite/webfetch-test-suite.library.js` into the scenario **Library**.
4. Paste `archive/phase-5-webfetch-test-suite/webfetch-test-suite.output-modifier.js` into the scenario **Output Modifier**.
5. Start or continue the adventure.
6. If WebFetch is not advertised, run this in DevTools and generate one more output:

   ```js
   window.Frontier?.registry?.enable?.('webfetch')
   ```

7. Approve WebFetch consent prompts for:

   - `https://example.com`
   - `https://api.duckduckgo.com`

8. Generate outputs until the `frontier:test:webfetch` card reports `"checksPass": true`.

During the run, a trace that shows `phase: "waiting for ..."` plus a new request in `pendingIds` is expected. The suite advances one request per turn and observes responses on later outputs.

To reset the live suite, type `wf reset` or `[[wf:reset]]` into the adventure and generate one output.

## Expected Live Flow

The suite should advance through these phases:

1. Wait for `frontier:heartbeat` with `profile: "full"`.
2. Confirm `webfetch.fetch` and `webfetch.search` are advertised.
3. Fetch `https://example.com/` with `GET` and receive `status: 200` with `Example Domain` in the body.
4. Attempt `POST https://example.com/frontier-post-blocked` and receive `err: invalid_args`.
5. Attempt `file:///frontier-webfetch-blocked` and receive `err: scheme_blocked`.
6. Attempt `webfetch.fetch` with missing args and receive `err: invalid_args`.
7. Run `webfetch.search` and receive an `ok` DuckDuckGo response.
8. Ack terminal responses and tombstone them from `frontier:in:webfetch`.

## Manual Denied-Origin Check

After the suite reports `"checksPass": true`, validate denied consent:

1. In DevTools, clear or deny the manual test origin:

   ```js
   window.FrontierWebFetchConsent?.setOrigin?.('https://example.org', 'deny')
   ```

2. Type `wf deny` or `[[wf:deny]]` into the adventure and generate outputs until the response is recorded.
3. Inspect `frontier:test:webfetch`:

   ```js
   JSON.parse(window.Frontier.core.getCardByTitle('frontier:test:webfetch').value)
   ```

Pass criteria:

- `manualDeniedId` is non-null.
- `manualDeniedPass` is `true`.
- The completed response for `manualDeniedId` has `status: "err"` and `error.code: "consent_denied"`.
- A repeated request to `https://example.org` fails fast without a new consent approval.

## Useful DevTools Commands

```js
window.Frontier?.core?.inspect?.()
window.Frontier?.registry?.enable?.('webfetch')
window.Frontier?.registry?.inspect?.()
window.Frontier?.opsDispatcher?.inspect?.()
window.FrontierWebFetchModule?.inspect?.()
window.FrontierWebFetchConsent?.inspect?.()
window.FrontierWebFetchConsent?.setOrigin?.('https://example.com', 'allow')
window.FrontierWebFetchConsent?.setOrigin?.('https://api.duckduckgo.com', 'allow')
window.FrontierWebFetchConsent?.setOrigin?.('https://example.org', 'deny')
window.FrontierWebFetchConsent?.setOrigin?.('https://example.org', 'clear')
JSON.parse(window.Frontier.core.getCardByTitle('frontier:test:webfetch').value)
JSON.parse(window.Frontier.core.getCardByTitle('frontier:in:webfetch').value)
JSON.parse(window.Frontier.core.getCardByTitle('frontier:out').value)
```

## Phase 5 Completion Criteria

Phase 5 was marked complete when:

- [x] Static checks pass.
- [x] Local behavior matrix passes.
- [x] Live AI Dungeon suite reaches `"checksPass": true`.
- [x] Manual denied-origin check reports `manualDeniedPass: true`.
- [x] No duplicate `frontier:in:webfetch` cards appear after ack/retry/reload.
- [x] No unsafe method reaches the background worker.
- [x] No blocked scheme or private/local host reaches the background worker.
