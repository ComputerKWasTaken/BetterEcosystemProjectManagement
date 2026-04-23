# Archived - WebFetch AI Dungeon Test Suite

This is the completed Phase 5 live validation suite. The current summary page is [09 - WebFetch Test Suite Archive](../../09-webfetch-ai-dungeon-test-suite.md).

This is the live AI Dungeon test harness for Frontier Phase 5 / WebFetch. It validates that scripts can request safe web access through the Full Frontier ops channel while BetterDungeon enforces consent, safe-method-only fetches, blocked schemes, arg validation, and response shaping.

## Files

- `webfetch-test-suite.library.js` - paste into the scenario **Library**.
- `webfetch-test-suite.output-modifier.js` - paste into the scenario **Output Modifier**.

The suite writes:

- `frontier:out` - the real Full Frontier request queue.
- `frontier:test:webfetch` - a diagnostic trace card for humans.

BetterDungeon writes:

- `frontier:in:webfetch` - responses from the WebFetch module.

## Setup

1. Load BetterDungeon with the Phase 5 build.
2. Create or open a disposable AI Dungeon scenario/adventure.
3. Paste `webfetch-test-suite.library.js` into **Library**.
4. Paste `webfetch-test-suite.output-modifier.js` into **Output Modifier**.
5. Start or continue the adventure.
6. When BetterDungeon prompts for WebFetch consent, approve:
   - `https://example.com`
   - `https://api.duckduckgo.com`
7. Generate outputs until `frontier:test:webfetch` reports `"checksPass": true`.

Note: a trace that shows `phase: "waiting for ..."` together with a new `pendingIds` entry is normally just mid-run. The suite writes one request at a time and observes the response on a later output.

If the trace remains stuck at `waiting for webfetch heartbeat`, run this in DevTools and generate one more output:

```js
window.Frontier?.registry?.enable?.('webfetch')
```

To reset the suite, type a prompt containing `wf reset` or `[[wf:reset]]` and generate one output.

After the suite passes, type `wf deny` or `[[wf:deny]]` to queue an optional denied-consent request to `https://example.org/frontier-denied`. Pre-deny the origin from DevTools, or click deny when prompted, then generate outputs until the response is recorded:

```js
window.FrontierWebFetchConsent?.setOrigin?.('https://example.org', 'deny')
```

The optional denied-origin check passes when `frontier:test:webfetch.manualDeniedPass` is `true`.

## Expected Flow

The suite advances one check at a time across normal AI Dungeon turns:

1. Wait for `frontier:heartbeat` to advertise `profile: "full"`.
2. Confirm heartbeat advertises module `webfetch` with ops `fetch` and `search`.
3. Fetch `https://example.com/` with `GET` and expect a `200` response containing `Example Domain`.
4. Request `POST https://example.com/frontier-post-blocked` and expect `err: invalid_args`.
5. Request `file:///frontier-webfetch-blocked` and expect `err: scheme_blocked`.
6. Request `webfetch.fetch` with missing args and expect `err: invalid_args`.
7. Run `webfetch.search` through DuckDuckGo's instant-answer endpoint and expect an ok response.
8. Optional: deny `https://example.org`, type `wf deny`, and expect `err: consent_denied`.

If you stop on a turn where a new request was just queued, `checksPass` will still be `false`. That is expected until the later checks complete.

## DevTools Helpers

Useful console checks:

```js
window.Frontier?.registry?.enable?.('webfetch')
window.Frontier?.registry?.inspect?.()
window.FrontierWebFetchModule?.inspect?.()
window.FrontierWebFetchConsent?.inspect?.()
window.FrontierWebFetchConsent?.setOrigin?.('https://example.com', 'allow')
window.FrontierWebFetchConsent?.setOrigin?.('https://api.duckduckgo.com', 'allow')
window.FrontierWebFetchConsent?.setOrigin?.('https://example.org', 'deny')
window.FrontierWebFetchConsent?.setOrigin?.('https://example.org', 'clear')
JSON.parse(window.Frontier.core.getCardByTitle('frontier:test:webfetch').value)
JSON.parse(window.Frontier.core.getCardByTitle('frontier:in:webfetch').value)
```

## Completion Criteria

Mark the live WebFetch test pass complete when:

- [ ] Heartbeat advertises Full profile and `webfetch.fetch` / `webfetch.search`.
- [ ] The `https://example.com/` fetch returns `status: 200` and a text body.
- [ ] Side-effectful methods such as `POST` return `err: invalid_args`.
- [ ] Blocked schemes return `err: scheme_blocked` without touching the network.
- [ ] Invalid args return `err: invalid_args`.
- [ ] Web search returns an ok DuckDuckGo response.
- [ ] Optional denied-origin check reports `manualDeniedPass: true`.
- [ ] Terminal responses are acked and tombstoned from `frontier:in:webfetch`.
